const page1 = document.getElementById("page-1");
const page2 = document.getElementById("page-2");
const nextBtn = document.getElementById("nextBtn");
const clearsInput = document.getElementById("clears");
const nameInput = document.getElementById("name");
const errorMsg = document.getElementById("gate-error");

const avoidanceContainer = document.getElementById("avoidance-container");

const responses = {
  meta: {},
  avoidances: {}
};

function getContrastTextColor(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);

  // Perceived luminance (WCAG-ish)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#000000" : "#ffffff";
}

// ---------- PAGE 1 GATE ----------
function validateGate() {
  const clears = Number(clearsInput.value);
  const nameFilled = nameInput.value.trim().length > 0;
	responses.meta.name = nameInput.value.trim();

  if (nameFilled && clears >= 5) {
    nextBtn.disabled = false;
    errorMsg.style.display = "none";
  } else {
    nextBtn.disabled = true;
    if (clears > 0 && clears < 5) {
      errorMsg.style.display = "block";
    } else {
      errorMsg.style.display = "none";
    }
  }
}

clearsInput.addEventListener("input", validateGate);
nameInput.addEventListener("input", validateGate);

nextBtn.addEventListener("click", () => {
  page1.hidden = true;
  page2.hidden = false;
});

// ---------- AVOIDANCE TEMPLATE ----------
const ratingCategories = [
  "Reading Intricacy",
  "Speed",
  "Density",
  "Pattern",
  "Gimmick",
  "Luck"
];

function createAvoidanceSection(name) {
  // Initialize data model
  responses.avoidances[name] = {
    experience: null,
    ratings: {}
  };

  // Create container
  const section = document.createElement("div");
  section.className = "avoidance";

  // Background + contrast text
	const bgColor = avoidanceConfig.find(a => a.name === name)?.color || "#ffffff";
	const textColor = getContrastTextColor(bgColor);

  section.style.backgroundColor = bgColor;
  section.style.color = textColor;
  section.style.padding = "20px";
  section.style.borderRadius = "12px";
  section.style.marginBottom = "24px";

  // Base HTML
  section.innerHTML = `
    <h3>${name}</h3>

    <p>
      <strong>Do you have enough experience with this avoidance to rate it?</strong>
    </p>

    <div class="experience-buttons">
      <button type="button" class="exp-btn" data-answer="yes">Yes</button>
      <button type="button" class="exp-btn" data-answer="no">No</button>
    </div>
		
		<p class="hidden">Rate the game based on the following criteria. (Refer to the "Category Information" for rating definitions)</p>
    <div class="ratings hidden"></div>
  `;

  const ratingsDiv = section.querySelector(".ratings");
  const expButtons = section.querySelectorAll(".exp-btn");

  // Build rating blocks
  ratingCategories.forEach(category => {
    const block = document.createElement("div");
    block.className = "rating";

    const groupName = `${name}-${category}`.replace(/\s+/g, "_");

    block.innerHTML = `
      <label class="rating-label">${category}</label>

      <div class="rating-scale">
        <div class="rating-numbers">
          ${Array.from({ length: 11 }, (_, i) => `<span>${i}</span>`).join("")}
        </div>

        <div class="rating-radios">
          ${Array.from({ length: 11 }, (_, i) => `
            <label>
              <input
                type="radio"
                name="${groupName}"
                value="${i}"
              />
              <span class="radio-dot"></span>
            </label>
          `).join("")}
        </div>
      </div>
    `;

    ratingsDiv.appendChild(block);
  });

  // Yes / No toggle logic
  expButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const answer = btn.dataset.answer;

      // visual state
      expButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      if (answer === "yes") {
        responses.avoidances[name].experience = "yes";
        ratingsDiv.classList.remove("hidden");
      } else {
        responses.avoidances[name].experience = "no";

        // hide UI
        ratingsDiv.classList.add("hidden");

        // clear radios
        const radios = ratingsDiv.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
          radio.checked = false;
          radio.dataset.wasChecked = "false";
        });

        // clear data
        responses.avoidances[name].ratings = {};
      }
    });
  });

  // Toggleable radio behavior + data sync
  ratingsDiv.addEventListener("click", (e) => {
    if (e.target.type !== "radio") return;

    const radio = e.target;
    const category = radio
      .closest(".rating")
      .querySelector(".rating-label")
      .innerText;

    const avoidance = responses.avoidances[name];

    if (radio.dataset.wasChecked === "true") {
      // unselect
      radio.checked = false;
      radio.dataset.wasChecked = "false";
      delete avoidance.ratings[category];
    } else {
      // clear group toggle state
      const group = ratingsDiv.querySelectorAll(
        `input[name="${radio.name}"]`
      );
      group.forEach(r => (r.dataset.wasChecked = "false"));

      radio.dataset.wasChecked = "true";
      avoidance.ratings[category] = Number(radio.value);
    }
  });

  return section;
}

