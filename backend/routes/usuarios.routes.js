// backend/routes/usuarios.routes.js
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = Router();

router.post('/', async (req, res) => {
  const { nombre_completo, correo_electronico, password, id_rol } = req.body;

  if (!nombre_completo || !correo_electronico || !password || !id_rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // --- CORRECCIÓN AQUÍ ---
    // Añadimos la columna 'id_estado' y le pasamos el valor '1'
    const result = await pool.query(
      'INSERT INTO usuarios (nombre_completo, correo_electronico, password_hash, id_rol, id_estado) VALUES ($1, $2, $3, $4, 1) RETURNING id_usuario, nombre_completo, correo_electronico, id_rol',
      [nombre_completo, correo_electronico, password_hash, id_rol]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;