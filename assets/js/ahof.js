const API_URL = API_CONFIG.BASE_URL;

const avoidanceColorMap = Object.fromEntries(
  avoidanceConfig.map(a => [a.name, a.color])
);

const avoidanceDifficultyMap = Object.fromEntries(
  avoidanceConfig.map((a, index) => [a.name, index])
);

/* ---------- Table Logic ---------- */

let tableData = [];
let headers = [];
let currentSort = { index: null, asc: false };
let showRatings = false;

document.querySelectorAll('input[name="view-mode"]').forEach(radio => {
  radio.addEventListener("change", e => {
    showRatings = e.target.value === "ratings";
    renderTable();
  });
});

fetch(`${API_URL}?view=ahof`)
  .then(res => res.json())
  .then(json => {
    headers = json.headers;
    tableData = json.data.filter(row => row[0] !== "");
    renderTable();
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("ahof").classList.remove("hidden");
  })
  .catch(err => {
    document.getElementById("loader").innerHTML =
      "<p style='color:red;'>Failed to load table.</p>";
    console.error(err);
  });

function renderTable() {

  const thead = document.querySelector("#ahof thead");
  const tbody = document.querySelector("#ahof tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headerRow = document.createElement("tr");

  // Rank column
  const rankTh = document.createElement("th");
  rankTh.textContent = "#";
  headerRow.appendChild(rankTh);

  // Game column
  const gameTh = document.createElement("th");
  gameTh.textContent = "Game";
  gameTh.onclick = () => sortTable(1);
  headerRow.appendChild(gameTh);

  if (!showRatings) {

    const firstTh = document.createElement("th");
    firstTh.textContent = "First Clear";
    headerRow.appendChild(firstTh);

    const latestTh = document.createElement("th");
    latestTh.textContent = "Latest Clear";
    headerRow.appendChild(latestTh);

    const totalTh = document.createElement("th");
    totalTh.textContent = "Total Clears";
    totalTh.style.cursor = "pointer";
    totalTh.onclick = () => sortTable(4);
    headerRow.appendChild(totalTh);
  } else {
    headers.slice(1).forEach((header, i) => {
      const th = document.createElement("th");
      th.textContent = header;
      th.onclick = () => sortTable(i + 2);
      headerRow.appendChild(th);
    });
  }

  thead.appendChild(headerRow);

  tableData.forEach((row, rowIndex) => {

    const tr = document.createElement("tr");

    // Rank cell
    const rankTd = document.createElement("td");
    rankTd.textContent = rowIndex + 1;
    rankTd.classList.add("stat-colored");
    tr.appendChild(rankTd);

    const gameName = row[0];

    // Game cell
    const gameTd = document.createElement("td");
    const span = document.createElement("span");
    
    span.textContent = gameName;
    span.classList.add("ahof-game-link");
    
    span.addEventListener("click", () => {
      const encodedGame = encodeURIComponent(gameName);
      window.location.href = `clears.html?game=${encodedGame}`;
    });
    
    gameTd.appendChild(span);
    
    const bg = avoidanceColorMap[gameName];
    if (bg) {
      gameTd.style.backgroundColor = bg;
      gameTd.style.color = getContrastTextColor(bg);
      gameTd.style.fontWeight = "600";
    }
    
    tr.appendChild(gameTd);
    
    if (!showRatings) {
      const first = row[row.length - 3];
      const latest = row[row.length - 2];
      const total = row[row.length - 1];
      const firstTd = document.createElement("td");
      
      if (first !== "-") {
        const span = document.createElement("span");
        span.textContent = first;
        span.classList.add("ahof-player-link");
      
        span.addEventListener("click", () => {
          const encodedPlayer = encodeURIComponent(first);
          const encodedGame = encodeURIComponent(gameName);
          window.location.href =
            `clears.html?player=${encodedPlayer}&game=${encodedGame}`;
        });
      
        firstTd.appendChild(span);
      } else {
        firstTd.textContent = "-";
      }
      
      tr.appendChild(firstTd);
      
      const latestTd = document.createElement("td");
      
      if (latest !== "-") {
        const span = document.createElement("span");
        span.textContent = latest;
        span.classList.add("ahof-player-link");
      
        span.addEventListener("click", () => {
          const encodedPlayer = encodeURIComponent(latest);
          const encodedGame = encodeURIComponent(gameName);
          window.location.href =
            `clears.html?player=${encodedPlayer}&game=${encodedGame}`;
        });
      
        latestTd.appendChild(span);
      } else {
        latestTd.textContent = "-";
      }
      
      tr.appendChild(latestTd);

      const totalTd = document.createElement("td");
      const span = document.createElement("span");
      
      span.textContent = total || "0";
      span.classList.add("ahof-total");
      totalTd.appendChild(span);
      tr.appendChild(totalTd);
    } else {

      row.slice(1).forEach((cell, i) => {

        const td = document.createElement("td");

        if (cell === "N/A") {
          td.textContent = "N/A";
          td.classList.add("na");
          tr.appendChild(td);
          return;
        }

        if (!isNaN(cell) && cell !== "") {
          const num = parseFloat(cell);
          td.textContent = num.toFixed(2);

          applyColor(td, i + 2, num);
          td.classList.add("stat-colored");
        } else {
          td.textContent = cell;
        }

        tr.appendChild(td);
      });
    }

    tbody.appendChild(tr);
  });
}

function sortTable(headerIndex) {

  // Ignore Rank
  if (headerIndex === 0) return;

  // Game sorting
  if (headerIndex === 1) {

    tableData.sort((a, b) => {

      const diffA = avoidanceDifficultyMap[a[0]];
      const diffB = avoidanceDifficultyMap[b[0]];

      if (diffA === undefined && diffB === undefined) return 0;
      if (diffA === undefined) return 1;
      if (diffB === undefined) return -1;

      return diffA - diffB;
    });

    renderTable();
    return;
  }

  // Clears Mode
  if (!showRatings) {

    // Total Clears column = index 4
    if (headerIndex === 4) {

      if (currentSort.index === headerIndex) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.index = headerIndex;
        currentSort.asc = false;
      }

      tableData.sort((a, b) => {
        const totalA = parseInt(a[a.length - 1]) || 0;
        const totalB = parseInt(b[b.length - 1]) || 0;

        return currentSort.asc
          ? totalA - totalB
          : totalB - totalA;
      });

      renderTable();
      return;
    }
    
    return;
  }

  // Ratings Mode
  const dataIndex = headerIndex - 1;

  if (currentSort.index === headerIndex) {
    currentSort.asc = !currentSort.asc;
  } else {
    currentSort.index = headerIndex;
    currentSort.asc = false;
  }

  tableData.sort((a, b) => {

    const valA = a[dataIndex];
    const valB = b[dataIndex];

    if (valA === "N/A") return 1;
    if (valB === "N/A") return -1;

    if (!isNaN(valA) && !isNaN(valB)) {
      return currentSort.asc
        ? parseFloat(valA) - parseFloat(valB)
        : parseFloat(valB) - parseFloat(valA);
    }

    return currentSort.asc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  renderTable();
}

/* ---------- Color Interpolation ---------- */

function applyColor(td, columnIndex, value) {
  
  if ([2,3,4,5,6,7,8].includes(columnIndex)) {
    td.style.color = interpolateBlueRed(value);
    td.classList.add("stat-colored");
  }

  if (columnIndex === 10) {
    td.style.color = interpolateRedGreen(value);
    td.classList.add("stat-colored");
  }
}

function interpolateBlueRed(val) {
  const ratio = Math.max(0, Math.min(10, val)) / 10;
  const r = Math.round(255 * ratio);
  const g = 0;
  const b = Math.round(255 * (1 - ratio));
  return `rgb(${r},${g},${b})`;
}

function interpolateRedGreen(val) {
  const ratio = Math.max(0, Math.min(10, val)) / 10;
  const r = Math.round(255 + (32 - 255) * ratio);
  const g = Math.round(0 + (172 - 0) * ratio);
  const b = Math.round(0 + (23 - 0) * ratio);
  return `rgb(${r},${g},${b})`;
}
