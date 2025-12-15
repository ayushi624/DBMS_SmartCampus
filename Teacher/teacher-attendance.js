const API_BASE_URL = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadTeacherCourses();
    loadStudents();
    setupSearch();
});

// Global variable to store current teacher info
let currentTeacher = null;

function checkLogin() {
    // 1. Get User Data from Login
    const userStr = localStorage.getItem("user");
    if (!userStr) {
        alert("Please login first!");
        window.location.href = "../login.html";
        return;
    }
    
    // Parse the user object
    currentTeacher = JSON.parse(userStr);
    
    // Safety check: ensure it's actually a teacher
    // (You might want to add a 'role' check here if your login saves it)
    if (!currentTeacher.teacher_id) {
        console.warn("Logged in user does not appear to be a teacher.");
    }
}

// ==================================================
// 1. FETCH TEACHER'S COURSES
// ==================================================
async function loadTeacherCourses() {
    const courseSelect = document.getElementById("courseSelect");

    try {
        // Use the logged-in teacher's ID
        const response = await fetch(`${API_BASE_URL}/teacher-courses/${currentTeacher.teacher_id}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Clear default option
            courseSelect.innerHTML = '<option value="" disabled selected>Select Subject...</option>';
            
            result.data.forEach(course => {
                const option = document.createElement("option");
                option.value = course.course_name; // We use Name as the identifier for attendance table
                option.textContent = `${course.course_name} (${course.course_code})`;
                courseSelect.appendChild(option);
            });
        } else {
            courseSelect.innerHTML = '<option disabled>No courses assigned</option>';
        }

    } catch (error) {
        console.error("Error loading courses:", error);
    }
}

// ==================================================
// 2. FETCH & DISPLAY STUDENTS
// ==================================================
async function loadStudents() {
    const tableBody = document.getElementById("studentTableBody");
    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const students = await response.json();

        tableBody.innerHTML = "";
        
        if (students.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='3'>No students found.</td></tr>";
            return;
        }

        students.forEach(student => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.student_univ_id}</td>
                <td>${student.full_name}</td>
                <td class="attendance-actions">
                    <button class="btn-present" onclick="markAttendance('${student.student_univ_id}', 'Present', this)">P</button>
                    <button class="btn-absent" onclick="markAttendance('${student.student_univ_id}', 'Absent', this)">A</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading students:", error);
        tableBody.innerHTML = "<tr><td colspan='3' style='color:red;'>Server Error</td></tr>";
    }
}

// ==================================================
// 3. MARK ATTENDANCE (DYNAMIC SUBJECT)
// ==================================================
async function markAttendance(studentUnivId, status, btnElement) {
    const courseSelect = document.getElementById("courseSelect");
    const selectedSubject = courseSelect.value;

    // 🛑 VALIDATION: Ensure a subject is selected
    if (!selectedSubject) {
        alert("⚠️ Please select a subject first!");
        courseSelect.focus();
        return;
    }

    const row = btnElement.closest("tr");
    
    // UI Feedback
    row.classList.remove("present", "absent");
    row.classList.add(status.toLowerCase());

    try {
        const response = await fetch(`${API_BASE_URL}/attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                teacher_id: currentTeacher.teacher_id, // ✅ Send Logged-in Teacher ID
                subject: selectedSubject,             // ✅ Send Selected Subject
                student_univ_id: studentUnivId,
                status: status
            }),
        });

        const result = await response.json();

        if (result.success) {
            showToast(`✅ Marked ${status} in ${selectedSubject}`);
        } else {
            showToast(`❌ Error: ${result.message}`);
        }

    } catch (error) {
        console.error("Network Error:", error);
        showToast("⚠️ Server error.");
    }
}

// ... (Keep your existing search and toast functions here) ...
function setupSearch() {
    const searchInput = document.getElementById("search");
    searchInput?.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll("#studentTableBody tr");
        rows.forEach(row => {
            const roll = row.children[0].textContent.toLowerCase();
            const name = row.children[1].textContent.toLowerCase();
            row.style.display = (roll.includes(query) || name.includes(query)) ? "" : "none";
        });
    });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed", bottom: "20px", right: "20px",
        background: "#333", color: "#fff", padding: "12px 20px",
        borderRadius: "8px", fontSize: "14px", zIndex: "1000",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)", opacity: "0", transition: "opacity 0.3s ease"
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = "1");
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}