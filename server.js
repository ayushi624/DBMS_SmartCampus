const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: /.*/,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type"
}));

app.use(express.json());
app.options(/.*/, cors());

// MySQL connection pool
const db = mysql.createPool({
  host: "mainline.proxy.rlwy.net",
  user: "root",
  password: "LSnSEoOVpvWtZjclOcNvJqlQhQuzzJbj",
  database: "smart_campus",
  port: 35860,
  ssl: { rejectUnauthorized: false },
  connectionLimit: 10
});

// ✅ FIX: Used getConnection instead of connect for connection pools
db.getConnection((err, connection) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database ✅");
    connection.release(); // Release the connection back to the pool
  }
});

// --- ROUTES ---

// Signup Route
app.post("/signup", (req, res) => {
  console.log("🔥 Signup request received:", req.body);

  const { name, email, password, role, idInput } = req.body;

  if (role === "student") {
    const sql = `INSERT INTO student (full_name, email, student_univ_id, password)
                 VALUES (?, ?, ?, ?)`;

    db.query(sql, [name, email, idInput, password], (err, result) => {
      if (err) {
        console.log("Signup Error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(200).json({ message: "Student Registered Successfully!" });
    });
  } else if (role === "teacher") {
    return res.status(200).json({ message: "Teacher Registration Placeholder" });
  } else {
    return res.status(400).json({ error: "Invalid role" });
  }
});

// Login Route
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const table = role === "student" ? "student" : "teacher";
  
  // Note: It's better to verify password hashes in production, 
  // but for now strict comparison is fine if stored as plain text.
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
/* =====================================================
   COMPLAINT MANAGEMENT ROUTES
===================================================== */

/* STUDENT → SUBMIT COMPLAINT */
app.post("/complaints", (req, res) => {
  const { student_univ_id, title, description } = req.body;

  if (!student_univ_id || !title || !description) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  const findStudentQuery = `
    SELECT student_id FROM student
    WHERE student_univ_id = ?
  `;

  db.query(findStudentQuery, [student_univ_id], (err, result) => {
    if (err || result.length === 0) {
      console.error(err);
      return res.status(400).json({
        success: false,
        message: "Invalid student university ID",
      });
    }

    const student_id = result[0].student_id;

    const insertComplaintQuery = `
      INSERT INTO complaints (student_id, title, description)
      VALUES (?, ?, ?)
    `;

    db.query(
      insertComplaintQuery,
      [student_id, title, description],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "Failed to submit complaint",
          });
        }

        res.json({
          success: true,
          message: "Complaint submitted successfully",
        });
      }
    );
  });
});

/* STUDENT → FETCH OWN COMPLAINTS */
app.get("/complaints/:student_univ_id", (req, res) => {
  const { student_univ_id } = req.params;

  const query = `
    SELECT c.*
    FROM complaints c
    JOIN student s ON c.student_id = s.student_id
    WHERE s.student_univ_id = ?
    ORDER BY c.created_at DESC
  `;

  db.query(query, [student_univ_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

/* TEACHER → FETCH ALL COMPLAINTS (USING VIEW) */
app.get("/complaints", (req, res) => {
  const query = `SELECT * FROM teacher_complaints_view`;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

/* TEACHER → UPDATE COMPLAINT STATUS */
app.put("/complaints/:id", (req, res) => {
  const { status } = req.body;
  const complaint_id = req.params.id;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  const updateQuery = `
    UPDATE complaints
    SET status = ?
    WHERE complaint_id = ?
  `;

  db.query(updateQuery, [status, complaint_id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }

    res.json({
      success: true,
      message: "Complaint status updated successfully",
    });
  });
});


// ✅ Add a simple "Hello" route to test the server in the browser
app.get("/", (req, res) => {
  res.send("Server is running correctly! 🚀");
});

// ✅ Switch to Port 3000
app.listen(3000, () => console.log("Server running on port 3000 🚀"));