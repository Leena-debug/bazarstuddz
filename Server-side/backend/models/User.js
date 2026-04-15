const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // This will be your connection file

const User = sequelize.define('User', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    validate: { isEmail: true }
  },
  password: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING, allowNull: false },
  // registrationNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  
  // ROLES
  userType: { 
    type: DataTypes.ENUM('student', 'professor'), 
    defaultValue: 'student' 
  },
  currentRole: { 
    type: DataTypes.ENUM('buyer', 'seller'), 
    defaultValue: 'buyer' 
  },
/*
  // STATS (Stored as JSON for simplicity in SQL)
  sellerStats: {
    type: DataTypes.JSONB,
    defaultValue: { totalListings: 0, totalSales: 0, totalEarnings: 0 }
  },
  points: { type: DataTypes.INTEGER, defaultValue: 100 }
*/
}
, 
{
  timestamps: true // Automatically creates createdAt and updatedAt
}

);

// Helper Method to switch roles
User.prototype.switchRole = async function(newRole) {
  if (!['buyer', 'seller'].includes(newRole)) throw new Error('Invalid role');
  this.currentRole = newRole;
  return await this.save();
};

module.exports = User;