const API_URL = API_CONFIG.BASE_URL;

fetch(`${API_URL}?view=players`)
  .then(res => res.json())
  .then(json => {
    renderPlayers(json.data);
  })
  .catch(err => console.error(err));

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
}

function getPlatformInfo(url) {
  const lower = url.toLowerCase();

  if (lower.includes("youtube")) return { name: "YouTube", key: "youtube" };
  if (lower.includes("twitch")) return { name: "Twitch", key: "twitch" };
  if (lower.includes("nicovideo")) return { name: "NicoNico", key: "nicovideo" };
  if (lower.includes("bilibili")) return { name: "Bilibili", key: "bilibili" };
  if (lower.includes("naver")) return { name: "Naver", key: "naver" };
  if (lower.includes("soop")) return { name: "SOOP", key: "soop" };
  if (lower.includes("twitter")) return { name: "Twitter", key: "twitter" };
  if (lower.includes("bsky")) return { name: "BlueSky", key: "bsky" };

  return { name: "Link", key: null };
}
