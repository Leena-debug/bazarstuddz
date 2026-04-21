const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Real authentication - gets full user data from PostgreSQL
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch complete user from database with all needed fields
      const query = `SELECT 
        id, 
        fullName, 
        email, 
        phoneNumber,
        registrationNumber,
        role,
        userType,
        currentRole,
        university,
        faculty,
        academicYear,
        fieldOfStudy,
        department,
        position,
        avatar,
        bio,
        rating,
        totalRatings,
        points,
        createdAt
      FROM users WHERE id = $1`;
      
      const result = await db.query(query, [decoded.id]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
};

// Test version - fake user for testing (University of Algiers student)
const protectTest = async (req, res, next) => {
  req.user = { 
    id: 1,
    fullName: 'Ahmed Benali',
    email: 'ahmed.benali@univ-alger.dz',
    phoneNumber: '0550123456',
    registrationNumber: '20240001',
    role: 'student_buyer',
    userType: 'student',
    currentRole: 'buyer',
    university: 'University of Algiers',
    faculty: 'Computer Science',
    academicYear: 'L3',
    fieldOfStudy: 'Software Engineering',
    department: null,
    position: null,
    avatar: '/default-avatar.png',
    bio: 'Computer Science student at University of Algiers',
    rating: 5.0,
    totalRatings: 12,
    points: 250,
    createdAt: new Date()
  };
  next();
};

module.exports = { protect, protectTest };