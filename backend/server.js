const express = require("express");
const cors = require("cors");
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