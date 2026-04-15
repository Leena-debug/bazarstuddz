const express = require("express");
<<<<<<< HEAD
const cors = require("cors");
=======
const app = express();
const userRoutes = require("./routes/userRoutes");

app.use(express.json());

// 🔥 Test route
app.get("/", (req, res) => {
  res.send("Backend is working ✅");
});

// 🔥 Login route
app.post("/api/users/login", (req, res) => {
  console.log("Login data:", req.body);
  res.json({ message: "Login received" });
});

// 🔥 Register route
app.post("/api/users/register", (req, res) => {
  console.log("Register data:", req.body);
  res.json({ message: "Register received" });
});

app.use("/api/users", userRoutes);
app.listen(5000, () => {
  console.log("Server running on port 5000");
});



















/*const express = require('express');
const cors = require('cors');
>>>>>>> cb2453f1aaf1afeca8c0809935917da009974bda
require('dotenv').config();
const db = require('./config/db');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");

// ✅ Use routes
app.use("/api/users", userRoutes);
app.use("/api", productRoutes);

// ✅ Test route (to check server quickly)
app.get("/", (req, res) => {
  res.json({
    message: "Backend is working ✅",
    database: "MySQL connected"
  });
});

// ✅ Start server - CHANGED THIS LINE
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from phone: http://192.168.1.70:${PORT}`);
});