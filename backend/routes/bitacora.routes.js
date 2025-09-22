// backend/routes/bitacora.routes.js

const { Router } = require('express');
const { pool } = require('../db');
// crypto no es necesario si no estamos cifrando aún
// const crypto = require('crypto'); 

const router = Router();

// RUTA PARA OBTENER TODAS LAS ENTRADAS DE LA BITÁCORA DE UN MIEMBRO
router.get('/:id_miembro', async (req, res) => {
  const { id_miembro } = req.params;
  try {
    // CORRECCIÓN: Usamos 'reflexion' en lugar de 'reflexion_cifrada'
    const result = await pool.query(
      'SELECT id_bitacora, reflexion, fecha_registro FROM bitacora WHERE id_miembro = $1 ORDER BY fecha_registro DESC',
      [id_miembro]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener entradas de la bitácora:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA CREAR UNA NUEVA ENTRADA EN LA BITÁCORA
router.post('/', async (req, res) => {
  const { id_miembro, reflexion } = req.body;

  if (!id_miembro || !reflexion) {
    return res.status(400).json({ message: 'Se requiere un id_miembro y una reflexión.' });
  }

  try {
    // CORRECCIÓN: Guardamos en la columna 'reflexion'
    const result = await pool.query(
      'INSERT INTO bitacora (id_miembro, reflexion) VALUES ($1, $2) RETURNING *',
      [id_miembro, reflexion] // Usamos la reflexión directamente
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear entrada en la bitácora:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;