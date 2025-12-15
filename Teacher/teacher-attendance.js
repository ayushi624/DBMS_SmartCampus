// ✅ Configuration
const API_BASE_URL = "http://127.0.0.1:3000"; // Ensure this matches your Server Port

document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
    setupSearch();
    setupModal();
});

// ==================================================
// 1. FETCH & DISPLAY STUDENTS
// ==================================================
async function loadStudents() {
    const tableBody = document.getElementById("studentTableBody");

    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const students = await response.json();

        // Clear "Loading..." text
        tableBody.innerHTML = "";

        if (students.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='3'>No students found in database.</td></tr>";
            return;
        }

        // Generate HTML for each student
        students.forEach(student => {
            const row = document.createElement("tr");
            
            // Check local storage to see if we already marked them today (optional UI persistence)
            const savedStatus = localStorage.getItem(`attendance_${student.student_univ_id}`);
            const rowClass = savedStatus ? savedStatus.toLowerCase() : "";

            row.innerHTML = `
                <td>${student.student_univ_id}</td>
                <td>${student.full_name}</td>
                <td class="attendance-actions">
                    <button class="btn-present" onclick="markAttendance('${student.student_univ_id}', 'Present', this)">P</button>
                    <button class="btn-absent" onclick="markAttendance('${student.student_univ_id}', 'Absent', this)">A</button>
                </td>
            `;

            // Apply styling if previously marked
            if (savedStatus) {
                row.classList.add(rowClass);
                // Disable the clicked button visually
                const pBtn = row.querySelector(".btn-present");
                const aBtn = row.querySelector(".btn-absent");
                if (savedStatus === "Present") pBtn.style.opacity = "1";
                if (savedStatus === "Absent") aBtn.style.opacity = "1";
            }

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading students:", error);
        tableBody.innerHTML = "<tr><td colspan='3' style='color:red;'>Error connecting to server. Is Node running?</td></tr>";
    }
}

// ==================================================
// 2. MARK ATTENDANCE (SEND TO DB)
// ==================================================
async function markAttendance(studentUnivId, status, btnElement) {
    const row = btnElement.closest("tr");
    
    // UI Feedback immediately (Optimistic UI)
    row.classList.remove("present", "absent");
    row.classList.add(status.toLowerCase());
    
    // Save to LocalStorage (so it persists if page reloads)
    localStorage.setItem(`attendance_${studentUnivId}`, status);

    try {
        const response = await fetch(`${API_BASE_URL}/attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_univ_id: studentUnivId,
                status: status,
                date: new Date().toISOString().split("T")[0] // YYYY-MM-DD
            }),
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ Marked ${status} for ID: ${studentUnivId}`);
        } else {
            showToast(`❌ Error: ${result.message}`);
        }

    } catch (error) {
        console.error("Network Error:", error);
        showToast("⚠️ Server error. Attendance not saved.");
    }
}

// ==================================================
// 3. SEARCH FUNCTIONALITY
// ==================================================
function setupSearch() {
    const searchInput = document.getElementById("search");
    
    searchInput?.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll("#studentTableBody tr");
        
        rows.forEach(row => {
            const roll = row.children[0].textContent.toLowerCase();
            const name = row.children[1].textContent.toLowerCase();
            // Show if matches, hide if not
            row.style.display = (roll.includes(query) || name.includes(query)) ? "" : "none";
        });
    });
}

// ==================================================
// 4. TOAST NOTIFICATIONS
// ==================================================
function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed", bottom: "20px", right: "20px",
        background: "#333", color: "#fff", padding: "12px 20px",
        borderRadius: "8px", fontSize: "14px", zIndex: "1000",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)", opacity: "0",
        transition: "opacity 0.3s ease"
    });

    document.body.appendChild(toast);
    
    // Fade in
    requestAnimationFrame(() => toast.style.opacity = "1");

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ==================================================
// 5. MODAL (Optional Defaulter List)
// ==================================================
function setupModal() {
    const modal = document.getElementById("defaulterModal");
    const closeBtn = modal?.querySelector(".close-btn");
    const openBtn = document.querySelector(".btn-defaulters");

    if (modal && closeBtn && openBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "none";
        });

        openBtn.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "flex";
        });
    }
}