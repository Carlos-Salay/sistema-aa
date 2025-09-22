// backend/routes/sesiones.routes.js
const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// RUTA PARA OBTENER TODAS LAS SESIONES (AHORA DEVUELVE TODOS LOS DATOS)
router.get('/', async (req, res) => {
  try {
    // Unimos la tabla de sesiones con la de ubicaciones para obtener el nombre
    const query = `
      SELECT s.id_sesion, s.tema, s.descripcion, u.nombre AS ubicacion, s.fecha_hora 
      FROM sesiones s
      LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
      ORDER BY s.fecha_hora DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA MODIFICADA PARA CREAR UNA NUEVA SESIÓN
router.post('/', async (req, res) => {
  // Ahora también recibimos 'descripcion' y 'id_ubicacion'
  const { tema, fecha_hora, descripcion, id_ubicacion } = req.body;

  if (!tema || !fecha_hora) {
    return res.status(400).json({ message: 'El tema y la fecha son obligatorios.' });
  }

  try {
    // La consulta INSERT ahora incluye los nuevos campos
    const result = await pool.query(
      'INSERT INTO sesiones (tema, fecha_hora, descripcion, id_ubicacion, id_estado) VALUES ($1, $2, $3, $4, 1) RETURNING *',
      [tema, fecha_hora, descripcion || null, id_ubicacion || null] // Usamos 'null' si vienen vacíos
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear la sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;