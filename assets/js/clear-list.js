const API_URL = "https://script.google.com/macros/s/AKfycbwNjbI5YyD4jA4_sFj6IqZ4uyVOJ7U2b31dIaqOH7rNkvs8hhB5BF4ZOxVcxFjkjcCr/exec";

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
  });

/* =============================
   Sorting
============================= */

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

    if (currentSort === "time") {
      return currentOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return currentOrder === "asc"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });
}

/* =============================
   Table Rendering
============================= */

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
