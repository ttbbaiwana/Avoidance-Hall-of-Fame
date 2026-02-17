const pageCache = {};
const API_URL = "https://script.google.com/macros/s/AKfycbwNjbI5YyD4jA4_sFj6IqZ4uyVOJ7U2b31dIaqOH7rNkvs8hhB5BF4ZOxVcxFjkjcCr/exec";
const PAGE_SIZE = 100;
const PAGE_WINDOW = 5;

let currentPage = 1;
let totalRows = 0;
let totalPages = 1;

let currentSort = "date";
let currentOrder = "desc";

const avoidanceColorMap = Object.fromEntries(
  avoidanceConfig.map(a => [a.name, a.color])
);

function renderTable(headers, data) {
  const thead = document.querySelector("#clear-table thead");
  const tbody = document.querySelector("#clear-table tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headerRow = document.createElement("tr");
  headers.forEach((h, index) => {
    const th = document.createElement("th");
    th.textContent = h;
  
    // Enable sorting only for Date (0), Game (1), Time (4)
    if ([0, 1, 4].includes(index)) {
      th.style.cursor = "pointer";
  
      th.onclick = () => {
        const sortKeys = ["date", "game", null, null, "time"];
        const selectedSort = sortKeys[index];
  
        if (currentSort === selectedSort) {
          currentOrder = currentOrder === "asc" ? "desc" : "asc";
        } else {
          currentSort = selectedSort;
          currentOrder = "asc";
        }
        
        pageCache = {};
        loadPage(1);
      };
    }
  
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  data.forEach(row => {
    const tr = document.createElement("tr");

    row.forEach((cell, index) => {
      const td = document.createElement("td");
      
      // DATE
      if (index === 0) {
        td.textContent = cell;
      }

      // GAME
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
    
      // DEATH
      else if (index === 3) {
        td.textContent = cell ? cell : "-";
      }
      
      // TIME
      else if (index === 4) {
        td.textContent = cell ? cell.replace(".000", "") : "-";
      }

      // VIDEO LINK
      else if (index === 5 && typeof cell === "string" && cell.startsWith("http")) {
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

function loadPage(page) {

  if (totalPages > 1) {
    page = Math.max(1, Math.min(page, totalPages));
  }

  const cacheKey = `${currentSort}-${currentOrder}-${page}`;

  document.getElementById("loader").classList.remove("hidden");
  document.getElementById("clear-table").classList.add("hidden");

  if (pageCache[cacheKey]) {
    renderTable(
      pageCache[cacheKey].headers,
      pageCache[cacheKey].data
    );

    currentPage = page;
    renderPagination();

    document.getElementById("loader").classList.add("hidden");
    document.getElementById("clear-table").classList.remove("hidden");
    return;
  }

  fetch(`${API_URL}?view=clear-list&page=${page}&pageSize=${PAGE_SIZE}&sort=${currentSort}&order=${currentOrder}`)
    .then(res => res.json())
    .then(json => {

      pageCache[cacheKey] = json;

      totalRows = json.total;
      totalPages = Math.ceil(totalRows / PAGE_SIZE);
      currentPage = page;

      renderTable(json.headers, json.data);
      renderPagination();

      document.getElementById("loader").classList.add("hidden");
      document.getElementById("clear-table").classList.remove("hidden");

      if (totalPages > 1) {
        prefetchPage(page + 1);
        prefetchPage(page - 1);
      }
    });
}

function prefetchPage(page) {

  if (page < 1 || page > totalPages) return;

  const cacheKey = `${currentSort}-${currentOrder}-${page}`;

  if (pageCache[cacheKey]) return;

  fetch(`${API_URL}?view=clear-list&page=${page}&pageSize=${PAGE_SIZE}&sort=${currentSort}&order=${currentOrder}`)
    .then(res => res.json())
    .then(json => {
      pageCache[cacheKey] = json;
    });
}

function renderPagination() {
  renderPaginationInto("pagination-top");
  renderPaginationInto("pagination-bottom");
}

function renderPaginationInto(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  addButton(container, "First", () => loadPage(1), currentPage === 1);
  addButton(container, "<<", () => loadPage(currentPage - 10), currentPage <= 10);

  const start = Math.max(1, currentPage - PAGE_WINDOW);
  const end = Math.min(totalPages, currentPage + PAGE_WINDOW);

  for (let i = start; i <= end; i++) {
    const isCurrent = i === currentPage;
    addButton(container, i, () => loadPage(i), false, isCurrent);
  }

  addButton(container, ">>", () => loadPage(currentPage + 10), currentPage + 10 > totalPages);
  addButton(container, "Last", () => loadPage(totalPages), currentPage === totalPages);
}

function addButton(container, label, onClick, disabled = false, active = false) {
  const btn = document.createElement("button");
  btn.textContent = label;

  if (active) {
    btn.classList.add("active-page");
  }

  btn.disabled = disabled;
  btn.onclick = onClick;

  container.appendChild(btn);
}

pageCache = {};
loadPage(1);
