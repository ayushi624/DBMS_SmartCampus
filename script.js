document.addEventListener("DOMContentLoaded", async () => {
    // 1. Check Login Status
    const studentID = localStorage.getItem("student_univ_id");
    const fullName = localStorage.getItem("full_name");

    if (!studentID) {
        alert("Please login first.");
        window.location.href = "login.html"; // Kick them out if not logged in
        return;
    }

    // 2. Update Name on Dashboard
    if (fullName) {
        const firstName = fullName.split(" ")[0]; // Get just the first name
        document.getElementById("welcomeMsg").innerText = `Good afternoon, ${firstName}!`;
    }

    // 3. Fetch Real Attendance
    try {
        const response = await fetch(`http://127.0.0.1:3000/attendance/${studentID}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Calculate average attendance across all subjects
            let totalClasses = 0;
            let attendedClasses = 0;

            result.data.forEach(subject => {
                totalClasses += subject.total_classes;
                attendedClasses += subject.attended_classes;
            });

            // Avoid division by zero
            const totalPercentage = totalClasses > 0 
                ? Math.round((attendedClasses / totalClasses) * 100) 
                : 0;

            // Update the HTML
            document.getElementById("attendanceVal").innerText = `${totalPercentage}`;
        } else {
            document.getElementById("attendanceVal").innerText = "0";
        }

    } catch (error) {
        console.error("Error fetching attendance:", error);
    }
});