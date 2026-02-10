const express = require('express');
const { testConnection } = require('./db'); 

const app = express();

const PORT = 3000;

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); 
    res.send(`PostgreSQL time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
