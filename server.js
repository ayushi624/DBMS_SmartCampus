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


// ✅ Add a simple "Hello" route to test the server in the browser
app.get("/", (req, res) => {
  res.send("Server is running correctly! 🚀");
});

// ✅ Switch to Port 3000
app.listen(3000, () => console.log("Server running on port 3000 🚀"));