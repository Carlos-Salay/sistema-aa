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

router.post('/', async (req, res) => {
  const { nombre, direccion } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: 'El nombre de la ubicación es obligatorio.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO ubicaciones (nombre, direccion) VALUES ($1, $2) RETURNING *',
      [nombre, direccion || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Manejar error de duplicado
    if (error.code === '23505') {
        return res.status(409).json({ message: 'Ya existe una ubicación con ese nombre.' });
    }
    console.error('Error al crear la ubicación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;