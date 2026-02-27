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

const ahofTable = document.getElementById("ahof");
const ahofThead = ahofTable.querySelector("thead");
const ahofTbody = ahofTable.querySelector("tbody");

ahofTbody.addEventListener("click", (e) => {

  const gameEl = e.target.closest(".ahof-game-link");
  if (gameEl) {
    const game = gameEl.dataset.game;
    window.location.href = `clears.html?game=${encodeURIComponent(game)}`;
    return;
  }

  const playerEl = e.target.closest(".clickable-cell");
  if (playerEl) {
    const player = playerEl.dataset.player;
    const game = playerEl.dataset.game;
    window.location.href =
      `clears.html?player=${encodeURIComponent(player)}&game=${encodeURIComponent(game)}`;
  }
});

document.querySelectorAll('input[name="view-mode"]').forEach(radio => {
  radio.addEventListener("change", e => {
    showRatings = e.target.value === "ratings";

    ahofTable.classList.toggle("ratings-mode", showRatings);
    ahofTable.classList.toggle("clears-mode", !showRatings);

    renderTable();
  });
});

fetch("data/ahof.json")
  .then(res => res.json())
  .then(json => {
    headers = json.headers;
    tableData = json.data.filter(row => row[0] !== "");
    renderTable();
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("ahof").classList.remove("hidden");
    ahofTable.classList.add("clears-mode");
  })
  .catch(err => {
    document.getElementById("loader").innerHTML =
      "<p style='color:red;'>Failed to load table.</p>";
    console.error(err);
  });

const avatarToggleAHoF = document.getElementById("toggle-avatars-ahof");

avatarToggleAHoF?.addEventListener("change", () => {
  ahofTable.classList.toggle("hide-avatars", !avatarToggleAHoF.checked);
});

