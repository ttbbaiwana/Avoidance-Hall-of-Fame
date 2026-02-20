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

fetch(`${API_URL}?view=clear-list`)
  .then(res => res.json())
  .then(json => {
    headers = json.headers;
    fullData = json.data;
    filteredData = [...fullData];
    
    populateCountryDropdown();
    sortData();
    renderTable();
    setupSearch();
    
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("clear-table").classList.remove("hidden");
  })
  .catch(err => {
    console.error(err);
    document.getElementById("loader").innerHTML =
      "<p style='color:red;'>Failed to load data.</p>";
  });

function timeToSeconds(timeStr) {

  if (!timeStr || timeStr === "-") return 0;

  const parts = timeStr.split(":").map(Number);

  // H:M:S
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

function sortData() {
  const sortMap = {
    date: 0,
    game: 1,
    country: 2,
    player: 3,
    death: 4,
    time: 5
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

function renderTable() {

  const thead = document.querySelector("#clear-table thead");
  const tbody = document.querySelector("#clear-table tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";
  
  const searchColumn = document.getElementById("search-column").value;
  const input = document.getElementById("search-input");
  const firstClearMap = {};

  const isPlayerFilterActive =
    searchColumn === "player" &&
    input &&
    input.value.trim() !== "";
  
  const isGameSorted =
    currentSort === "game" &&
    clearMode === "all" &&
    !isPlayerFilterActive;

  filteredData.forEach(row => {
    const game = row[1];
    const date = new Date(row[0]);
    const type = row[7];
  
    const isHiddenRole =
      (type === "M" && !showMakers) ||
      (type === "T" && !showTesters);
  
    if (isHiddenRole) return;
  
    if (!firstClearMap[game] || date < new Date(firstClearMap[game][0])) {
      firstClearMap[game] = row;
    }
  });
  
  const headerRow = document.createElement("tr");

  const numberTh = document.createElement("th");
  numberTh.textContent = "#";
  headerRow.appendChild(numberTh);

  headers.forEach((h, index) => {
    if (index === 7) return;

    const th = document.createElement("th");
    th.textContent = h;

    if ([0, 1, 2, 3, 4, 5].includes(index)) {
      th.style.cursor = "pointer";
      th.onclick = () => {
        const sortKeys = ["date", "game", "country", "player", "death", "time"];
        const selected = sortKeys[index];

        if (currentSort === selected) {
          currentOrder = currentOrder === "asc" ? "desc" : "asc";
        } else {
          currentSort = selected;
          currentOrder = "asc";
        }

        sortData();
        renderTable();
      };
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  let lastGame = null;
  let gameCounter = 1;

  filteredData.forEach((row, rowIndex) => {

    const tr = document.createElement("tr");
    const game = row[1];

    const input = document.getElementById("search-input");
    const countrySelect = document.getElementById("country-select");
    
    const isDateFilterActive =
      searchColumn === "date" &&
      input &&
      input.value.trim() !== "";
    
    const isPlayerFilterActive =
      searchColumn === "player" &&
      input &&
      input.value.trim() !== "";
    
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
    
      const type = row[7];
      const isHiddenRole =
        (type === "M" && !showMakers) ||
        (type === "T" && !showTesters);
    
      if (game !== lastGame) {
        gameCounter = 1;
        lastGame = game;
      }
    
      if (!isHiddenRole) {
        displayNumber = gameCounter++;
      } else {
        displayNumber = "";
      }
    
    } else {
      displayNumber = rowIndex + 1;
    }

    const numberTd = document.createElement("td");
    numberTd.textContent = displayNumber;
    numberTd.classList.add("number-cell");
    tr.appendChild(numberTd);

    row.forEach((cell, index) => {

      const type = row[7];

      if (
        (type === "M" && !showMakers) ||
        (type === "T" && !showTesters)
      ) {
        tr.classList.add("role-hidden-row");
      }

      if (index === 7) return;

      const td = document.createElement("td");

      if ([0, 1, 2, 3].includes(index)) {
        td.style.cursor = "pointer";
        td.addEventListener("click", () => {
          applyExactFilter(index, cell);
        });
      }

      if (index === 1) {
        td.textContent = cell;
        const bg = avoidanceColorMap[cell];
        if (bg) {
          td.style.backgroundColor = bg;
          td.style.color = getContrastTextColor(bg);
          td.style.fontWeight = "600";
        }
      }

      else if (index === 2) {
        const img = document.createElement("img");
        img.src = `assets/images/flags/${cell.trim()}.png`;
        img.classList.add("flag-img");
        img.loading = "lazy";
        img.onerror = function () { this.style.display = "none"; };
        td.appendChild(img);
      }

      else if (index === 3) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("player-cell");

        const img = document.createElement("img");
        img.loading = "lazy";
        img.classList.add("avatar-img");
        img.src = `assets/images/avatars/${cell.trim()}.jpg`;
        img.onerror = function () {
          this.src = "assets/images/avatars/Default.jpg";
        };

        const nameSpan = document.createElement("span");
        nameSpan.textContent = cell;

        wrapper.appendChild(img);
        wrapper.appendChild(nameSpan);

        const type = row[7];
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

      else if (index === 4 || index === 5) {
        td.textContent = cell ? cell.replace(".000", "") : "-";
      }

      else if (index === 6 && cell && cell.startsWith("http")) {
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
    });

    tbody.appendChild(tr);
  });

  updateRowCount();
}

function setupSearch() {
  const input = document.getElementById("search-input");
  const columnSelect = document.getElementById("search-column");
  const countrySelect = document.getElementById("country-select");
  const clearBtn = document.getElementById("clear-search");

  input.placeholder = `Search ${columnSelect.options[columnSelect.selectedIndex].text}...`;

  document.querySelectorAll('input[name="clear-mode"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      clearMode = e.target.value;
      applyFilter();
    });
  });

  document.getElementById("show-makers")
    .addEventListener("change", function(e) {
      showMakers = e.target.checked;
      applyFilter();
    });
  
  document.getElementById("show-testers")
    .addEventListener("change", function(e) {
      showTesters = e.target.checked;
      applyFilter();
    });
  
  input.addEventListener("input", () => {
    exactMatchMode = false;
    applyFilter();
  });
  
  countrySelect.addEventListener("change", () => {
    exactMatchMode = false;
    applyFilter();
  });

  columnSelect.addEventListener("change", () => {
  
    const selected = columnSelect.value;
  
    if (selected === "country") {
      input.classList.add("hidden");
      countrySelect.classList.remove("hidden");
    } else {
      input.classList.remove("hidden");
      countrySelect.classList.add("hidden");
      
      if (selected === "date") {
        input.placeholder = "Search Date...";
      }
      else if (selected === "game") {
        input.placeholder = "Search Game...";
      }
      else if (selected === "player") {
        input.placeholder = "Search Player...";
      }
    }
  
    applyFilter();
  });
  
  clearBtn.addEventListener("click", () => {
    input.value = "";
    countrySelect.value = "";
    filteredData = [...fullData];
    sortData();
    renderTable();
  });
}

function applyFilter() {

  const column = document.getElementById("search-column").value;
  const input = document.getElementById("search-input");
  const countrySelect = document.getElementById("country-select");

  if (column === "country") {

    const selectedCountry = countrySelect.value;

    if (!selectedCountry) {
      filteredData = [...fullData];
    } else {
      filteredData = fullData.filter(row =>
        row[2] === selectedCountry
      );
    }

  } else {

    const query = input.value.toLowerCase().trim();

    if (!query) {
      filteredData = [...fullData];
    } else {
      const columnIndexMap = {
        date: 0,
        game: 1,
        player: 3
      };

      const colIndex = columnIndexMap[column];

      filteredData = fullData.filter(row => {
        const cell = row[colIndex];
        if (!cell) return false;

        if (exactMatchMode) {
          return cell.toLowerCase() === query;
        }
        
        return cell.toLowerCase().includes(query);
      });
    }
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
    } else {

      const existingDate = new Date(gameMap[game][0]);

      if (clearMode === "first") {
        if (date < existingDate) {
          gameMap[game] = row;
        }
      }

      if (clearMode === "latest") {
        if (date > existingDate) {
          gameMap[game] = row;
        }
      }
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
    3: "player"
  };

  const selectedColumn = columnMap[columnIndex];
  
  columnSelect.value = selectedColumn;
  
  if (selectedColumn === "country") {

    input.classList.add("hidden");
    countrySelect.classList.remove("hidden");

    countrySelect.value = value;

  } else {

    input.classList.remove("hidden");
    countrySelect.classList.add("hidden");

    input.value = value;
  }
  
  exactMatchMode = true;
  applyFilter();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
