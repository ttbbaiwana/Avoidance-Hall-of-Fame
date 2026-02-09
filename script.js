const clearsInput = document.getElementById("clears");
const nameInput = document.getElementById("name");
const nextBtn = document.getElementById("nextBtn");
const errorMsg = document.getElementById("gate-error");

const page1 = document.getElementById("page-1");
const page2 = document.getElementById("page-2");

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
