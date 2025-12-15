const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// ✅ ALLOW ALL REQUESTS (Fixes Network Error)
app.use(cors());
app.use(express.json());
app.options(/.*/, cors());

// MySQL connection pool
const db = mysql.createPool({
  host: "mainline.proxy.rlwy.net",
  user: "root",
  password: "LSnSEoOVpvWtZjclOcNvJqlQhQuzzJbj",
  // ⚠️ NOTE: Ensure your Railway DB is actually named "smart_campus". 
  // If connection fails, change this back to "railway".
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

// --- AUTH ROUTES ---

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

// ==========================================
// 📅 ATTENDANCE ROUTES (These were missing!)
// ==========================================

// 2. Mark Attendance (Teacher clicks P/A)
app.post("/attendance", (req, res) => {
  const { student_univ_id, status } = req.body;

  if (!student_univ_id || !status) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const subject = "Computer Networks"; // Hardcoded subject for now

  // 1. Find a valid Teacher ID first to prevent crashes
  const findTeacher = "SELECT teacher_id FROM teacher LIMIT 1";
  
  db.query(findTeacher, (err, teacherResults) => {
    if (err) return res.status(500).json({ success: false, message: "DB Error finding teacher" });

    // Use found teacher or default to 1
    const teacher_id = teacherResults.length > 0 ? teacherResults[0].teacher_id : 1;

    // 2. Insert/Update Attendance
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
      console.log(`✅ Marked ${status} for ${student_univ_id}`);
      res.json({ success: true, message: "Attendance saved successfully!" });
    });
  });
});

// 3. Fetch Attendance Summary (For Student Dashboard)
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