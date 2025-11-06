// ===== 1. SEARCH FILTER =====
const searchInput = document.getElementById("search");
const tableRows = document.querySelectorAll(".attendance-table tbody tr");

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  tableRows.forEach(row => {
    const roll = row.children[0].textContent.toLowerCase();
    const name = row.children[1].textContent.toLowerCase();
    row.style.display = roll.includes(query) || name.includes(query) ? "" : "none";
  });
});

// ===== 2. MARK ATTENDANCE =====
document.querySelectorAll(".attendance-actions").forEach(actions => {
  const row = actions.closest("tr");
  const rollNo = row.children[0].textContent;

  actions.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-present")) {
      setAttendance(rollNo, "Present", row);
    } else if (e.target.classList.contains("btn-absent")) {
      setAttendance(rollNo, "Absent", row);
    }
  });

  // Restore previous state (if exists)
  const saved = localStorage.getItem(`attendance_${rollNo}`);
  if (saved) {
    applyAttendance(row, saved);
  }
});

function setAttendance(rollNo, status, row) {
  localStorage.setItem(`attendance_${rollNo}`, status);
  applyAttendance(row, status);
  showToast(`Marked ${status} for ${row.children[1].textContent}`);
}

function applyAttendance(row, status) {
  row.classList.remove("present", "absent");
  row.classList.add(status.toLowerCase());
  row.querySelector(".btn-present").disabled = status === "Present";
  row.querySelector(".btn-absent").disabled = status === "Absent";
}

// ===== 3. RESET (Optional - for testing) =====
// Uncomment this line to clear attendance every reload
// localStorage.clear();

// ===== 4. MODAL TOGGLE =====
const modal = document.getElementById("defaulterModal");
const closeBtn = modal?.querySelector(".close-btn");

if (modal && closeBtn) {
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "none";
  });

  document.querySelector(".btn-defaulters")?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
  });
}

// ===== 5. TOAST MESSAGE =====
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.4s ease";
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = "1"), 50);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}
