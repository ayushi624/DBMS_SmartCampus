// ===== 1. SEARCH FILTER =====
const searchInput = document.getElementById("search");
const subjectCards = document.querySelectorAll(".subject-card");

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  subjectCards.forEach(card => {
    const title = card.querySelector("h4").textContent.toLowerCase();
    card.style.display = title.includes(query) ? "block" : "none";
  });
});


// ===== 3. BUNKS AVAILABLE ALERT =====
const bunksTrigger = document.getElementById("bunks-stat-trigger");
bunksTrigger?.addEventListener("click", () => {
  const value = bunksTrigger.querySelector("h3").textContent;
  alert(`You have ${value} bunks remaining. Use them wisely 😎`);
});

// ===== 4. PROGRESS BAR ANIMATION =====
window.addEventListener("load", () => {
  document.querySelectorAll(".bar-fill, .progress-fill").forEach(bar => {
    const width = bar.style.width;
    bar.style.width = "0";
    setTimeout(() => {
      bar.style.transition = "width 1s ease";
      bar.style.width = width;
    }, 100);
  });
});
