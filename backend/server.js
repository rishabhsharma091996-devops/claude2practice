const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true }
};

function calculateScore(name1, name2) {
  const combined = (name1 + name2).toLowerCase().replace(/[^a-z]/g, '');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) % 101;
  }
  return Math.abs(hash);
}

app.post('/api/calculate', async (req, res) => {
  try {
    const { name1, name2 } = req.body;
    if (!name1 || !name2) {
      return res.status(400).json({ error: 'Both names are required' });
    }
    const score = calculateScore(name1, name2);

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('name1', sql.NVarChar, name1)
      .input('name2', sql.NVarChar, name2)
      .input('score', sql.Int, score)
      .query('INSERT INTO love_scores (name1, name2, score) VALUES (@name1, @name2, @score)');

    res.json({ name1, name2, score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
