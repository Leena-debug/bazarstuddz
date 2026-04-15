const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize for PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'bazarstuddz_db', 
  process.env.DB_USER || 'postgres', 
  process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres', // 👈 This is the critical change
    port: process.env.DB_PORT || 5432, // PostgreSQL default port in Laragon
    logging: false, // Prevents SQL clutter in your console
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Database Connected Successfully via Sequelize!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

testConnection();

module.exports = sequelize;