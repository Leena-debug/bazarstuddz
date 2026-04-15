const express = require("express");
const cors = require('cors'); // Ensure you have installed: npm install cors
const app = express();

const sequelize = require('./config/db');
const userRoutes = require("./routes/userRoutes");

// 1. DEFINE CORS OPTIONS
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:19006', 
    'http://localhost:19000', 
    'http://10.0.2.2:3000',
    'http://localhost:8081' 
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// 2. APPLY CORS AND JSON PARSER
app.use(cors(corsOptions));
app.use(express.json());

// 3. BASE TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend is working ✅");
});

// 4. API ROUTES
// This handles all login/register/switch-role requests defined in userRoutes.js
app.use("/api/users", userRoutes);

// 5. DATABASE SYNC AND SERVER START
sequelize.sync({ alter: true })
  .then(() => {
    console.log('🚀 Database tables synced successfully');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error('❌ Could not sync database:', err));