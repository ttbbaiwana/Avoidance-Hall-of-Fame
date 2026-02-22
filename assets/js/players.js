const API_URL = API_CONFIG.BASE_URL;

let playersFullData = [];
let playersFilteredData = [];
let playersExactMatchMode = false;

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

function renderPlayers(data) {

  const grid = document.getElementById("players-grid");
  grid.innerHTML = "";

  data.forEach(row => {

    const country = row[0];
    const player = row[1];
    const channels = row.slice(2, 5).filter(Boolean);
    const socials = row[6];

    const card = document.createElement("div");
    card.classList.add("player-card");

    // Header (avatar + name + flag)
    const header = document.createElement("div");
    header.classList.add("player-card-header");

    const avatar = document.createElement("img");
    avatar.classList.add("player-avatar");
    
    if (PLAYER_LIST.has(player)) {
      avatar.src = `assets/images/avatars/${player}.jpg`;
    } else {
      avatar.src = "assets/images/avatars/Default.jpg";
    }

    const flag = document.createElement("img");
    flag.classList.add("flag-img");
    
    if (FLAG_LIST.has(country)) {
      flag.src = `assets/images/flags/${country}.png`;
      flag.classList.add("clickable-flag");
    
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
    
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    
      header.appendChild(flag);
    }

    const name = document.createElement("h3");
    name.textContent = player;

    header.appendChild(avatar);
    header.appendChild(flag);
    header.appendChild(name);

    card.appendChild(header);

    // Channels
    const linksContainer = document.createElement("div");
    linksContainer.classList.add("player-links");

    channels.forEach(url => {
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

    if (socials) {
      const a = document.createElement("a");
      a.href = socials;
      a.target = "_blank";
      const platform = getPlatformInfo(socials);

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
    }

    card.appendChild(linksContainer);

    grid.appendChild(card);
  });

  updatePlayersCount();
  updatePlayersFilterSummary();
}

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

function setupPlayersSearch() {

  const columnSelect = document.getElementById("players-search-column");
  const input = document.getElementById("players-search-input");
  const countrySelect = document.getElementById("players-country-select");
  const clearBtn = document.getElementById("players-clear-search");

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

  updatePlayersPlaceholder();
}

function updatePlayersPlaceholder() {
  const columnSelect = document.getElementById("players-search-column");
  const input = document.getElementById("players-search-input");

  const text = columnSelect.options[columnSelect.selectedIndex].text;
  input.placeholder = `Search ${text}...`;
}

function applyPlayersFilter() {

  const column = document.getElementById("players-search-column").value;
  const input = document.getElementById("players-search-input");
  const countrySelect = document.getElementById("players-country-select");

  if (column === "country") {

    const selected = countrySelect.value;

    if (!selected) {
      playersFilteredData = [...playersFullData];
    } else {
      playersFilteredData = playersFullData.filter(row =>
        row[0] === selected
      );
    }

  } else {

    const query = input.value.toLowerCase().trim();

    if (!query) {
      playersFilteredData = [...playersFullData];
    } else if (playersExactMatchMode) {
      playersFilteredData = playersFullData.filter(row =>
        row[1].toLowerCase() === query
      );
    } else {
      playersFilteredData = playersFullData.filter(row =>
        row[1].toLowerCase().includes(query)
      );
    }
  }

  renderPlayers(playersFilteredData);
}

function setupPlayersAutocomplete() {

  const input = document.getElementById("players-search-input");
  const list = document.getElementById("players-autocomplete-list");

  input.addEventListener("input", () => {

    const value = input.value.toLowerCase();
    list.innerHTML = "";

    if (!value) {
      list.classList.add("hidden");
      return;
    }

    const source = [...new Set(playersFullData.map(row => row[1]))].sort();

    const startsWith = [];
    const includes = [];

    source.forEach(name => {
      const lower = name.toLowerCase();
      if (lower.startsWith(value)) startsWith.push(name);
      else if (lower.includes(value)) includes.push(name);
    });

    const matches = [...startsWith, ...includes].slice(0, 10);

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
        playersExactMatchMode = true;
        list.classList.add("hidden");
        applyPlayersFilter();
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

function updatePlayersCount() {
  const el = document.getElementById("players-count");
  el.textContent = `Showing ${playersFilteredData.length} players`;
}

function updatePlayersFilterSummary() {

  const el = document.getElementById("players-filter-summary");

  const column = document.getElementById("players-search-column").value;
  const input = document.getElementById("players-search-input");
  const countrySelect = document.getElementById("players-country-select");

  const parts = [];

  if (column === "country" && countrySelect.value) {
    parts.push(`Country = ${countrySelect.value}`);
  }
  else if (input.value.trim() !== "") {
    parts.push(`Player = ${input.value.trim()}`);
  }

  if (parts.length === 0) {
    el.textContent = "Showing: All Players";
  } else {
    el.textContent = `Showing: ${parts.join(" | ")}`;
  }
}
