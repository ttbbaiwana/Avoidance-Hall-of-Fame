const GOOGLE_SCRIPT_URL = API_CONFIG.BASE_URL;
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

let validPlayerNames = [];

function getContrastTextColor(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);

  // Perceived luminance (WCAG-ish)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#000000" : "#ffffff";
}

async function fetchValidPlayerNames() {
  try {
    const res = await fetch("data/players.json");
    const json = await res.json();

    // Player column index = 2 (Country, Avatar, Player...)
    validPlayerNames = [...new Set(
      json.data.map(row => row[2])
    )].sort();

    setupNameAutocomplete();
  } catch (err) {
    console.error("Failed to fetch player names", err);
  }
}

fetchValidPlayerNames();

// ---------- PAGE 1 GATE ----------
function validateGate() {
  const clears = Number(clearsInput.value);
  const enteredName = nameInput.value.trim();
	const nameFilled = validPlayerNames.includes(enteredName);
	responses.meta.name = nameInput.value.trim();

  if (nameFilled && clears >= 5) {
    nextBtn.disabled = false;
    errorMsg.style.display = "none";
  } else {
    nextBtn.disabled = true;
		if (!nameFilled && enteredName.length > 0) {
		  errorMsg.innerText = "Name must match a valid AHoF player.";
		  errorMsg.style.display = "block";
		}
		else if (clears > 0 && clears < 5) {
		  errorMsg.innerText = "You must have at least 5 AHoF clears.";
		  errorMsg.style.display = "block";
		}
		else {
		  errorMsg.style.display = "none";
		}
  }
}

clearsInput.addEventListener("input", validateGate);
nameInput.addEventListener("input", validateGate);

nextBtn.addEventListener("click", () => {
  page1.hidden = true;
  page2.hidden = false;

	document.getElementById("submitBtn").classList.remove("hidden");
});

