const API_URL = API_CONFIG.BASE_URL;

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
let rumaSecretMode = false;

/* ================= FETCH ================= */

fetch(`${API_URL}?view=clear-list`)
  .then(res => res.json())
  .then(json => {
    headers = json.headers;
    fullData = json.data;
    filteredData = [...fullData];

    populateCountryDropdown();
    setupSearch();
    setupAutocomplete();
    applyUrlFilters();

    sortData();
    renderTable();

    document.getElementById("loader").classList.add("hidden");
    document.getElementById("clear-table").classList.remove("hidden");
  })
  .catch(err => {
    console.error(err);
    document.getElementById("loader").innerHTML =
      "<p style='color:red;'>Failed to load data.</p>";
  });

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
    
      // Handle missing games safely
      if (diffA === undefined && diffB === undefined) return 0;
      if (diffA === undefined) return 1;
      if (diffB === undefined) return -1;
    
      // Primary: difficulty
      if (diffA !== diffB) {
        return currentOrder === "asc"
          ? diffA - diffB
          : diffB - diffA;
      }
      
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
    
      return dateA - dateB;
    }

    if (currentSort === "country") {
    
      const emptyA = !valA || valA.trim() === "";
      const emptyB = !valB || valB.trim() === "";
      
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
    
      const isEmptyA = !valA || valA === "-" || valA.trim() === "";
      const isEmptyB = !valB || valB === "-" || valB.trim() === "";
      
      if (isEmptyA && isEmptyB) return 0;
      if (isEmptyA) return 1;
      if (isEmptyB) return -1;
      
      return currentOrder === "asc"
        ? valA - valB
        : valB - valA;
    }

    if (currentSort === "time") {
    
      const isEmptyA = !valA || valA === "-" || valA.trim() === "";
      const isEmptyB = !valB || valB === "-" || valB.trim() === "";
      
      if (isEmptyA && isEmptyB) return 0;
      if (isEmptyA) return 1;
      if (isEmptyB) return -1;
    
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

  const thead = document.querySelector("#clear-table thead");
  const tbody = document.querySelector("#clear-table tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const searchColumn = document.getElementById("search-column").value;
  const searchInput = document.getElementById("search-input");

  const isPlayerFilterActive =
    searchColumn === "player" &&
    searchInput.value.trim() !== "";

  const isDateFilterActive =
    searchColumn === "date" &&
    searchInput.value.trim() !== "";

  const isGameSorted =
    currentSort === "game" &&
    clearMode === "all" &&
    !isPlayerFilterActive;

  /* ===== First Clear Map ===== */

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

  /* ===== Header ===== */

  const headerRow = document.createElement("tr");

  const numberTh = document.createElement("th");
  numberTh.textContent = "#";
  
  numberTh.addEventListener("mouseenter", () => {
    if (isRumaSearchActive()) {
      numberTh.textContent = "?";
    }
  });
  
  numberTh.addEventListener("mouseleave", () => {
    numberTh.textContent = "#";
  });
  
  numberTh.addEventListener("click", () => {
    if (isRumaSearchActive()) {
      rumaSecretMode = !rumaSecretMode;
      applyFilter();
    }
  });

headerRow.appendChild(numberTh);

  const sortKeys = ["date","game","country","player","death","time"];

  headers.forEach((h, index) => {
  
    // Skip Avatar and Type columns
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
        th.innerHTML += currentOrder === "asc" ? " ▲" : " ▼";
      }
  
      th.onclick = () => {
  
        if (currentSort === columnKey) {
          currentOrder = currentOrder === "asc" ? "desc" : "asc";
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

  thead.appendChild(headerRow);

  /* ===== Rows ===== */

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
      !isDateFilterActive &&
      !isPlayerFilterActive &&
      firstClearMap[game] === row
    ) {
      tr.classList.add("first-clear-row");
    }

    if (isGameSorted && rowIndex > 0) {
      const prevGame = filteredData[rowIndex - 1][1];
      if (game !== prevGame) {
        tr.classList.add("game-divider");
      }
    }

    let displayNumber;

    if (isGameSorted) {
      if (game !== lastGame) {
        gameCounter = 1;
        lastGame = game;
      }
      displayNumber = hiddenRole ? "" : gameCounter++;
    } else {
      displayNumber = rowIndex + 1;
    }

    const numberTd = document.createElement("td");
    numberTd.textContent = displayNumber;
    numberTd.classList.add("number-cell");
    tr.appendChild(numberTd);

    row.forEach((cell, index) => {

      if (index === 3 || index === 8) return; // skip Avatar + Type

      const td = document.createElement("td");

      /* Click filter */
      if ([0, 1, 2, 4].includes(index)) {
        td.classList.add("clickable-cell");
        td.onclick = () => applyExactFilter(index, cell);
      }

      if (index === 1) {
        td.classList.add("hover-game");
        td.textContent = cell;
        const bg = avoidanceColorMap[cell];
        if (bg) {
          td.style.backgroundColor = bg;
          td.style.color = getContrastTextColor(bg);
          td.style.fontWeight = "600";
        }
      }
      
      else if (index === 2) {
        if (cell && cell.trim() !== "") {
          const flag = document.createElement("span");
          flag.classList.add("fi", `fi-${cell.trim().toLowerCase()}`);
          flag.classList.add("flag-icon");
          flag.classList.add("hover-flag");
          td.appendChild(flag);
        }
      }
      
      else if (index === 4) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("player-cell");

        const avatar = document.createElement("img");
        avatar.classList.add("avatar-img");
        avatar.loading = "lazy";
        avatar.src = row[3] || "assets/images/Default.jpg";
        avatar.onerror = () =>
          avatar.src = "assets/images/Default.jpg";

        const name = document.createElement("span");
        name.textContent = cell;

        wrapper.appendChild(avatar);
        wrapper.appendChild(name);

        if (type === "M" || type === "T") {
          const badge = document.createElement("span");
          badge.textContent = type;
          badge.classList.add("role-badge");
          if (type === "M") badge.classList.add("maker-badge");
          if (type === "T") badge.classList.add("tester-badge");
          wrapper.appendChild(badge);
        }

        td.appendChild(wrapper);
      }

      else if (index === 5 || index === 6) {
        td.textContent = cell ? cell.replace(".000", "") : "-";
      }

      else if (index === 7 && cell?.startsWith("http")) {
        const a = document.createElement("a");
        a.href = cell;
        a.textContent = "Video";
        a.target = "_blank";
        td.classList.add("clickable-cell");
        td.appendChild(a);
      }

      else {
        td.textContent = cell;
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  updateRowCount();
  updateFilterSummary();
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

  document.getElementById("show-makers")
    .addEventListener("change", e => {
      showMakers = e.target.checked;
      applyFilter();
    });

  document.getElementById("show-testers")
    .addEventListener("change", e => {
      showTesters = e.target.checked;
      applyFilter();
    });
  
  input.addEventListener("input", () => {
    rumaSecretMode = false;
    exactMatchMode = false;
    applyFilter();
  });

  countrySelect.addEventListener("change", () => {
    rumaSecretMode = false;
    exactMatchMode = false;
    applyFilter();
  });

  columnSelect.addEventListener("change", () => {
    rumaSecretMode = false;
    exactMatchMode = false;
    input.value = "";
    countrySelect.value = "";

    if (columnSelect.value === "country") {
      input.classList.add("hidden");
      countrySelect.classList.remove("hidden");
    } else {
      countrySelect.classList.add("hidden");
      input.classList.remove("hidden");
      updateSearchPlaceholder();
    }

    applyFilter();
  });

  clearBtn.addEventListener("click", () => {
    rumaSecretMode = false;
    input.value = "";
    countrySelect.value = "";
    exactMatchMode = false;
    updateSearchPlaceholder();
    applyFilter();
  });
}

function applyFilter() {
  const column = document.getElementById("search-column").value;
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  const query = input.value.trim().toLowerCase();

  // Reset base
  filteredData = fullData.filter(row =>
    row[1] !== "I wanna Ruma - Extra"
  );

  // Country filter
  if (column === "country" && countrySelect.value) {

    filteredData = filteredData.filter(row =>
      row[2] === countrySelect.value
    );
  }

  // Text filter
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

  // Secret Ruma mode
  if (rumaSecretMode) {
    filteredData = fullData.filter(row =>
      row[1] === "I wanna Ruma - Extra"
    );
  }
  
  applyClearMode();
  sortData();
  renderTable();
}

function updateRowCount() {
  const rowCountElement = document.getElementById("row-count");

  if (!rowCountElement) return;

  const count = filteredData.length;
  rowCountElement.textContent = `Returned ${count} row${count === 1 ? "" : "s"}`;
}

function populateCountryDropdown() {
  const select = document.getElementById("country-select");

  const countries = [...new Set(fullData.map(row => row[2]))]
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
  applyFilter();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupAutocomplete() {

  const input = document.getElementById("search-input");
  const list = document.getElementById("autocomplete-list");
  const columnSelect = document.getElementById("search-column");

  input.addEventListener("input", () => {

    const value = input.value.toLowerCase();
    const selectedColumn = columnSelect.value;

    list.innerHTML = "";

    if (!value) {
      list.classList.add("hidden");
      return;
    }

    let source = [];

    if (selectedColumn === "game") {
      source = [...new Set(
        fullData
          .map(row => row[1])
          .filter(game => game !== "I wanna Ruma - Extra")
      )].sort();
    } 
    else if (selectedColumn === "player") {
      source = [...new Set(fullData.map(row => row[3]))].sort();
    } else {
      list.classList.add("hidden");
      return;
    }

    const lowerValue = value.toLowerCase();
    
    const startsWithMatches = [];
    const includesMatches = [];
    
    source.forEach(item => {
      const lowerItem = item.toLowerCase();
    
      if (lowerItem.startsWith(lowerValue)) {
        startsWithMatches.push(item);
      }
      else if (lowerItem.includes(lowerValue)) {
        includesMatches.push(item);
      }
    });

    startsWithMatches.sort();
    includesMatches.sort();
    
    const matches = [
      ...startsWithMatches,
      ...includesMatches
    ].slice(0, 10);

    if (matches.length === 0) {
      list.classList.add("hidden");
      return;
    }

    matches.forEach(match => {
      const div = document.createElement("div");
      div.classList.add("autocomplete-item");
      div.textContent = match;

      div.addEventListener("click", () => {
        input.value = match;
        exactMatchMode = true;
        list.classList.add("hidden");
        applyFilter();
      });

      list.appendChild(div);
    });

    list.classList.remove("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete-wrapper")) {
      list.classList.add("hidden");
    }
  });
}

function updateFilterSummary() {

  const summaryEl = document.getElementById("filter-summary");

  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  const parts = [];

  if (clearMode === "first") {
    parts.push("First Clears");
  } else if (clearMode === "latest") {
    parts.push("Latest Clears");
  } else {
    parts.push("All Clears");
  }
  
  if (!showMakers) parts.push("Makers Hidden");
  if (!showTesters) parts.push("Testers Hidden");

  // Search filter
  const selectedColumn = columnSelect.value;

  if (selectedColumn === "country" && countrySelect.value) {
    parts.push(`Country = ${countrySelect.value}`);
  }
  else if (input && input.value.trim() !== "") {
    parts.push(`${columnSelect.options[columnSelect.selectedIndex].text} = ${input.value.trim()}`);
  }

  summaryEl.textContent = `Showing: ${parts.join(" | ")}`;
}

function updateSearchPlaceholder() {
  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");

  const selectedText =
    columnSelect.options[columnSelect.selectedIndex].text;

  input.placeholder = `Search ${selectedText}...`;
}

function applyUrlFilters() {

  const params = new URLSearchParams(window.location.search);

  const playerParam = params.get("player");

  if (!playerParam) return;

  const columnSelect = document.getElementById("search-column");
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  columnSelect.value = "player";

  input.classList.remove("hidden");
  countrySelect.classList.add("hidden");

  input.value = playerParam;

  exactMatchMode = true;

  applyFilter();
}

function isRumaSearchActive() {

  const column = document.getElementById("search-column").value;
  const input = document.getElementById("search-input").value.trim();

  return (
    column === "game" &&
    input === "I wanna Ruma"
  );
}
