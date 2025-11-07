const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // or whatever username you use
  password: "Ayushi._8011",
  database: "smart_campus",
});

db.connect(err => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database ✅");
  }
});

// --- EXAMPLES OF ROUTES ---

// Fetch all complaints
app.get("/complaints", (req, res) => {
  db.query("SELECT * FROM complaints", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add new complaint
app.post("/complaints", (req, res) => {
  const { student_id, title, description } = req.body;
  const sql = "INSERT INTO complaints (student_id, title, description) VALUES (?, ?, ?)";
  db.query(sql, [student_id, title, description], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Complaint added successfully!" });
  });
});

// Fetch all events
app.get("/events", (req, res) => {
  db.query("SELECT * FROM events", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Attendance by student
app.get("/attendance/:student_id", (req, res) => {
  const { student_id } = req.params;
  db.query("SELECT * FROM attendance WHERE student_id = ?", [student_id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post("/signup", (req, res) => {
  const { name, email, password, role, idInput } = req.body;

  if (!name || !email || !password || !role || !idInput) {
    return res.status(400).json({ error: "All fields are required" });
  }

  let table = role === "student" ? "student" : "teacher";
  let idColumn = role === "student" ? "student_univ_id" : "teacher_univ_id";

  const sql = `INSERT INTO ${table} (full_name, email, password, ${idColumn}) VALUES (?, ?, ?, ?)`;

  db.query(sql, [name, email, password, idInput], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ message: "User registered successfully!" });
  });
});


// LOGIN ROUTE
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const table = role === "student" ? "student" : "teacher";
  const idField = role === "student" ? "student_id" : "teacher_id";

  const query = `SELECT * FROM ${table} WHERE email = ? AND password = ?`;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (results.length > 0) {
      res.json({ success: true, message: "Login successful", user: results[0] });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  });
});


// ================================
// 📅 ATTENDANCE ROUTES
// ================================
// ==========================================
// 📅 Attendance Marking Route
// ==========================================
app.post("/attendance", (req, res) => {
  const { student_univ_id, status, date } = req.body;

  if (!student_univ_id || !status) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const teacher_id = 1; // you can replace later with logged-in teacher
  const subject = "Computer Networks"; // also can make dynamic later

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
      console.error("Error inserting attendance:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, message: "Attendance saved successfully!" });
  });
});





// ==========================================
// 📊 Get Attendance for a Student
// ==========================================
// 🧠 Fetch attendance summary for a specific student
app.get("/attendance/:student_univ_id", (req, res) => {
  const { student_univ_id } = req.params;

  const query = `
    SELECT 
      s.full_name,
      s.student_univ_id,
      a.subject,
      a.total_classes,
      a.attended_classes,
      ROUND((a.attended_classes / a.total_classes) * 100, 1) AS attendance_percentage,
      a.last_updated
    FROM student s
    JOIN attendance a ON s.student_id = a.student_id
    WHERE s.student_univ_id = ?;
  `;

  db.query(query, [student_univ_id], (err, results) => {
    if (err) {
      console.error("Error fetching attendance:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: results });
  });
});




// =============================
// 🧾 COMPLAINT ROUTES
// =============================

app.post("/complaints", (req, res) => {
  console.log("🟡 Received complaint request:", req.body);

  const { student_univ_id, title, description } = req.body;

  if (!student_univ_id || !title || !description) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  // Rest of your code (keep the findStudent + insert logic)



  // Get the student's ID first
  const findStudent = "SELECT student_id FROM student WHERE student_univ_id = ?";
  db.query(findStudent, [student_univ_id], (err, results) => {
    if (err) {
      console.error("Error finding student:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const student_id = results[0].student_id;

    const insertComplaint = `
      INSERT INTO complaints (student_id, title, description)
      VALUES (?, ?, ?)
    `;
    db.query(insertComplaint, [student_id, title, description], (err2) => {
      if (err2) {
        console.error("Error adding complaint:", err2);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Complaint submitted successfully!" });
    });
  });
});

// Fetch all complaints for a specific student
app.get("/complaints/:student_univ_id", (req, res) => {
  const { student_univ_id } = req.params;

  const query = `
    SELECT c.complaint_id, c.title, c.description, c.status, c.created_at
    FROM complaints c
    JOIN student s ON c.student_id = s.student_id
    WHERE s.student_univ_id = ?
    ORDER BY c.created_at DESC;
  `;

  db.query(query, [student_univ_id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching complaints:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, data: results });
  });
});






app.listen(5000, () => console.log("Server running on port 5000 🚀"));
