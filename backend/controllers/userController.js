const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// REGISTER - Save user to database
exports.register = (req, res) => {
  const { fullName, email, password, phoneNumber, registrationNumber, role, university } = req.body;

  console.log("REGISTER attempt:", email);

  // Check if user exists
  const checkQuery = 'SELECT * FROM users WHERE email = ? OR registrationNumber = ?';
  db.query(checkQuery, [email, registrationNumber], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `INSERT INTO users (fullName, email, password, phoneNumber, registrationNumber, role, university) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(insertQuery, [fullName, email, hashedPassword, phoneNumber, registrationNumber, role, university], (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ success: false, message: 'Registration failed' });
      }

      // Create token
      const token = jwt.sign({ id: result.insertId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: { id: result.insertId, fullName, email, role, university }
      });
    });
  });
};

// LOGIN - Authenticate user
exports.login = (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN attempt:", email);

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];
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
  });
};