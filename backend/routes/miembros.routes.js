const { Router } = require('express');
const { pool } = require('../db');
const bcrypt = require('bcryptjs');

const router = Router();

// --- RUTA PARA OBTENER MIEMBROS (ACTIVOS O INACTIVOS) ---
router.get('/', async (req, res) => {
  const { estado } = req.query;
  
  let estadoFilter = '';
  if (estado === 'activos') {
    estadoFilter = 'WHERE m.id_estado = 1';
  } else if (estado === 'inactivos') {
    estadoFilter = 'WHERE m.id_estado = 2';
  }
  try {
    const query = `
      SELECT 
        m.id_miembro, m.codigo_confidencial, m.alias, 
        m.fecha_ingreso, m.fecha_sobriedad, m.id_estado,
        a.id_padrino, padrino.alias as nombre_padrino,
        EXTRACT(DAY FROM (NOW() - m.fecha_sobriedad)) AS dias_sobriedad,
        p_ultimo.paso as paso_actual
      FROM public.miembros m
      LEFT JOIN public.apoyo a ON m.id_miembro = a.id_ahijado AND a.fecha_fin IS NULL
      LEFT JOIN public.miembros padrino ON a.id_padrino = padrino.id_miembro
      LEFT JOIN (
        SELECT DISTINCT ON (id_miembro) id_miembro, paso
        FROM public.progreso ORDER BY id_miembro, fecha DESC, id_progreso DESC
      ) p_ultimo ON m.id_miembro = p_ultimo.id_miembro
      ${estadoFilter} ORDER BY m.alias ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA OBTENER UN MIEMBRO ESPECÍFICO POR SU ID ---
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        m.id_miembro, m.codigo_confidencial, m.alias, 
        m.fecha_ingreso, m.fecha_sobriedad, m.id_estado,
        padrino.alias as nombre_padrino,
        EXTRACT(DAY FROM (NOW() - m.fecha_sobriedad)) AS dias_sobriedad,
        p_ultimo.paso as paso_actual,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id_miembro', ahijado.id_miembro, 
              'alias', ahijado.alias,
              'codigo_confidencial', ahijado.codigo_confidencial
            )
          ), '[]'::json)
          FROM public.apoyo a_ahijados
          JOIN public.miembros ahijado ON a_ahijados.id_ahijado = ahijado.id_miembro
          WHERE a_ahijados.id_padrino = m.id_miembro AND a_ahijados.fecha_fin IS NULL
        ) as ahijados
      FROM public.miembros m
      LEFT JOIN public.apoyo a ON m.id_miembro = a.id_ahijado AND a.fecha_fin IS NULL
      LEFT JOIN public.miembros padrino ON a.id_padrino = padrino.id_miembro
      LEFT JOIN (
        SELECT DISTINCT ON (id_miembro) id_miembro, paso
        FROM public.progreso ORDER BY id_miembro, fecha DESC, id_progreso DESC
      ) p_ultimo ON m.id_miembro = p_ultimo.id_miembro
      WHERE m.id_miembro = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Miembro no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el miembro:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// --- RUTA PARA CREAR UN NUEVO MIEMBRO (POST) ---
router.post('/', async (req, res) => {
  const { alias, fecha_ingreso, fecha_sobriedad, password } = req.body;
  if (!alias || !fecha_ingreso || !fecha_sobriedad || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const insertResult = await client.query(
      `INSERT INTO miembros (codigo_confidencial, alias, fecha_ingreso, fecha_sobriedad, id_estado, password_hash) 
       VALUES ('PENDIENTE', $1, $2, $3, 1, $4) RETURNING id_miembro`,
      [alias, fecha_ingreso, fecha_sobriedad, password_hash]
    );
    const nuevoId = insertResult.rows[0].id_miembro;
    const codigoGenerado = `AA${nuevoId}`;
    const updateResult = await client.query(
      `UPDATE miembros SET codigo_confidencial = $1 
       WHERE id_miembro = $2 RETURNING *`,
      [codigoGenerado, nuevoId]
    );
    await client.query('INSERT INTO public.progreso (id_miembro, paso, fecha) VALUES ($1, 1, CURRENT_DATE)', [nuevoId]);
    await client.query('COMMIT');
    const miembroCreado = updateResult.rows[0];
    delete miembroCreado.password_hash;
    res.status(201).json(miembroCreado);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar miembro:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// --- RUTA PARA ACTUALIZAR EL PASO DE UN MIEMBRO ---
router.put('/:id/paso', async (req, res) => {
  const { id } = req.params;
  const { paso_actual } = req.body;
  if (!paso_actual) return res.status(400).json({ message: 'El campo paso_actual es obligatorio.' });
  try {
    // Insertamos el nuevo progreso
    await pool.query('INSERT INTO public.progreso (id_miembro, paso, fecha) VALUES ($1, $2, CURRENT_DATE)', [id, paso_actual]);
    
    // Devolvemos el miembro actualizado para que el frontend se sincronice
    const updatedMemberResult = await pool.query('SELECT * FROM miembros WHERE id_miembro = $1', [id]);
    
    res.json(updatedMemberResult.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el paso:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA ASIGNAR PADRINO ---
router.put('/:id/padrino', async (req, res) => {
  const { id: ahijadoId } = req.params;
  const { idPadrino } = req.body;
  try {
    await pool.query("UPDATE apoyo SET fecha_fin = CURRENT_DATE WHERE id_ahijado = $1 AND fecha_fin IS NULL", [ahijadoId]);
    if (idPadrino && idPadrino !== '') {
        await pool.query("INSERT INTO apoyo (id_padrino, id_ahijado, fecha_inicio, id_estado) VALUES ($1, $2, CURRENT_DATE, 1)", [idPadrino, ahijadoId]);
    }
    res.json({ message: 'Padrino actualizado con éxito.' });
  } catch (error) {
    console.error('Error al asignar padrino:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA NUEVA PARA CAMBIAR CONTRASEÑA DE UN MIEMBRO ---
router.put('/:id/cambiar-password', async (req, res) => {
  const { id: miembroId } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'La nueva contraseña es obligatoria.' });
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    await pool.query('UPDATE miembros SET password_hash = $1 WHERE id_miembro = $2', [password_hash, miembroId]);
    res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA NUEVA PARA REGISTRAR RECAÍDA ---
router.put('/:id/recaida', async (req, res) => {
  const { id: miembroId } = req.params;
  try {
    await pool.query('UPDATE miembros SET fecha_sobriedad = CURRENT_DATE WHERE id_miembro = $1', [miembroId]);
    res.json({ message: 'Fecha de sobriedad reiniciada.' });
  } catch (error) {
    console.error('Error al registrar recaída:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA NUEVA PARA CAMBIAR ESTADO (ACTIVAR/DESACTIVAR) ---
router.put('/:id/estado', async (req, res) => {
  const { id: miembroId } = req.params;
  const { id_estado } = req.body;
  if (!id_estado) return res.status(400).json({ message: 'El nuevo estado es obligatorio.' });
  try {
    await pool.query('UPDATE miembros SET id_estado = $1 WHERE id_miembro = $2', [id_estado, miembroId]);
    res.json({ message: 'Estado del miembro actualizado con éxito.' });
  } catch (error) {
    console.error('Error al cambiar estado del miembro:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;