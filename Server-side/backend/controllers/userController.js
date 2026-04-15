const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Feature 1: Role Toggling (Member B Task)
exports.switchRole = async (req, res) => {
  try {
    // TEMPORARY: Get userId from body instead of req.user
    const { userId, newRole } = req.body; 

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.currentRole = newRole;
    await user.save();

    res.status(200).json({
      message: "Role updated successfully",
      currentRole: user.currentRole
    });
  } catch (error) {
    res.status(500).json({ message: "Error switching role", error: error.message });
  }
};

// Feature 2: Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // TEMPORARY: Get userId from query parameters
    const { userId } = req.query; 
    const user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      points: user.points,
      // Ensure these fields exist in your User Model!
      totalListings: user.totalListings || 0, 
      totalSales: user.totalSales || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, userType } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName, email, password: hashedPassword, phoneNumber, userType
    });

    res.status(201).json({ message: "User registered successfully!", user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    res.status(500).json({ message: "Error during registration", error: error.message });
  }
};

// Login an existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};