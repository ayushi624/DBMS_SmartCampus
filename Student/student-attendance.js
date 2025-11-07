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



// ===== 5. FETCH ATTENDANCE FROM BACKEND =====
// ===== Fetch and Display Real Attendance =====
const studentUnivId = "2410990272"; // you can make this dynamic later based on login

async function fetchAttendance() {
  try {
    const res = await fetch(`http://localhost:5000/attendance/${studentUnivId}`);
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      document.querySelector(".subject-breakdown").innerHTML = `
        <h2>Subject-wise Breakdown</h2>
        <p>No attendance records found yet.</p>
      `;
      return;
    }

    const subjectsContainer = document.querySelector(".SUbjects");
    subjectsContainer.innerHTML = "";

    let totalClasses = 0;
    let totalAttended = 0;

    data.data.forEach((record) => {
      const percent = record.attendance_percentage || 0;

      totalClasses += record.total_classes;
      totalAttended += record.attended_classes;

      subjectsContainer.innerHTML += `
        <div class="subject-card">
          <div class="card-header">
            <h4>${record.subject}</h4>
            <span class="subject-percentage ${percent >= 75 ? "high" : "low"}">${percent}%</span>
          </div>
          <p class="subject-stats">Attended ${record.attended_classes} of ${record.total_classes} classes</p>
          <div class="progress-bar">
            <div class="progress-fill ${percent >= 75 ? "high" : "low"}" style="width: ${percent}%;"></div>
          </div>
        </div>
      `;
    });

    // Overall Stats Update
    const overallPercent = ((totalAttended / totalClasses) * 100).toFixed(1) || 0;
    document.querySelector(".stats").innerHTML = `
      <div class="stat"><h3>${overallPercent}<small>%</small></h3><p>Overall</p></div>
      <div class="stat"><h3>${totalAttended}<small>/${totalClasses}</small></h3><p>Classes Attended</p></div>
      <div class="stat"><h3>${totalClasses - totalAttended}</h3><p>Total Absences</p></div>
      <div class="stat" id="bunks-stat-trigger"><h3>${Math.max(0, Math.floor((totalAttended / totalClasses) * 60 - totalAttended))}</h3><p>Bunks Available*</p></div>
    `;
  } catch (err) {
    console.error("Error fetching attendance:", err);
  }
}

fetchAttendance();
