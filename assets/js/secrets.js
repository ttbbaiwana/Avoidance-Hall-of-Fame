/* ================= SECRET MANAGER ================= */

const SecretManager = (() => {

  /* ================= SECRET GAME REGISTRY ================= */
  
  const SECRET_GAMES = {
    ruma: {
      name: "I wanna Ruma - Extra",
      color: "#cc0000"
    },
    curveWAH: {
      name: "curveWAH",
      color: "#e06666"
    },
    oiia: {
      name: "I wanna OIIAOIIA",
      color: "#c67a5e"
    }
  };
  
  const SECRET_GAME_SET = new Set(
    Object.values(SECRET_GAMES).map(g => g.name)
  );
  
  function isSecretGame(gameName) {
    return SECRET_GAME_SET.has(gameName);
  }
  
  function getSecretStyle(gameName) {
  
    const entry = Object.values(SECRET_GAMES)
      .find(g => g.name === gameName);
  
    if (!entry) return null;
  
    return {
      backgroundColor: entry.color,
      fontWeight: "700"
    };
  }
  
  function getSecretGameNames() {
    return Array.from(SECRET_GAME_SET);
  }

  /* ================= INTERNAL STATE ================= */

  const state = {
    rumaActive: false,
    curveWAHActive: false,
    oiiaAvailable: false
  };

  let hooks = {
    applyFilter: null,
    getSearchState: null,
    getColumnSelect: null
  };

  /* ================= INITIALIZATION ================= */

  function init(config) {
    hooks = config;
    setupRumaHeaderSecret();
  }

  /* ================= RUMA SECRET ================= */

  function isRumaSearchActive() {
    const { column, input } = hooks.getSearchState();
    return column === "game" && input === "I wanna Ruma";
  }

  function setupRumaHeaderSecret() {

    document.addEventListener("mouseover", (e) => {
      if (e.target.tagName !== "TH") return;

      if (e.target.textContent === "#" && isRumaSearchActive()) {
        e.target.textContent = "?";
      }
    });

    document.addEventListener("mouseout", (e) => {
      if (e.target.tagName === "TH" && e.target.textContent === "?") {
        e.target.textContent = "#";
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.tagName === "TH" && e.target.textContent === "?") {
        state.rumaActive = !state.rumaActive;
        hooks.applyFilter();
      }
    });
  }

  /* ================= OIIA SECRET ================= */

  function updateOiiaAvailability() {

    const { column, input } = hooks.getSearchState();

    state.oiiaAvailable =
      column === "game" &&
      input === "I wanna be the Music2 - シュレーディンガーの猫《INFINITE》 Perfect";

    const select = hooks.getColumnSelect();
    if (!select) return;

    const existing = [...select.options]
      .find(opt => opt.value === "oiia-secret");

    if (state.oiiaAvailable && !existing) {
      const option = document.createElement("option");
      option.value = "oiia-secret";
      option.textContent = "????????";
      select.appendChild(option);
    }

    if (!state.oiiaAvailable && existing) {
      existing.remove();
    }
  }

  /* ================= CURVEWAH SECRET ================= */

  function toggleCurveWAH() {
  
    state.curveWAHActive = !state.curveWAHActive;
  
    // Reset search UI
    const columnSelect = hooks.getColumnSelect();
    const searchInput = document.getElementById("search-input");
    const countrySelect = document.getElementById("country-select");
  
    columnSelect.value = "date";
    searchInput.value = "";
    countrySelect.value = "";
  
    hooks.applyFilter();
  }

  function handlePlasmaHover(badge, entering) {
    if (badge.dataset.secret === "curveWAH") {
      badge.textContent = entering ? "W" : "M";
    }
  }

  /* ================= APPLY SECRETS ================= */

  function applySecrets(column, data, fullData) {

    updateOiiaAvailability();
  
    // OIIA
    if (column === "oiia-secret") {
      return fullData.filter(row =>
        row[1] === SECRET_GAMES.oiia.name
      );
    }
  
    // Ruma
    if (state.rumaActive && isRumaSearchActive()) {
      return fullData.filter(row =>
        row[1] === SECRET_GAMES.ruma.name
      );
    }
  
    // CurveWAH
    const { column: col, input } = hooks.getSearchState();
    const noSearchActive = !input && col === "date";
  
    if (state.curveWAHActive && noSearchActive) {
      return fullData.filter(row =>
        row[1] === SECRET_GAMES.curveWAH.name
      );
    }
  
    return data;
  }
  
  /* ================= RESET SECRETS ================= */
  function resetSecrets() {
    state.rumaActive = false;
    state.curveWAHActive = false;
  }

  /* ================= PUBLIC API ================= */

  return {
    init,
    applySecrets,
    toggleCurveWAH,
    handlePlasmaHover,
    isSecretGame,
    getSecretGameNames,
    getSecretStyle,
    isSecretOverrideActive,
    resetSecrets
  };

})();
