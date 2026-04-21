const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bazarstuddz_db',
  port: process.env.DB_PORT || 5432,
  max: 20,                    // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout for connection attempts
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL Database connection failed:', err.message);
    return;
  }
  console.log('✅ PostgreSQL Database Connected Successfully!');
  release(); // Release the client back to the pool
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

module.exports = pool;