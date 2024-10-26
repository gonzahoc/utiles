const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: ['https://stipa.org.ar', 'https://www.stipa.org.ar'],
  credentials: true
}));

app.use(express.json());

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: '190.228.29.65',
  user: 'martuns',
  password: 'q7AlNMg54lH7',
  database: 'stipa_osipa_bd_2019'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Ruta para el inicio de sesión
app.post('/api/login', (req, res) => {
  const { mail, pass } = req.body;
  const sql = 'SELECT * FROM sisteUtiles WHERE mail = ? AND pass = ? AND confirmed = true';

  db.query(sql, [mail, pass], (err, results) => {
    if (err) {
      console.error('Error querying user:', err);
      return res.status(500).json({ error: 'Error logging in user' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password, or email not confirmed' });
    }

    const token = jwt.sign({ id: results[0].id }, 'tu_secreto', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token, user: results[0] });
  });
});

// Iniciar el servidor
app.listen(0, () => {
  console.log('Server running at a dynamic port.');
});