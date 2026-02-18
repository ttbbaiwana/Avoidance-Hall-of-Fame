const API_URL = "https://script.google.com/macros/s/AKfycbwNjbI5YyD4jA4_sFj6IqZ4uyVOJ7U2b31dIaqOH7rNkvs8hhB5BF4ZOxVcxFjkjcCr/exec";

const avoidanceColorMap = Object.fromEntries(
  avoidanceConfig.map(a => [a.name, a.color])
);

const avoidanceDifficultyMap = Object.fromEntries(
  avoidanceConfig.map((a, index) => [a.name, index])
);

let fullData = [];
let headers = [];
let currentSort = "date";
let currentOrder = "desc";

fetch(`${API_URL}?view=clear-list`)
  .then(res => res.json())
  .then(json => {
    headers = json.headers;
    fullData = json.data;

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
    time: 4
  };

  const col = sortMap[currentSort];

  fullData.sort((a, b) => {

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

  const headerRow = document.createElement("tr");

  headers.forEach((h, index) => {
    const th = document.createElement("th");
    th.textContent = h;

    // Enable sorting for Date, Game, Time
    if ([0, 1, 4].includes(index)) {
      th.style.cursor = "pointer";

      th.onclick = () => {
        const sortKeys = ["date", "game", null, null, "time"];
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

  fullData.forEach(row => {

    const tr = document.createElement("tr");

    row.forEach((cell, index) => {

      const td = document.createElement("td");
      
      if (index === 1) {
        td.textContent = cell;
      
        const bg = avoidanceColorMap[cell];
      
        if (bg) {
          td.style.backgroundColor = bg;
          td.style.color = getContrastTextColor(bg);
          td.style.fontWeight = "600";
        }
      
        tr.appendChild(td);
        return;
      }

      if (index === 3 || index === 4) {
        td.textContent = cell ? cell.replace(".000", "") : "-";
      }
      else if (index === 5 && cell && cell.startsWith("http")) {
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
}
