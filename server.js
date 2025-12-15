const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// ✅ ALLOW ALL REQUESTS
app.use(cors());
app.use(express.json());
app.options(/.*/, cors());

// MySQL connection pool
const db = mysql.createPool({
  host: "mainline.proxy.rlwy.net",
  user: "root",
  password: "LSnSEoOVpvWtZjclOcNvJqlQhQuzzJbj",
  // ⚠️ Ensure this matches your actual DB name on Railway
  database: "smart_campus", 
  port: 35860,
  ssl: { rejectUnauthorized: false },
  connectionLimit: 10
});

// Check DB Connection
db.getConnection((err, connection) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database ✅");
    connection.release(); 
  }
});

// ==========================================
// 👤 AUTH ROUTES
// ==========================================

// Signup Route
app.post("/signup", (req, res) => {
  console.log("🔥 Signup request received:", req.body);
  const { name, email, password, role, idInput } = req.body;

  if (role === "student") {
    const sql = `INSERT INTO student (full_name, email, student_univ_id, password) VALUES (?, ?, ?, ?)`;
    db.query(sql, [name, email, idInput, password], (err, result) => {
      if (err) {
        console.log("Signup Error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(200).json({ message: "Student Registered Successfully!" });
    });
  } else {
    return res.status(400).json({ error: "Only student signup is active." });
  }
});

// Login Route
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ success: false, message: "Missing fields" });

  const table = role === "student" ? "student" : "teacher";
  const query = `SELECT * FROM ${table} WHERE email = ? AND password = ?`;

  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    if (results.length > 0) {
      res.json({ success: true, message: "Login successful", user: results[0] });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  });
});

// ==========================================
// 👩‍🏫 TEACHER ROUTES
// ==========================================

// 1. Fetch List of All Students (For Teacher Dashboard)
app.get("/students", (req, res) => {
  const query = "SELECT student_id, full_name, student_univ_id FROM student ORDER BY student_univ_id ASC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// 2. Fetch Courses Assigned to a Specific Teacher (NEW)
app.get("/teacher-courses/:teacher_id", (req, res) => {
  const { teacher_id } = req.params;
  
  const query = `
    SELECT c.course_name, c.course_code 
    FROM courses c
    JOIN teacher_courses tc ON c.course_id = tc.course_id
    WHERE tc.teacher_id = ?
  `;

  db.query(query, [teacher_id], (err, results) => {
    if (err) {
      console.error("Error fetching courses:", err);
      return res.status(500).json({ success: false, message: "DB Error" });
    }
    res.json({ success: true, data: results });
  });
});

// ==========================================
// 📅 ATTENDANCE ROUTES
// ==========================================

// 3. Mark Attendance (Updated to support Dynamic Subject & Teacher)
app.post("/attendance", (req, res) => {
  const { student_univ_id, status, subject, teacher_id } = req.body;

  // Validate all required fields are present
  if (!student_univ_id || !status || !subject || !teacher_id) {
    return res.status(400).json({ success: false, message: "Missing fields (subject or teacher_id)" });
  }

  const query = `
    INSERT INTO attendance (student_id, teacher_id, subject, total_classes, attended_classes)
    SELECT s.student_id, ?, ?, 1, IF(? = 'Present', 1, 0)
    FROM student s
    WHERE s.student_univ_id = ?
    ON DUPLICATE KEY UPDATE
      total_classes = total_classes + 1,
      attended_classes = attended_classes + IF(? = 'Present', 1, 0),
      last_updated = CURRENT_TIMESTAMP;
  `;

  db.query(query, [teacher_id, subject, status, student_univ_id, status], (err, result) => {
    if (err) {
      console.error("❌ Error inserting attendance:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
    console.log(`✅ Marked ${status} for ${student_univ_id} in ${subject}`);
    res.json({ success: true, message: "Attendance saved successfully!" });
  });
});

// 4. Fetch Attendance Summary (For Student Dashboard)
app.get("/attendance/:student_univ_id", (req, res) => {
  const { student_univ_id } = req.params;
  const query = `
    SELECT 
      a.subject,
      a.total_classes,
      a.attended_classes,
      ROUND((a.attended_classes / a.total_classes) * 100, 1) AS attendance_percentage
    FROM student s
    JOIN attendance a ON s.student_id = a.student_id
    WHERE s.student_univ_id = ?;
  `;

  db.query(query, [student_univ_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "DB Error" });
    res.json({ success: true, data: results });
  });
});

// Simple Hello Route
app.get("/", (req, res) => res.send("Server is running correctly! 🚀"));

// Start Server
app.listen(3000, () => console.log("Server running on port 3000 🚀"));