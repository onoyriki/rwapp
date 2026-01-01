
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sim_rw',
  password: 'PASSWORD_POSTGRES_ANDA', 
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

app.get('/residents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM residents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/residents', async (req, res) => {
  const { nik, no_kk, name, rt_number, address, gender, birth_place, birth_date, occupation, family_relationship, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO residents (nik, no_kk, name, rt_number, address, gender, birth_place, birth_date, occupation, family_relationship, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [nik, no_kk, name, rt_number, address, gender, birth_place, birth_date, occupation, family_relationship, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/residents/:id', async (req, res) => {
  const { id } = req.params;
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  
  try {
    const result = await pool.query(
      `UPDATE residents SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/residents/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM residents WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/google', async (req, res) => {
  const { email, name, picture } = req.body;
  try {
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      const newUser = await pool.query(
        'INSERT INTO users (email, name, avatar, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [email, name, picture, 'ADMIN_RT', 'PENDING']
      );
      res.json(newUser.rows[0]);
    } else {
      const updatedUser = await pool.query(
        'UPDATE users SET avatar = $1, name = $2 WHERE email = $3 RETURNING *',
        [picture, name, email]
      );
      res.json(updatedUser.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { status, role, rtNumber } = req.body;
  try {
    await pool.query(
      'UPDATE users SET status = $1, role = $2, rt_number = $3 WHERE id = $4',
      [status, role, rtNumber, id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend SIM-RW berjalan di http://localhost:${port}`);
});
