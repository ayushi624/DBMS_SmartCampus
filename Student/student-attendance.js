const API_BASE_URL = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Get the Logged-In Student ID
    const studentUnivId = localStorage.getItem("student_univ_id");

    // Security Check: If no user is logged in, kick them out
    if (!studentUnivId) {
        alert("You must be logged in to view this page.");
        window.location.href = "../login.html";
        return;
    }

    // 2. Fetch Data
    fetchAttendance(studentUnivId);
    setupSearch();
});

async function fetchAttendance(studentId) {
    try {
        const res = await fetch(`${API_BASE_URL}/attendance/${studentId}`);
        const result = await res.json(); // .json() gives us { success: true, data: [...] }

        // If something went wrong or array is empty
        if (!result.success || !result.data || result.data.length === 0) {
            document.getElementById("subjectsContainer").innerHTML = 
                `<p style="padding:20px;">No attendance records found. Ask your teacher to mark attendance!</p>`;
            return;
        }

        renderDashboard(result.data);

    } catch (err) {
        console.error("Error fetching attendance:", err);
        document.getElementById("subjectsContainer").innerHTML = 
            `<p style="color:red; padding:20px;">Server Error. Is Node running?</p>`;
    }
}

function renderDashboard(data) {
    const subjectsContainer = document.getElementById("subjectsContainer");
    const chartContainer = document.getElementById("chartContainer");
    
    // Clear loading text
    subjectsContainer.innerHTML = "";
    chartContainer.innerHTML = "";

    let totalClasses = 0;
    let totalAttended = 0;

    data.forEach((record) => {
        const percent = record.attendance_percentage || 0;
        const isHigh = percent >= 75;
        const colorClass = isHigh ? "high" : "low";

        // 1. Calculate Totals
        totalClasses += record.total_classes;
        totalAttended += record.attended_classes;

        // 2. Create Subject Card
        const cardHTML = `
            <div class="subject-card">
                <div class="card-header">
                    <h4>${record.subject}</h4>
                    <span class="subject-percentage ${colorClass}">${percent}%</span>
                </div>
                <p class="subject-stats">Attended ${record.attended_classes} of ${record.total_classes} classes</p>
                <div class="progress-bar">
                    <div class="progress-fill ${colorClass}" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;
        subjectsContainer.innerHTML += cardHTML;

        // 3. Create Chart Bar
        const barHTML = `
            <div class="bar">
                <span class="label">${record.subject}</span>
                <div class="bar-fill" style="height: 10px; width: ${percent}%; background-color: ${isHigh ? '#22c55e' : '#ef4444'}; border-radius:4px;"></div>
                <span class="value">${percent}%</span>
            </div>
        `;
        chartContainer.innerHTML += barHTML;
    });

    // 4. Update Top Stats
    updateTopStats(totalClasses, totalAttended);
}

function updateTopStats(total, attended) {
    const overallPercent = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;
    
    // Calculate "Bunks Available" (Simplistic logic: maintain > 75%)
    // Formula: (Attended / 0.75) - Total = Classes you could have missed
    const maxClassesFor75 = Math.floor(attended / 0.75);
    const bunksAvailable = Math.max(0, maxClassesFor75 - total);

    document.querySelector(".stats").innerHTML = `
        <div class="stat">
            <h3>${overallPercent}<small>%</small></h3>
            <p>Overall</p>
        </div>
        <div class="stat">
            <h3>${attended}<small>/${total}</small></h3>
            <p>Classes Attended</p>
        </div>
        <div class="stat">
            <h3>${total - attended}</h3>
            <p>Total Absences</p>
        </div>
        <div class="stat" onclick="alert('You can skip ${bunksAvailable} more classes before dropping below 75%')">
            <h3>${bunksAvailable}</h3>
            <p>Bunks Available*</p>
        </div>
    `;
}

// ===== SEARCH FILTER =====
function setupSearch() {
    const searchInput = document.getElementById("search");
    searchInput?.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll(".subject-card");
        
        cards.forEach(card => {
            const title = card.querySelector("h4").textContent.toLowerCase();
            card.style.display = title.includes(query) ? "block" : "none";
        });
    });
}