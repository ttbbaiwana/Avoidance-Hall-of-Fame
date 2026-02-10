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
  const bgColor = avoidanceConfig[name] || "#f5f5f5";
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

const avoidanceNames = {
  "Soulless Hard Mode": "#3a4052",
  "I wanna be the Last TIS": "#999999",
  "I wanna be the Music2 - Ninur 《INFINITE》 Perfect",
	"I wanna be the Music2 - シュレーディンガーの猫《INFINITE》 Perfect",
	"I wanna be the Music2 - ロンゲーナカンタータ 《INFINITE》 Perfect",
	"I Wanna Touhikea",
	"I Wanna Debut",
	"Immature Lime",
	"I wanna be the Music2 - BLACK or WHITE? 《EXHAUST》 Perfect",
	"Splatter Fate",
	"Galaxy Collapse",
	"I Wanna Goodbye The Destruction State v1.03",
	"VOX Diamond Absolute",
	"I wanna break the Series Z 3 EX - Entrance",
	"I wanna defeat the crazy destination",
	"I Wanna Defeat The Legendary Burger",
	"I Wanna Maker - Cosmic Back Entrance",
	"I wanna be the Replica",
	"CN (Crazy nighT)",
	"I wanna Innovation Explosion",
	"I wanna be the Dancer - Taisa",
	"I wanna be the Lechenaultia",
	"I wanna be Infinite",
	"I wanna Ruma",
	"I wanna see the まゆむしチャンネル",
	"I Wanna Wane",
	"Make it Lime",
	"I wanna eXceed",
	"I wanna be the Music2 - Electric Sister Bitch《EXHAUST》 Perfect",
	"I wanna Melanzana",
	"I wanna Prima",
	"Schwarlitz's Requiem",
	"I wanna be the MHC",
	"I wanna be the Future Dominators",
	"I wanna be the Destruction State",
	"Classical VIP",
	"Invincible Alien",
	"I wanna Forest Song",
	"I wanna be the りんごん",
	"I wanna be the Music2 - felys -long remix-《INFINITE》 Perfect",
	"I wanna be the Mood Breaker",
	"I wanna be the Fafnir",
	"Scattered Faith",
	"I Wanna Kill The Kamilia 3 - EX Emperor",
	"I wanna be the LoveTrap - Big Kid",
	"I wanna bee the Bumblebee",
	"I wanna be the Just Trap [Easy] - Geezer Kid",
	"I wanna Verre",
	"Soulless",
	"I wanna be the Battlegrounds - Ao Stage",
	"EMPEROR SY MK-III",
	"I Wanna be the Charisma Breaker - No Dot",
	"I Wanna Melt The Snow",
	"I wanna Kardia - Extra",
	"I wanna Kardia",
	"SciuruS",
	"I wanna be the Music2 - C18H27NO3《EXHAUST》 Perfect",
	"I wanna PaoPaoPaoPPaPPaPao!PanPan",
	"I wanna be the Music2 - 黄流《INFINITE》 Perfect",
	"I wanna be the Super Fish",
	"I wanna be the dop",
	"Happy Fantazma",
	"I wanna Crack the Candy",
	"I Wanna 5H - Cyber",
	"I Wanna Break The Orchestra Entrance",
	"I wanna bye the Back Entrance",
	"I wanna break the Series Z 3 EX - Hamayara Area",
	"I wanna be the Battlegrounds - Tomo Stage",
	"I wanna be the Shrine Maiden 2 - Yukari phase 2",
	"I wanna be the Imasugu - サクラヨゾラ",
	"I wanna be the Railgun - Very Hard Boss",
	"I Wanna Kill The Kamilia 3 - Tokoroten Area",
	"I Wanna Kill The Kamilia 3 - EX Colonel",
	"I Wanna Kill The Kamilia 3 - ouka Area",
	"I Wanna Stop The Bathroom Installation",
	"Bottomless Abyss",
	"I wanna be the Immature Life",
	"I wanna Mustela",
	"I Wanna Take The Curtain Call",
	"I wanna be the VCL",
	"I wanna grand of the perfect bear",
	"I wanna be the Music2 - Last Concerto《EXHAUST》 Perfect",
	"I Wanna Be The Music -  組曲『ニコニコ動画』Extreme",
	"I wanna kill the Kamilia 2 WARPED - Bottomless Abyss",
	"I wanna be THE iDOLM@STER - Kotori Otonashi",
	"I wanna be the くれいじーおぴんこす///",
	"I wanna break the Series Z 3 - Final Boss",
	"I wanna Count 0 ver.EX",
	"Drunk Crunk Franken - Fixed ver.",
	"I Wanna GO The CHARMSTINATION - Extra Boss",
	"I wanna be the Penger",
	"I wanna be the 2006",
	"I wanna be the semantic compositions on death and its meaning - Right Warp",
	"I wanna be the Hidden++",
	"DEATH GRIPS IS ONLINE",
	"I wanna Touch the Ripper",
	"I wanna be the Odyssey - Final Boss",
	"I wanna be the !!!ChaosTime!!! ",
	"I Wanna Maker - Final Destination",
	"Twisted Drop Party"
};

Object.keys(avoidanceConfig).forEach(name => {
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
