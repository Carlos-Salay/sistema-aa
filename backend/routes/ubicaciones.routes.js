const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ubicaciones ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ubicaciones.' });
  }
});

module.exports = router;