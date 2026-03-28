const express = require("express");
const app = express();

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

// app.use("/api/users", userRoutes);
app.listen(5000, () => {
  console.log("Server running on port 5000");
});



















/*const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');  // Add this line

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BazarStudDZ API is running!',
    database: 'MySQL connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});




/* this is new code and i don't try it yet 
// backend/server.js - Update CORS
const cors = require('cors');

// Allow mobile app origins
const corsOptions = {
  origin: [
    'http://localhost:3000',        // Web dev
    'http://localhost:19006',       // Expo web
    'exp://localhost:19000',        // Expo Go
    'http://10.0.2.2:3000',        // Android emulator
    /\.yourdomain\.com$/,          // Your production domain
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// this code is new and i don't try it yet
//// backend/server.js - Update CORS
const cors = require('cors');

// Allow mobile app origins
const corsOptions = {
  origin: [
    'http://localhost:3000',        // Web dev
    'http://localhost:19006',       // Expo web
    'exp://localhost:19000',        // Expo Go
    'http://10.0.2.2:3000',        // Android emulator
    /\.yourdomain\.com$/,          // Your production domain
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));*/