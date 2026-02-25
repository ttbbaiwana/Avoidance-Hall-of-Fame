const API_URL = API_CONFIG.BASE_URL;

const clearTable = document.getElementById("clear-table");
const clearThead = clearTable.querySelector("thead");
const clearTbody = clearTable.querySelector("tbody");

const avoidanceColorMap = Object.fromEntries(
  avoidanceConfig.map(a => [a.name, a.color])
);

const avoidanceDifficultyMap = Object.fromEntries(
  avoidanceConfig.map((a, index) => [a.name, index])
);

let fullData = [];
let filteredData = [];
let headers = [];
let currentSort = "date";
let currentOrder = "desc";
let clearMode = "all";
let showMakers = true;
let showTesters = true;
let exactMatchMode = false;

let autocompleteSources = {
  games: [],
  players: []
};

/* ================= FETCH ================= */

fetch(`${API_URL}?view=clear-list`)
  .then(res => res.json())
  .then(json => {

    headers = json.headers;
    fullData = json.data;
    filteredData = getBaseVisibleData();

    buildAutocompleteSources();
    populateCountryDropdown();
    setupSearch();
    setupAutocomplete();
    applyUrlFilters();

    sortData();
    renderTable();

    document.getElementById("loader").classList.add("hidden");
    clearTable.classList.remove("hidden");

    SecretManager.init({
      applyFilter,
      getSearchState: () => ({
        column: document.getElementById("search-column").value,
        input: document.getElementById("search-input").value.trim()
      }),
      getColumnSelect: () =>
        document.getElementById("search-column")
    });

  })
  .catch(err => {
    console.error(err);
    document.getElementById("loader").innerHTML =
      "<p style='color:red;'>Failed to load data.</p>";
  });

/* ================= EVENT DELEGATION ================= */

clearTbody.addEventListener("click", (e) => {

  const clickableCell = e.target.closest(".clickable-cell");
  if (
    clickableCell?.dataset.filterIndex &&
    !SecretManager.isSecretOverrideActive()
  ) {
    applyExactFilter(
      parseInt(clickableCell.dataset.filterIndex),
      clickableCell.dataset.value
    );
    return;
  }

  const badge = e.target.closest(".role-badge");
  if (badge?.dataset.secret === "curveWAH") {
    SecretManager.toggleCurveWAH();
  }
});

clearTbody.addEventListener("mouseover", (e) => {
  const badge = e.target.closest(".role-badge");
  if (badge) SecretManager.handlePlasmaHover(badge, true);
});

clearTbody.addEventListener("mouseout", (e) => {
  const badge = e.target.closest(".role-badge");
  if (badge) SecretManager.handlePlasmaHover(badge, false);
});

/* ================= AUTOCOMPLETE SOURCE ================= */

function buildAutocompleteSources() {

  const gameSet = new Set();
  const playerSet = new Set();

  for (const row of fullData) {

    const game = row[1];
    const player = row[4];

    if (!SecretManager.isSecretGame(game)) {
      gameSet.add(game);
    }

    playerSet.add(player);
  }

  autocompleteSources.games = Array.from(gameSet).sort();
  autocompleteSources.players = Array.from(playerSet).sort();
}

/* ================= SORT ================= */

function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === "-") return 0;
  const parts = timeStr.split(":").map(Number);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : 0;
}

