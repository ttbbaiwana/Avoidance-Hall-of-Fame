const API_URL = API_CONFIG.BASE_URL;

let playersFullData = [];
let playersFilteredData = [];
let playersExactMatchMode = false;

/* ================= FETCH ================= */

fetch(`${API_URL}?view=players`)
  .then(res => res.json())
  .then(json => {
    playersFullData = json.data;
    playersFilteredData = [...playersFullData];

    populateCountryDropdown();
    setupPlayersSearch();
    setupPlayersAutocomplete();

    renderPlayers(playersFilteredData);

    document.getElementById("players-loader").classList.add("hidden");
    document.getElementById("players-content").classList.remove("hidden");
  })
  .catch(err => {
    console.error(err);
    document.getElementById("players-loader").innerHTML =
      "<p style='color:red;'>Failed to load players.</p>";
  });

/* ================= RENDER ================= */

function renderPlayers(data) {

  const grid = document.getElementById("players-grid");
  grid.innerHTML = "";

  data.forEach(row => {

    const country = row[0];
    const avatarUrl = row[1];
    const player = row[2];
    const channels = row.slice(3, 7).filter(Boolean);
    const socials = row[7];

    const card = document.createElement("div");
    card.classList.add("player-card");

    /* Header */
    const header = document.createElement("div");
    header.classList.add("player-card-header");

    const avatar = document.createElement("img");
    avatar.classList.add("player-avatar");
    avatar.loading = "lazy";
    avatar.referrerPolicy = "no-referrer";
    avatar.src = avatarUrl || "assets/images/Default.jpg";
    avatar.onerror = () => avatar.src = "assets/images/Default.jpg";

    const flag = document.createElement("span");
    flag.classList.add("fi", `fi-${country.toLowerCase()}`);
    flag.classList.add("flag-icon", "clickable-flag");
    flag.loading = "lazy";
    flag.onerror = () => flag.remove();

    flag.addEventListener("click", () => {
      const columnSelect = document.getElementById("players-search-column");
      const countrySelect = document.getElementById("players-country-select");
      const input = document.getElementById("players-search-input");

      columnSelect.value = "country";
      input.classList.add("hidden");
      countrySelect.classList.remove("hidden");
      countrySelect.value = country;

      playersExactMatchMode = true;
      applyPlayersFilter();

      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const name = document.createElement("h3");
    name.textContent = player;
    name.classList.add("clickable-player");
    
    name.addEventListener("click", () => {
      const encoded = encodeURIComponent(player);
      window.location.href = `clears.html?player=${encoded}`;
    });

    header.appendChild(avatar);
    header.appendChild(flag);
    header.appendChild(name);

    card.appendChild(header);

    /* Links */
    const linksContainer = document.createElement("div");
    linksContainer.classList.add("player-links");

    [...channels, socials].filter(Boolean).forEach(url => {

      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";

      const platform = getPlatformInfo(url);

      if (platform.key && PLATFORM_ICONS[platform.key]) {
        const icon = document.createElement("img");
        icon.src = `assets/images/icons/${PLATFORM_ICONS[platform.key]}`;
        icon.classList.add("platform-icon");
        a.appendChild(icon);
      }

      const text = document.createElement("span");
      text.textContent = platform.name;
      a.appendChild(text);

      linksContainer.appendChild(a);
    });

    card.appendChild(linksContainer);
    grid.appendChild(card);
  });

  updatePlayersCount();
  updatePlayersFilterSummary();
}

/* ================= PLATFORM ================= */

function getPlatformInfo(url) {
  const lower = url.toLowerCase();

  if (lower.includes("youtube.com")) return { name: "YouTube", key: "youtube" };
  if (lower.includes("twitch.tv")) return { name: "Twitch", key: "twitch" };
  if (lower.includes("nicovideo.jp")) return { name: "NicoNico", key: "nicovideo" };
  if (lower.includes("bilibili.com")) return { name: "Bilibili", key: "bilibili" };
  if (lower.includes("naver.com")) return { name: "Naver", key: "naver" };
  if (lower.includes("sooplive.co.kr")) return { name: "SOOP", key: "soop" };
  if (lower.includes("twitter.com")) return { name: "Twitter", key: "twitter" };
  if (lower.includes("bsky.app")) return { name: "BlueSky", key: "bsky" };

  return { name: "Link", key: null };
}

/* ================= FILTERING ================= */

function setupPlayersSearch() {

  const columnSelect = document.getElementById("players-search-column");
  const input = document.getElementById("players-search-input");
  const countrySelect = document.getElementById("players-country-select");
  const clearBtn = document.getElementById("players-clear-search");

  updatePlayersPlaceholder();

  columnSelect.addEventListener("change", () => {

    playersExactMatchMode = false;
    input.value = "";
    countrySelect.value = "";

    if (columnSelect.value === "country") {
      input.classList.add("hidden");
      countrySelect.classList.remove("hidden");
    } else {
      countrySelect.classList.add("hidden");
      input.classList.remove("hidden");
    }

    updatePlayersPlaceholder();
    applyPlayersFilter();
  });

  input.addEventListener("input", () => {
    playersExactMatchMode = false;
    applyPlayersFilter();
  });

  countrySelect.addEventListener("change", () => {
    playersExactMatchMode = false;
    applyPlayersFilter();
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    countrySelect.value = "";
    playersExactMatchMode = false;
    updatePlayersPlaceholder();
    applyPlayersFilter();
  });
}

function applyPlayersFilter() {

  const column = document.getElementById("players-search-column").value;
  const input = document.getElementById("players-search-input");
  const countrySelect = document.getElementById("players-country-select");
  const query = input.value.trim().toLowerCase();

  playersFilteredData = [...playersFullData];

  if (column === "country" && countrySelect.value) {
    playersFilteredData =
      playersFilteredData.filter(row =>
        row[0] === countrySelect.value
      );
  }

  else if (column === "player" && query) {

    playersFilteredData = playersFilteredData.filter(row => {

        const value = String(row[2] ?? "").toLowerCase();

        return playersExactMatchMode
          ? value === query
          : value.includes(query);
      });
  }

  renderPlayers(playersFilteredData);
}

/* ================= AUTOCOMPLETE ================= */

function setupPlayersAutocomplete() {

  const input = document.getElementById("players-search-input");
  const list = document.getElementById("players-autocomplete-list");

  input.addEventListener("input", () => {

    const query = input.value.trim().toLowerCase();

    list.textContent = "";

    if (!query) {
      list.classList.add("hidden");
      return;
    }
    
    const source = [
      ...new Set(
        playersFullData
          .map(row => String(row[2] ?? ""))
          .filter(name => name !== "")
      )
    ].sort();

    const startsWith = [];
    const includes = [];

    for (const name of source) {

      const lower = name.toLowerCase();

      if (lower.startsWith(query)) {
        startsWith.push(name);
      }
      else if (lower.includes(query)) {
        includes.push(name);
      }

      if (startsWith.length + includes.length >= 20) {
        break;
      }
    }

    const matches = [...startsWith, ...includes].slice(0, 10);

    if (!matches.length) {
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
    playersExactMatchMode = true;
    list.classList.add("hidden");
    applyPlayersFilter();
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete-wrapper")) {
      list.classList.add("hidden");
    }
  });
}

/* ================= UI HELPERS ================= */

function updatePlayersPlaceholder() {
  const columnSelect = document.getElementById("players-search-column");
  const input = document.getElementById("players-search-input");
  input.placeholder = `Search ${columnSelect.options[columnSelect.selectedIndex].text}...`;
}

function populateCountryDropdown() {
  const select = document.getElementById("players-country-select");

  const countries = [...new Set(playersFullData.map(row => row[0]))]
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

function updatePlayersCount() {
  document.getElementById("players-count")
    .textContent = `Showing ${playersFilteredData.length} players`;
}

function updatePlayersFilterSummary() {

  const column = document.getElementById("players-search-column").value;
  const input = document.getElementById("players-search-input");
  const countrySelect = document.getElementById("players-country-select");

  let text = "Showing: All Players";

  if (column === "country" && countrySelect.value) {
    text = `Showing: Country = ${countrySelect.value}`;
  }
  else if (input.value.trim()) {
    text = `Showing: Player = ${input.value.trim()}`;
  }

  document.getElementById("players-filter-summary").textContent = text;
}
