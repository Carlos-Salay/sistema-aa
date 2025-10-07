const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = Router();

// OBTENER USUARIOS (sin cambios)
router.get('/', async (req, res) => {
  const { estado } = req.query;
  let estadoFilter = estado === 'activos' ? 'WHERE u.id_estado = 1' : estado === 'inactivos' ? 'WHERE u.id_estado = 2' : '';

  try {
    const result = await pool.query(`
      SELECT u.id_usuario, u.alias, u.codigo_usuario, u.id_estado, r.nombre as rol
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id_rol
      ${estadoFilter}
      ORDER BY u.alias ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// CREAR USUARIO (modificado para no usar correo)
router.post('/', async (req, res) => {
  const { alias, password, id_rol } = req.body;

  if (!alias || !password || !id_rol) {
    return res.status(400).json({ message: 'Alias, contraseña y rol son requeridos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const insertResult = await client.query(
      'INSERT INTO usuarios (alias, password_hash, id_rol, id_estado) VALUES ($1, $2, $3, 1) RETURNING id_usuario',
      [alias, password_hash, id_rol]
    );

    const nuevoId = insertResult.rows[0].id_usuario;
    const codigoGenerado = `UAA${nuevoId}`;

    const updateResult = await client.query(
      'UPDATE usuarios SET codigo_usuario = $1 WHERE id_usuario = $2 RETURNING *',
      [codigoGenerado, nuevoId]
    );

    await client.query('COMMIT');
    const usuarioCreado = updateResult.rows[0];
    delete usuarioCreado.password_hash;
    res.status(201).json(usuarioCreado);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// CAMBIAR CONTRASEÑA (sin cambios)
router.put('/:id/cambiar-password', async (req, res) => {
  const { id: usuarioId } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'La nueva contraseña es obligatoria.' });
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [password_hash, usuarioId]);
    res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// CAMBIAR ESTADO (sin cambios)
router.put('/:id/estado', async (req, res) => {
  const { id: usuarioId } = req.params;
  const { id_estado } = req.body;
  if (!id_estado) return res.status(400).json({ message: 'El nuevo estado es obligatorio.' });
  try {
    await pool.query('UPDATE usuarios SET id_estado = $1, fecha_modificacion = NOW() WHERE id_usuario = $2', [id_estado, usuarioId]);
    res.json({ message: 'Estado del usuario actualizado con éxito.' });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;