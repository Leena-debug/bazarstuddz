const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ========== YOUR NGROK URL ==========
const NGROK_URL = 'https://uncurled-monitor-gorged.ngrok-free.dev';

// ========== EMAIL CONFIGURATION ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'lyna.achi2005@gmail.com',
    pass: 'uytjctnpplvpixac',  // ← App password without spaces
  },
});

// ========== REGISTER USER ==========
exports.register = async (req, res) => {
  const { fullName, email, password, phoneNumber, userType } = req.body;

  console.log('📝 Registration request:', { fullName, email, userType });

  if (!fullName || !email || !password || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields'
    });
  }

  if (!email.endsWith('@univ-alger.dz')) {
    return res.status(400).json({
      success: false,
      message: 'Please use your university email (@univ-alger.dz)'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  try {
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(`
      INSERT INTO users (fullname, email, password, phonenumber, user_type, role, points, rating, is_admin, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, fullname, email, phonenumber, user_type, role, points, rating, is_admin
    `, [fullName, email, hashedPassword, phoneNumber, userType || 'student', null, 100, 5.0, false]);

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ User registered successfully:', email, 'with ID:', user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        phoneNumber: user.phonenumber,
        userType: user.user_type,
        role: user.role,
        points: user.points,
        rating: user.rating,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// ========== LOGIN USER ==========
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  try {
    const result = await db.query(`
      SELECT id, fullname, email, password, phonenumber, user_type, role, points, rating, is_admin
      FROM users WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    delete user.password;

    console.log('✅ User logged in:', email, 'is_admin:', user.is_admin);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        phoneNumber: user.phonenumber,
        userType: user.user_type,
        role: user.role,
        points: user.points,
        rating: user.rating,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// ========== GET CURRENT USER ==========
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, fullname, email, phonenumber, user_type, role, points, rating, is_admin
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        phoneNumber: user.phonenumber,
        userType: user.user_type,
        role: user.role,
        points: user.points,
        rating: user.rating,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ========== FORGOT PASSWORD - SEND EMAIL TO USER + ADMIN DASHBOARD ==========
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    // Create password_reset_requests table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) NOT NULL,
        token_expiry TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id)
      )
    `);

    // Check if user exists
    const result = await db.query(
      'SELECT id, fullname, email FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // For security, still return success even if user doesn't exist
      return res.json({ 
        success: true, 
        message: 'If an account exists, you will receive a reset link' 
      });
    }

    const user = result.rows[0];

    // Generate reset token (valid for 24 hours)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Store reset token in users table
    await db.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetToken, tokenExpiry, user.id]
    );

    // Save request in password_reset_requests table (for Admin Dashboard)
    await db.query(`
      INSERT INTO password_reset_requests (user_id, user_email, user_name, reset_token, token_expiry)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.id, user.email, user.fullname, resetToken, tokenExpiry]);

    const resetLink = `${NGROK_URL}/reset-password?token=${resetToken}&user=${user.id}`;
    
    // ========== SEND EMAIL DIRECTLY TO USER ==========
    const mailOptions = {
      from: '"Bazar Stud DZ" <lyna.achi2005@gmail.com>',
      to: user.email,
      subject: 'Password Reset Request - Bazar Stud DZ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #8B5A2B; padding: 20px; text-align: center;">
            <h2 style="color: white;">Bazar Stud DZ</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd;">
            <h3>Hello ${user.fullname},</h3>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #8B5A2B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            </div>
            <p>Or copy this link:</p>
            <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${resetLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr>
            <p style="color: #888; font-size: 12px;">Bazar Stud DZ - Student Marketplace</p>
          </div>
        </div>
      `,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email sending failed:', error);
      } else {
        console.log('📧 Email sent successfully to:', user.email);
      }
    });
    
    console.log('========================================');
    console.log('🔐 PASSWORD RESET REQUEST');
    console.log('========================================');
    console.log(`👤 User: ${user.fullname} (${user.email})`);
    console.log(`🔗 Reset Link: ${resetLink}`);
    console.log(`📧 Reset email sent to user!`);
    console.log(`✅ Request saved in Admin Dashboard!`);
    console.log('========================================');

    res.json({ 
      success: true, 
      message: 'Password reset link has been sent to your email' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========== RESET PASSWORD ==========
exports.resetPassword = async (req, res) => {
  const { token, newPassword, userId } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    let query;
    let params;

    // If userId is provided, use it with token for extra security
    if (userId) {
      query = `
        SELECT id, email, fullname FROM users 
        WHERE id = $1 AND reset_token = $2 AND reset_token_expiry > NOW()
      `;
      params = [userId, token];
    } else {
      query = `
        SELECT id, email, fullname FROM users 
        WHERE reset_token = $1 AND reset_token_expiry > NOW()
      `;
      params = [token];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await db.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log(`✅ Password reset successfully for user: ${user.email}`);

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 