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
    avatar.src = `assets/images/avatars/${player}.jpg`;
    avatar.onerror = function () {
      this.src = "assets/images/avatars/Default.jpg";
    };

    const flag = document.createElement("img");
    flag.classList.add("flag-img");
    flag.src = `assets/images/flags/${country}.png`;
    flag.onerror = function () {
      this.style.display = "none";
    };

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
      a.textContent = getPlatformName(url);
      linksContainer.appendChild(a);
    });

    if (socials) {
      const a = document.createElement("a");
      a.href = socials;
      a.target = "_blank";
      a.textContent = getPlatformName(socials);
      linksContainer.appendChild(a);
    }

    card.appendChild(linksContainer);

    grid.appendChild(card);
  });
}

function getPlatformName(url) {
  if (url.includes("youtube")) return "YouTube";
  if (url.includes("twitch")) return "Twitch";
  if (url.includes("nicovideo")) return "NicoNico";
  if (url.includes("bilibili")) return "Bilibili";
  if (url.includes("naver")) return "Naver";
  if (url.includes("soop")) return "SOOP";
  if (url.includes("twitter")) return "Twitter";
  if (url.includes("bsky")) return "BlueSky";
  return "Link";
}
