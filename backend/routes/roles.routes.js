const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// RUTA PARA OBTENER TODOS LOS ROLES
// GET /api/roles
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id_rol');
    res.json(result.rows);
  } catch (error)
   {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;