function renderTable() {

  ahofThead.textContent = "";
  ahofTbody.textContent = "";

  /* ================= HEADER ================= */

  const headerRow = document.createElement("tr");

  const rankTh = document.createElement("th");
  rankTh.textContent = "#";
  headerRow.appendChild(rankTh);

  const gameTh = document.createElement("th");
  gameTh.textContent = "Game";
  gameTh.style.cursor = "pointer";
  gameTh.onclick = () => sortTable(1);
  headerRow.appendChild(gameTh);

  if (!showRatings) {

    ["First Clear", "Latest Clear", "Total Clears"]
      .forEach((title, i) => {

        const th = document.createElement("th");
        th.textContent = title;

        if (title === "Total Clears") {
          th.style.cursor = "pointer";
          th.onclick = () => sortTable(14);
        }

        headerRow.appendChild(th);
      });

  } else {

    const ratingHeaders = headers.slice(1, 10);

    ratingHeaders.forEach((header, i) => {

      const th = document.createElement("th");
      th.textContent = header;
      th.style.cursor = "pointer";
      th.onclick = () => sortTable(i + 2);

      headerRow.appendChild(th);
    });
  }

  ahofThead.appendChild(headerRow);

  /* ================= BODY ================= */

  const fragment = document.createDocumentFragment();

  for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {

    const row = tableData[rowIndex];
    const tr = document.createElement("tr");

    // Rank
    const rankTd = document.createElement("td");
    rankTd.textContent = rowIndex + 1;
    tr.appendChild(rankTd);

    const gameName = row[0];

    // Game
    const gameTd = document.createElement("td");
    const gameSpan = document.createElement("span");

    gameSpan.textContent = gameName;
    gameSpan.className = "ahof-game-link";
    gameSpan.dataset.game = gameName;

    const bg = avoidanceColorMap[gameName];
    if (bg) {
      gameTd.style.backgroundColor = bg;
      gameTd.style.color = getContrastTextColor(bg);
    }

    gameTd.appendChild(gameSpan);
    tr.appendChild(gameTd);

    /* ===== CLEARS MODE ===== */

    if (!showRatings) {

      const firstAvatar = "https://images.hsingh.app/?url=" + row[10] + "&w=28&output=webp" || "assets/images/Default.jpg";
      const first = row[11] || "-";
      const latestAvatar = "https://images.hsingh.app/?url=" + row[12] + "&w=28&output=webp" || "assets/images/Default.jpg";
      const latest = row[13] || "-";
      const total = row[14] || "0";

      // First
      const firstTd = document.createElement("td");

      if (first !== "-") { 
        const wrapper = document.createElement("div");
        wrapper.className = "player-cell";
      
        const avatar = document.createElement("img");
        avatar.className = "avatar-img";
        avatar.loading = "lazy";
        avatar.decoding = "async";
        avatar.referrerPolicy = "no-referrer";
        avatar.src = firstAvatar;
        avatar.width = "28";
        avatar.height = "28";
        avatar.alt = "Avatar";
        avatar.onerror = () => avatar.src = "assets/images/Default.jpg";
      
        const nameSpan = document.createElement("span");
        nameSpan.textContent = first;
        nameSpan.className = "clickable-cell";
        nameSpan.dataset.player = first;
        nameSpan.dataset.game = gameName;
      
        wrapper.appendChild(avatar);
        wrapper.appendChild(nameSpan);
      
        firstTd.appendChild(wrapper);
      } else {
        firstTd.textContent = "-";
      }

      tr.appendChild(firstTd);

      // Latest
      const latestTd = document.createElement("td");

      if (latest !== "-") {
        const wrapper = document.createElement("div");
        wrapper.className = "player-cell";
      
        const avatar = document.createElement("img");
        avatar.className = "avatar-img";
        avatar.loading = "lazy";
        avatar.decoding = "async";
        avatar.referrerPolicy = "no-referrer";
        avatar.src = latestAvatar;
        avatar.width = "28";
        avatar.height = "28";
        avatar.alt = "Avatar";
        avatar.onerror = () => avatar.src = "assets/images/Default.jpg";
      
        const nameSpan = document.createElement("span");
        nameSpan.textContent = latest;
        nameSpan.className = "clickable-cell";
        nameSpan.dataset.player = latest;
        nameSpan.dataset.game = gameName;
      
        wrapper.appendChild(avatar);
        wrapper.appendChild(nameSpan);
      
        latestTd.appendChild(wrapper);
      } else {
        latestTd.textContent = "-";
      }

      tr.appendChild(latestTd);

      // Total
      const totalTd = document.createElement("td");
      totalTd.textContent = total;
      tr.appendChild(totalTd);
    }

    /* ===== RATINGS MODE ===== */

    else {

      for (let i = 1; i <= 9; i++) {

        const cell = row[i];
        const td = document.createElement("td");

        if (cell === "N/A") {
          td.textContent = "N/A";
        }
        else if (!isNaN(cell) && cell !== "") {

          const num = parseFloat(cell);
          td.textContent = num.toFixed(2);
          applyRatingColor(td, i, num);
        }
        else {
          td.textContent = cell;
        }

        tr.appendChild(td);
      }
    }

    fragment.appendChild(tr);
  }

  ahofTbody.appendChild(fragment);
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
    // Total Clears
    if (!showRatings && headerIndex === 14) {
      if (currentSort.index === headerIndex) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.index = headerIndex;
        currentSort.asc = false;
      }
    
      tableData.sort((a, b) => {
        const totalA = parseInt(a[14]) || 0;
        const totalB = parseInt(b[14]) || 0;
    
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

/* ================= RATING COLOR SYSTEM ================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function interpolateRGB(start, end, ratio) {
  const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
  const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
  const b = Math.round(start[2] + (end[2] - start[2]) * ratio);
  return `rgb(${r},${g},${b})`;
}

function normalizeRating(value) {
  return clamp(value, 0, 10) / 10;
}

function getBlueRedColor(value) {
  const ratio = normalizeRating(value);
  return interpolateRGB(
    [0, 0, 255],    // blue
    [255, 0, 0],    // red
    ratio
  );
}

function getRedGreenColor(value) {
  const ratio = normalizeRating(value);
  return interpolateRGB(
    [255, 0, 0],    // red
    [32, 172, 23],  // green
    ratio
  );
}

function applyRatingColor(td, columnIndex, value) {
  
  if (columnIndex >= 1 && columnIndex <= 7) {
    td.style.color = getBlueRedColor(value);
    return;
  }

  if (columnIndex === 8) {
    td.style.fontWeight = "600";
    return;
  }

  // Quality column
  if (columnIndex === 9) {
    td.style.color = getRedGreenColor(value);
  }
}