function sortData() {

  const sortMap = {
    date: 0,
    game: 1,
    country: 2,
    player: 4,
    death: 5,
    time: 6
  };

  const col = sortMap[currentSort];

  filteredData.sort((a, b) => {

    const valA = a[col];
    const valB = b[col];

    if (currentSort === "date") {
      const dA = new Date(valA);
      const dB = new Date(valB);
      return currentOrder === "asc" ? dA - dB : dB - dA;
    }

    if (currentSort === "game") {

      const diffA = avoidanceDifficultyMap[valA];
      const diffB = avoidanceDifficultyMap[valB];

      if (diffA === undefined && diffB === undefined) {
        return new Date(a[0]) - new Date(b[0]);
      }

      if (diffA === undefined) return 1;
      if (diffB === undefined) return -1;

      if (diffA !== diffB) {
        return currentOrder === "asc"
          ? diffA - diffB
          : diffB - diffA;
      }

      return new Date(a[0]) - new Date(b[0]);
    }

    if (currentSort === "country") {

      const emptyA = !valA?.trim();
      const emptyB = !valB?.trim();

      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      return currentOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (currentSort === "player") {
      return currentOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (currentSort === "death") {

      const emptyA = !valA || valA === "-";
      const emptyB = !valB || valB === "-";

      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      return currentOrder === "asc"
        ? valA - valB
        : valB - valA;
    }

    if (currentSort === "time") {

      const emptyA = !valA || valA === "-";
      const emptyB = !valB || valB === "-";

      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      const secondsA = timeToSeconds(valA);
      const secondsB = timeToSeconds(valB);

      return currentOrder === "asc"
        ? secondsA - secondsB
        : secondsB - secondsA;
    }

  });
}

/* ================= RENDER ================= */

function renderTable() {

  clearThead.textContent = "";
  clearTbody.textContent = "";

  const fragment = document.createDocumentFragment();

  /* ===== Build first-clear map ===== */

  const firstClearMap = {};

  filteredData.forEach(row => {

    const game = row[1];
    const date = new Date(row[0]);
    const type = row[8];

    const hidden =
      (type === "M" && !showMakers) ||
      (type === "T" && !showTesters);

    if (hidden) return;

    if (!firstClearMap[game] ||
        date < new Date(firstClearMap[game][0])) {
      firstClearMap[game] = row;
    }
  });

  /* ===== HEADER ===== */

  const headerRow = document.createElement("tr");

  const numberTh = document.createElement("th");
  numberTh.textContent = "#";
  headerRow.appendChild(numberTh);

  headers.forEach((h, index) => {

    if (index === 3 || index === 8) return;

    const th = document.createElement("th");
    th.textContent = h;

    let columnKey = null;

    if (index === 0) columnKey = "date";
    if (index === 1) columnKey = "game";
    if (index === 2) columnKey = "country";
    if (index === 4) columnKey = "player";
    if (index === 5) columnKey = "death";
    if (index === 6) columnKey = "time";

    if (columnKey) {

      th.style.cursor = "pointer";

      if (columnKey === currentSort) {
        th.textContent += currentOrder === "asc" ? " ▲" : " ▼";
      }

      th.onclick = () => {
        if (currentSort === columnKey) {
          currentOrder =
            currentOrder === "asc" ? "desc" : "asc";
        } else {
          currentSort = columnKey;
          currentOrder = "asc";
        }

        sortData();
        renderTable();
      };
    }

    headerRow.appendChild(th);
  });

  clearThead.appendChild(headerRow);

  /* ===== ROWS ===== */

  let lastGame = null;
  let gameCounter = 1;

  filteredData.forEach((row, rowIndex) => {

    const tr = document.createElement("tr");

    const game = row[1];
    const type = row[8];

    const hiddenRole =
      (type === "M" && !showMakers) ||
      (type === "T" && !showTesters);

    if (hiddenRole) tr.classList.add("role-hidden-row");

    if (
      currentSort === "game" &&
      clearMode === "all" &&
      firstClearMap[game] === row
    ) {
      tr.classList.add("first-clear-row");
    }

    if (currentSort === "game" && rowIndex > 0) {
      const prevGame = filteredData[rowIndex - 1][1];
      if (game !== prevGame) {
        tr.classList.add("game-divider");
      }
    }

    let displayNumber;

    if (currentSort === "game" && clearMode === "all") {

      if (game !== lastGame) {
        gameCounter = 1;
        lastGame = game;
      }

      displayNumber = hiddenRole ? "" : gameCounter++;
    }
    else {
      displayNumber = rowIndex + 1;
    }

    const numberTd = document.createElement("td");
    numberTd.textContent = displayNumber;
    tr.appendChild(numberTd);

    for (let index = 0; index < row.length; index++) {

      if (index === 3 || index === 8) continue;

      const cell = row[index];
      const td = document.createElement("td");

      if ([0,1,2,4].includes(index)) {
        td.className = "clickable-cell";
        td.dataset.filterIndex = index;
        td.dataset.value = cell;
      }

      if (index === 1) {
      
        td.textContent = cell;
        
        const secretStyle = SecretManager.getSecretStyle(cell);
      
        if (secretStyle) {     
          td.style.backgroundColor = secretStyle.backgroundColor;      
          td.style.color = getContrastTextColor(secretStyle.backgroundColor);      
          td.style.fontWeight = secretStyle.fontWeight;      
        }
        else {
          const bg = avoidanceColorMap[cell];
      
          if (bg) {
            td.style.backgroundColor = bg;
            td.style.color = getContrastTextColor(bg);
            td.style.fontWeight = "600";
          }
        }
      }

      else if (index === 2 && cell) {
        const flag = document.createElement("span");
        flag.className = `fi fi-${cell.toLowerCase()} flag-icon`;
        td.appendChild(flag);
      }

      else if (index === 4) {

        const wrapper = document.createElement("div");
        wrapper.className = "player-cell";

        const avatar = document.createElement("img");
        avatar.className = "avatar-img";
        avatar.loading = "lazy";
        avatar.referrerPolicy = "no-referrer";
        avatar.src = row[3] || "assets/images/Default.jpg";
        avatar.onerror = () => avatar.src = "assets/images/Default.jpg";

        const name = document.createElement("span");
        name.textContent = cell;

        wrapper.appendChild(avatar);
        wrapper.appendChild(name);

        if (type === "M" || type === "T") {

          const badge = document.createElement("span");
          badge.className =
            `role-badge ${type === "M"
              ? "maker-badge"
              : "tester-badge"}`;
          badge.textContent = type;

          if (
            row[4] === "PlasmaNapkin" &&
            row[1] === "I Wanna Wane" &&
            type === "M"
          ) {
            badge.dataset.secret = "curveWAH";
            badge.style.cursor = "pointer";
          }

          wrapper.appendChild(badge);
        }

        td.appendChild(wrapper);
      }

      else if (index === 5 || index === 6) {
        td.textContent = cell
          ? cell.replace(".000", "")
          : "-";
      }

      else if (index === 7 && cell?.startsWith("http")) {
        const a = document.createElement("a");
        a.href = cell;
        a.textContent = "Video";
        a.target = "_blank";
        td.appendChild(a);
      }

      else {
        td.textContent = cell;
      }

      tr.appendChild(td);
    }

    fragment.appendChild(tr);
  });

  clearTbody.appendChild(fragment);

  updateRowCount();
  updateFilterSummary();
}

/* ================= FILTER + SEARCH + URL ================= */

function applyFilter() {

  const column = document.getElementById("search-column").value;
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");
  const query = input.value.trim().toLowerCase();

  filteredData = getBaseVisibleData();

  if (column === "country" && countrySelect.value) {
    filteredData = filteredData.filter(row =>
      row[2] === countrySelect.value
    );
  }

  else if (column !== "country" && query) {

    const columnIndexMap = {
      date: 0,
      game: 1,
      player: 4
    };

    const colIndex = columnIndexMap[column];

    filteredData = filteredData.filter(row => {
      const cell = row[colIndex];
      if (!cell) return false;

      const value = cell.toLowerCase();

      return exactMatchMode
        ? value === query
        : value.includes(query);
    });
  }

  filteredData = SecretManager.applySecrets(
    column,
    filteredData,
    fullData
  );

  applyClearMode();
  sortData();
  renderTable();
}

function getBaseVisibleData() {
  return fullData.filter(row =>
    !SecretManager.isSecretGame(row[1])
  );
}

function populateCountryDropdown() {

  const select = document.getElementById("country-select");

  const countries = [...new Set(
    fullData.map(row => row[2])
  )]
    .filter(Boolean)
    .sort();

  select.innerHTML = "<option value=''>Select country</option>";

  countries.forEach(country => {

    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    select.appendChild(option);
  });
}

function applyClearMode() {

  if (clearMode === "all") return;

  const gameMap = {};

  filteredData.forEach(row => {

    const game = row[1];
    const date = new Date(row[0]);

    if (!gameMap[game]) {
      gameMap[game] = row;
      return;
    }

    const existingDate = new Date(gameMap[game][0]);

    if (
      (clearMode === "first" && date < existingDate) ||
      (clearMode === "latest" && date > existingDate)
    ) {
      gameMap[game] = row;
    }
  });

  filteredData = Object.values(gameMap);
}

function updateRowCount() {
  const rowCountElement = document.getElementById("row-count");
  if (!rowCountElement) return;
  const count = filteredData.length;
  rowCountElement.textContent = `Showing ${count} Clear${count === 1 ? "" : "s"}`;
}

function updateFilterSummary() {

  const summaryEl = document.getElementById("filter-summary");

  if (!summaryEl) return;

  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  const parts = [];

  if (clearMode === "first") {
    parts.push("First Clears");
  }
  else if (clearMode === "latest") {
    parts.push("Latest Clears");
  }
  else {
    parts.push("All Clears");
  }

  if (!showMakers) parts.push("Makers Hidden");
  if (!showTesters) parts.push("Testers Hidden");

  const selectedColumn = columnSelect.value;

  if (selectedColumn === "country" && countrySelect.value) {
    parts.push(`Country = ${countrySelect.value}`);
  }
  else if (input.value.trim() !== "") {
    const columnLabel = columnSelect.options[columnSelect.selectedIndex].text;
    parts.push(`${columnLabel} = ${input.value.trim()}`);
  }

  summaryEl.textContent = `Showing: ${parts.join(" | ")}`;
}

function updateSearchPlaceholder() {

  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");
  const selectedText = columnSelect.options[columnSelect.selectedIndex].text;

  input.placeholder = `Search ${selectedText}...`;
}

function setupSearch() {

  const input = document.getElementById("search-input");
  const columnSelect = document.getElementById("search-column");
  const countrySelect = document.getElementById("country-select");
  const clearBtn = document.getElementById("clear-search");

  updateSearchPlaceholder();

  document.querySelectorAll('input[name="clear-mode"]').forEach(radio => {
    radio.addEventListener("change", e => {
      clearMode = e.target.value;
      applyFilter();
    });
  });

  document
    .getElementById("show-makers")
    .addEventListener("change", e => {
      showMakers = e.target.checked;
      applyFilter();
    });

  document
    .getElementById("show-testers")
    .addEventListener("change", e => {
      showTesters = e.target.checked;
      applyFilter();
    });

  input.addEventListener("input", () => {
    exactMatchMode = false;
    SecretManager.resetSecrets();
    applyFilter();
  });

  countrySelect.addEventListener("change", () => {
    exactMatchMode = false;
    SecretManager.resetSecrets();
    applyFilter();
  });

  columnSelect.addEventListener("change", () => {
  
    input.value = "";
    countrySelect.value = "";
  
    if (columnSelect.value === "country") {
      input.classList.add("hidden");
      countrySelect.classList.remove("hidden");
    }
    else {
      countrySelect.classList.add("hidden");
      input.classList.remove("hidden");
      updateSearchPlaceholder();
    }
  
    SecretManager.resetSecrets();
    applyFilter();
  });

  clearBtn.addEventListener("click", () => {
  
    input.value = "";
    countrySelect.value = "";
    columnSelect.value = "date";
  
    exactMatchMode = false;
  
    countrySelect.classList.add("hidden");
    input.classList.remove("hidden");
  
    updateSearchPlaceholder();
  
    SecretManager.resetSecrets();
  
    filteredData = getBaseVisibleData();
    sortData();
    renderTable();
  });
}

function setupAutocomplete() {

  const input = document.getElementById("search-input");
  const list = document.getElementById("autocomplete-list");
  const columnSelect = document.getElementById("search-column");

  input.addEventListener("input", () => {

    const query = input.value.trim().toLowerCase();
    const column = columnSelect.value;

    list.textContent = "";

    if (!query) {
      list.classList.add("hidden");
      return;
    }

    let source;

    if (column === "game") {
      source = autocompleteSources.games;
    }
    else if (column === "player") {
      source = autocompleteSources.players;
    }
    else {
      list.classList.add("hidden");
      return;
    }

    const startsWithMatches = [];
    const includesMatches = [];

    for (const item of source) {

      const lowerItem = item.toLowerCase();

      if (lowerItem.startsWith(query)) {
        startsWithMatches.push(item);
      }
      else if (lowerItem.includes(query)) {
        includesMatches.push(item);
      }

      if (startsWithMatches.length +
          includesMatches.length >= 20) {
        break;
      }
    }

    const matches = [
      ...startsWithMatches,
      ...includesMatches
    ].slice(0, 10);

    if (matches.length === 0) {
      list.classList.add("hidden");
      return;
    }

    const fragment = document.createDocumentFragment();

    matches.forEach(match => {

      const div = document.createElement("div");

      div.className = "autocomplete-item";
      div.dataset.value = match;
      div.textContent = match;

      fragment.appendChild(div);
    });

    list.appendChild(fragment);
    list.classList.remove("hidden");
  });

  list.addEventListener("click", e => {

    const item = e.target.closest(".autocomplete-item");

    if (!item) return;

    input.value = item.dataset.value;
    exactMatchMode = true;
    list.classList.add("hidden");
    applyFilter();
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete-wrapper")) {
      list.classList.add("hidden");
    }
  });
}

function applyUrlFilters() {

  const params = new URLSearchParams(window.location.search);
  const playerParam = params.get("player");
  const gameParam = params.get("game");

  if (!playerParam && !gameParam) return;

  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  if (playerParam) {
    columnSelect.value = "player";
    input.classList.remove("hidden");
    countrySelect.classList.add("hidden");
    input.value = playerParam;
    exactMatchMode = true;
  }

  applyFilter();

  if (gameParam) {
    filteredData = filteredData.filter(row =>
        row[1] === gameParam
      );
    renderTable();
  }
}

function applyExactFilter(columnIndex, value) {

  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  const columnMap = {
    0: "date",
    1: "game",
    2: "country",
    4: "player"
  };

  const selectedColumn = columnMap[columnIndex];

  if (!selectedColumn) return;

  columnSelect.value = selectedColumn;
  updateSearchPlaceholder();

  if (selectedColumn === "country") {
    input.classList.add("hidden");
    countrySelect.classList.remove("hidden");
    countrySelect.value = value;
  } else {
    countrySelect.classList.add("hidden");
    input.classList.remove("hidden");
    input.value = value;
  }

  exactMatchMode = true;
  SecretManager.resetSecrets();
  
  applyFilter();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
