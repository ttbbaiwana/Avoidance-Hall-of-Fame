document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
});

function loadHeader() {
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      const placeholder = document.getElementById("header-placeholder");
      if (!placeholder) return;

      placeholder.innerHTML = data;
      highlightActiveLink();
    })
    .catch(err => {
      console.error("Error loading header:", err);
    });
}

function highlightActiveLink() {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("nav-active");
    }
  });
}