// ---------- AVOIDANCE TEMPLATE ----------
const ratingCategories = [
  { key: "Reading Intricacy", label: "Reading Intricacy (RNG)" },
  { key: "Speed", label: "Speed (RNG)" },
  { key: "Density", label: "Density (RNG)" },
  { key: "Pattern", label: "Pattern (FIXED)" },
  { key: "Gimmick", label: "Gimmick" },
  { key: "Luck", label: "Luck" },
  { key: "Quality", label: "Quality" }
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
	
	  <div class="ratings hidden">
	    <p class="rating-instructions">
	        Rate the game based on the following criteria.
	        (Refer to the <strong>"Category Information"</strong> sheet for rating definitions)
	    </p>
	  </div>
	`;

  const ratingsDiv = section.querySelector(".ratings");
  const expButtons = section.querySelectorAll(".exp-btn");

  // Build rating blocks
	ratingCategories.forEach(({ key, label }) => {
	
	  const block = document.createElement("div");
	  block.className = "rating";
	  block.dataset.categoryKey = key;
	
	  const groupName = `${name}-${key}`.replace(/\s+/g, "_");
	
	  block.innerHTML = `
	    <label class="rating-label">${label}</label>
	
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
				  submitBtn.classList.remove("hidden");
				} else {
        	responses.avoidances[name].experience = "no";
					ratingsDiv.classList.add("hidden");
					submitBtn.classList.add("hidden");
					submitStatus.innerText = "";
					const radios = ratingsDiv.querySelectorAll('input[type="radio"]');
					radios.forEach(radio => {
	          radio.checked = false;
	          radio.dataset.wasChecked = "false";
        	});					
        	responses.avoidances[name].ratings = {};
				}
    });
  });

  // Toggleable radio behavior + data sync
	ratingsDiv.addEventListener("click", (e) => {
	
	  if (e.target.type !== "radio") return;
	
	  const radio = e.target;
	  const block = radio.closest(".rating");
	  const categoryKey = block.dataset.categoryKey;
	
	  const avoidance = responses.avoidances[name];
	
	  if (radio.dataset.wasChecked === "true") {
	    radio.checked = false;
	    radio.dataset.wasChecked = "false";
	    delete avoidance.ratings[categoryKey];
	  } else {
	    const group = ratingsDiv.querySelectorAll(
	      `input[name="${radio.name}"]`
	    );
	    group.forEach(r => (r.dataset.wasChecked = "false"));
	
	    radio.dataset.wasChecked = "true";
	    avoidance.ratings[categoryKey] = Number(radio.value);
	  }
	});

	const submitBtn = document.createElement("button");
	submitBtn.className = "primary-button hidden";
	submitBtn.textContent = "Submit";
	
	const submitStatus = document.createElement("p");
	submitStatus.className = "submit-status";
	
	section.appendChild(submitBtn);
	section.appendChild(submitStatus);

	function validateSingleAvoidance() {
	  const data = responses.avoidances[name];
		
	  if (data.experience !== "yes") {
	    alert(`You must select "Yes" for "${name}" before submitting.`);
	    return false;
	  }
		
	  if (Object.keys(data.ratings).length === 0) {
	    alert(`You must rate at least one category for "${name}".`);
	    return false;
	  }
	
	  return true;
	}

	submitBtn.addEventListener("click", async () => {
	  if (!validateSingleAvoidance()) return;
	
	  submitBtn.disabled = true;
	  submitStatus.innerText = "Submitting...";
		
	  const payload = {
	    meta: responses.meta,
	    avoidances: {
	      [name]: responses.avoidances[name]
	    }
	  };
	
	  try {
	    const res = await fetch(GOOGLE_SCRIPT_URL, {
	      method: "POST",
	      body: JSON.stringify(payload)
	    });
	
	    const result = await res.json();
	
	    if (result.status === "ok") {
	      submitStatus.innerText = "Submitted successfully!";
	    } else {
	      throw new Error("Submission failed");
	    }
	  } catch (err) {
	    submitStatus.innerText = "Submission failed. Please try again.";
	    submitBtn.disabled = false;
	    console.error(err);
	  }
	});
	
  return section;
}

avoidanceConfig.forEach(({ name }) => {
  avoidanceContainer.appendChild(createAvoidanceSection(name));
});

const submitBtn = document.getElementById("submitBtn");
const submitStatus = document.getElementById("submitStatus");

function validateBeforeSubmit() {
  let ratedAvoidanceCount = 0;

  for (const [name, data] of Object.entries(responses.avoidances)) {
    if (data.experience === "yes") {
      const ratingCount = Object.keys(data.ratings).length;
			
      if (ratingCount === 0) {
        alert(
          `You selected "Yes" for "${name}" but did not provide any ratings.`
        );
        return false;
      }

      ratedAvoidanceCount++;
    }
  }
	
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

function setupNameAutocomplete() {

  const input = document.getElementById("name");
  const list = document.getElementById("name-autocomplete-list");

  input.addEventListener("input", () => {

    const value = input.value.toLowerCase();
    list.innerHTML = "";

    if (!value) {
      list.classList.add("hidden");
      return;
    }

    const startsWith = [];
    const includes = [];

    validPlayerNames.forEach(name => {
      const lower = name.toLowerCase();

      if (lower.startsWith(value)) startsWith.push(name);
      else if (lower.includes(value)) includes.push(name);
    });

    const matches = [...startsWith, ...includes].slice(0, 10);

    if (!matches.length) {
      list.classList.add("hidden");
      return;
    }

    matches.forEach(match => {
      const div = document.createElement("div");
      div.classList.add("autocomplete-item");
      div.textContent = match;

      div.addEventListener("click", () => {
        input.value = match;
        list.classList.add("hidden");
        validateGate();
      });

      list.appendChild(div);
    });

    list.classList.remove("hidden");
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete-wrapper")) {
      list.classList.add("hidden");
    }
  });
}
