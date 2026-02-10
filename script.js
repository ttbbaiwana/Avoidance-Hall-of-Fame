const page1 = document.getElementById("page-1");
const page2 = document.getElementById("page-2");
const nextBtn = document.getElementById("nextBtn");
const clearsInput = document.getElementById("clears");
const nameInput = document.getElementById("name");
const errorMsg = document.getElementById("gate-error");

const avoidanceContainer = document.getElementById("avoidance-container");

// ---------- PAGE 1 GATE ----------
function validateGate() {
  const clears = Number(clearsInput.value);
  const nameFilled = nameInput.value.trim().length > 0;

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
  const section = document.createElement("div");
  section.className = "avoidance";

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

    block.innerHTML = `
      <label>${category}</label>
      <div class="rating-buttons" data-category="${category}">
        ${Array.from({ length: 11 }, (_, i) =>
          `<button type="button" data-value="${i}">${i}</button>`
        ).join("")}
      </div>
    `;

    ratingsDiv.appendChild(block);
  });

  // Single Select Logic
  ratingsDiv.addEventListener("click", (e) => {
    if (!e.target.matches("button[data-value]")) return;

    const button = e.target;
    const buttonGroup = button.parentElement;

    // Clear previous selection in this category
    buttonGroup.querySelectorAll("button").forEach(btn =>
      btn.classList.remove("selected")
    );

    // Select the clicked button
    button.classList.add("selected");
  });
	
	expButtons.forEach(btn => {
	  btn.addEventListener("click", () => {
	    const answer = btn.dataset.answer;
	
	    // Visual state
	    expButtons.forEach(b => b.classList.remove("selected"));
	    btn.classList.add("selected");
	
	    // Show / hide ratings
	    if (answer === "yes") {
	      ratingsDiv.classList.remove("hidden");
	    } else {
	      ratingsDiv.classList.add("hidden");
	    }
	  });
	});

  return section;
}

const avoidanceNames = [
  "Soulless Hard Mode",
  "Avoidance Name 2",
  "Avoidance Name 3",
  // ...
  // eventually 162 items
];

avoidanceNames.forEach(name => {
  avoidanceContainer.appendChild(createAvoidanceSection(name));
});
