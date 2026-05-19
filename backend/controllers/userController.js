const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// REGISTER - Save user to database
exports.register = async (req, res) => {
  const { fullName, email, password, phoneNumber, registrationNumber, role, university } = req.body;

  console.log("REGISTER attempt:", email);

  try {
    // Check if user exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1 OR registrationNumber = $2';
    const existingUser = await db.query(checkQuery, [email, registrationNumber]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `INSERT INTO users (fullName, email, password, phoneNumber, registrationNumber, role, university) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    
    const result = await db.query(insertQuery, [fullName, email, hashedPassword, phoneNumber, registrationNumber, role, university]);
    const userId = result.rows[0].id;

    // Create token
    const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: userId, fullName, email, role, university }
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
};

// LOGIN - Authenticate user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN attempt:", email);

  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        university: user.university,
        points: user.points || 0
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  }
};