const avoidanceConfig = [
  { name: "Soulless Hard Mode", color: "#3a4052" },
  { name: "I wanna be the Last TIS", color: "#999999" },
  { name: "I wanna be the Music2 - Ninur 《INFINITE》 Perfect", color: "#f751a1" },
  { name: "I wanna be the Music2 - シュレーディンガーの猫《INFINITE》 Perfect", color: "#a06ac3" },
  { name: "I wanna be the Music2 - ロンゲーナカンタータ 《INFINITE》 Perfect", color: "#463476" },
  { name: "I Wanna Touhikea", color: "#bf3fe3" },
  { name: "I Wanna Debut", color: "#2ed863" },
  { name: "Immature Lime", color: "#7efe54" },
  { name: "I wanna be the Music2 - BLACK or WHITE? 《EXHAUST》 Perfect", color: "#000000" },
  { name: "Splatter Fate", color: "#38761d" },
  { name: "Galaxy Collapse", color: "#999999" },
  { name: "I Wanna Goodbye The Destruction State v1.03", color: "#8b42b6" },
  { name: "VOX Diamond Absolute", color: "#ff6d01" },
  { name: "I wanna break the Series Z 3 EX - Entrance", color: "#ffffff" },
  { name: "I wanna defeat the crazy destination", color: "#cccccc" },
  { name: "I Wanna Defeat The Legendary Burger", color: "#0b5394" },
  { name: "I Wanna Maker - Cosmic Back Entrance", color: "#b4a7d6" },
  { name: "I wanna be the Replica", color: "#f85454" },
  { name: "CN (Crazy nighT)", color: "#eb0000" },
  { name: "I wanna Innovation Explosion", color: "#000000" },
  { name: "I wanna be the Dancer - Taisa", color: "#93c47d" },
  { name: "I wanna be the Lechenaultia", color: "#b7b7b7" },
  { name: "I wanna be Infinite", color: "#b78de3" },
  { name: "I wanna Ruma", color: "#cc0000" },
  { name: "I wanna see the まゆむしチャンネル", color: "#0000ff" },
  { name: "I Wanna Wane", color: "#ea6e2a" },
  { name: "Make it Lime", color: "#01ff02" },
  { name: "I wanna eXceed", color: "#c67a5e" },
  { name: "I wanna be the Music2 - Electric Sister Bitch《EXHAUST》 Perfect", color: "#fffdb5" },
  { name: "I wanna Melanzana", color: "#18c200" },
  { name: "I wanna Prima", color: "#ffe78c" },
  { name: "Schwarlitz's Requiem", color: "#9b870c" },
  { name: "I wanna be the MHC", color: "#1155cc" },
  { name: "I wanna be the Future Dominators", color: "#c90000" },
  { name: "I wanna be the Destruction State", color: "#9900ff" },
  { name: "Classical VIP", color: "#6a6a6a" },
  { name: "Invincible Alien", color: "#ff0000" },
  { name: "I wanna Forest Song", color: "#60c4c1" },
  { name: "I wanna be the りんごん", color: "#badbeb" },
  { name: "I wanna be the Music2 - felys -long remix-《INFINITE》 Perfect", color: "#907ab0" },
  { name: "I wanna be the Mood Breaker", color: "#045da7" },
  { name: "I wanna be the Fafnir", color: "#3c78d8" },
  { name: "Scattered Faith", color: "#6aa84f" },
  { name: "I Wanna Kill The Kamilia 3 - EX Emperor", color: "#ff9900" },
  { name: "I wanna be the LoveTrap - Big Kid", color: "#58350c" },
  { name: "I wanna bee the Bumblebee", color: "#f643b2" },
  { name: "I wanna be the Just Trap [Easy] - Geezer Kid", color: "#666666" },
  { name: "I wanna Verre", color: "#b45f06" },
  { name: "Soulless", color: "#990000" },
  { name: "I wanna be the Battlegrounds - Ao Stage", color: "#bdbd02" },
  { name: "EMPEROR SY MK-III", color: "#134f5c" },
  { name: "I Wanna be the Charisma Breaker - No Dot", color: "#cc0000" },
  { name: "I Wanna Melt The Snow", color: "#fdc06a" },
  { name: "I wanna Kardia - Extra", color: "#3a3a5a" },
  { name: "I wanna Kardia", color: "#3a3a5a" },
  { name: "SciuruS", color: "#6fa8dc" },
  { name: "I wanna be the Music2 - C18H27NO3《EXHAUST》 Perfect", color: "#ec1f2b" },
  { name: "I wanna PaoPaoPaoPPaPPaPao!PanPan", color: "#d9d9d9" },
  { name: "I wanna be the Music2 - 黄流《INFINITE》 Perfect", color: "#84602d" },
  { name: "I wanna be the Super Fish", color: "#46bdc6" },
  { name: "I wanna be the dop", color: "#674ea7" },
  { name: "Happy Fantazma", color: "#ff00ff" },
  { name: "I wanna Crack the Candy", color: "#ea9999" },
  { name: "I Wanna 5H - Cyber", color: "#999999" },
  { name: "I Wanna Break The Orchestra Entrance", color: "#6225d1" },
  { name: "I wanna bye the Back Entrance", color: "#d9d9d9" },
  { name: "I wanna break the Series Z 3 EX - Hamayara Area", color: "#f03892" },
  { name: "I wanna be the Battlegrounds - Tomo Stage", color: "#8c048d" },
  { name: "I wanna be the Shrine Maiden 2 - Yukari phase 2", color: "#63944d" },
  { name: "I wanna be the Imasugu - サクラヨゾラ", color: "#df6b08" },
  { name: "I wanna be the Railgun - Very Hard Boss", color: "#3d85c6" },
  { name: "I Wanna Kill The Kamilia 3 - Tokoroten Area", color: "#28b400" },
  { name: "I Wanna Kill The Kamilia 3 - EX Colonel", color: "#c90000" },
  { name: "I Wanna Kill The Kamilia 3 - ouka Area", color: "#d6868a" },
  { name: "I Wanna Stop The Bathroom Installation", color: "#d9d9d9" },
  { name: "Bottomless Abyss", color: "#134f5c" },
  { name: "I wanna be the Immature Life", color: "#ffd966" },
  { name: "I wanna Mustela", color: "#45818e" },
  { name: "I Wanna Take The Curtain Call", color: "#c70909" },
  { name: "I wanna be the VCL", color: "#c27ba0" },
  { name: "I wanna grand of the perfect bear", color: "#00ffff" },
  { name: "I wanna be the Music2 - Last Concerto《EXHAUST》 Perfect", color: "#407eb3" },
  { name: "I Wanna Be The Music - 組曲『ニコニコ動画』Extreme", color: "#28b400" },
  { name: "I wanna kill the Kamilia 2 WARPED - Bottomless Abyss", color: "#02859c" },
  { name: "I wanna be THE iDOLM@STER - Kotori Otonashi", color: "#569f80" },
  { name: "I wanna be the くれいじーおぴんこす///", color: "#473057" },
  { name: "I wanna break the Series Z 3 - Final Boss", color: "#ab45f0" },
  { name: "I wanna Count 0 ver.EX", color: "#ff0000" },
  { name: "Drunk Crunk Franken - Fixed ver.", color: "#8e7cc3" },
  { name: "I Wanna GO The CHARMSTINATION - Extra Boss", color: "#ff95ff" },
  { name: "I wanna be the Penger", color: "#1b2be7" },
  { name: "I wanna be the 2006", color: "#000000" },
  { name: "I wanna be the semantic compositions on death and its meaning - Right Warp", color: "#f08d55" },
  { name: "I wanna be the Hidden++", color: "#666666" },
  { name: "DEATH GRIPS IS ONLINE", color: "#2ed863" },
  { name: "I wanna Touch the Ripper", color: "#660000" },
  { name: "I wanna be the Odyssey - Final Boss", color: "#16244e" },
  { name: "I wanna be the !!!ChaosTime!!!", color: "#e9d290" },
  { name: "I Wanna Maker - Final Destination", color: "#e06666" },
  { name: "Twisted Drop Party", color: "#52ffff" }
];

avoidanceConfig.forEach(({ name }) => {
  avoidanceContainer.appendChild(createAvoidanceSection(name));
});

const submitBtn = document.getElementById("submitBtn");
const submitStatus = document.getElementById("submitStatus");
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNjbI5YyD4jA4_sFj6IqZ4uyVOJ7U2b31dIaqOH7rNkvs8hhB5BF4ZOxVcxFjkjcCr/exec";

function validateBeforeSubmit() {
  let ratedAvoidanceCount = 0;

  for (const [name, data] of Object.entries(responses.avoidances)) {
    if (data.experience === "yes") {
      const ratingCount = Object.keys(data.ratings).length;

      // Rule A: Yes → must have ≥1 rating
      if (ratingCount === 0) {
        alert(
          `You selected "Yes" for "${name}" but did not provide any ratings.`
        );
        return false;
      }

      ratedAvoidanceCount++;
    }
  }

  // Rule B: Must rate at least N avoidances
  if (ratedAvoidanceCount < 1) {
    alert("You must rate at least 1 avoidance before submitting.");
    return false;
  }

  return true;
}

submitBtn.addEventListener("click", async () => {
  if (!validateBeforeSubmit()) return;

  submitBtn.disabled = true;
  submitStatus.innerText = "Submitting...";

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(responses)
    });

    const result = await res.json();

    if (result.status === "ok") {
      submitStatus.innerText = "Submitted successfully. Thank you!";
    } else {
      throw new Error("Submission failed");
    }
  } catch (err) {
    submitStatus.innerText = "Submission failed. Please try again.";
    submitBtn.disabled = false;
    console.error(err);
  }
});
