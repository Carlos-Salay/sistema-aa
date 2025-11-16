// backend/routes/sesiones.routes.js
const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// RUTA PARA OBTENER TODAS LAS SESIONES
router.get('/', async (req, res) => {
  try {
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

// RUTA PARA OBTENER UNA SESIÓN POR SU ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM sesiones WHERE id_sesion = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sesión no encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA CREAR UNA NUEVA SESIÓN (CON NOTIFICACIONES Y CORRECCIÓN DE ZONA HORARIA)
router.post('/', async (req, res) => {
  const { tema, fecha_hora, descripcion, id_ubicacion } = req.body;

  if (!tema || !fecha_hora) {
    return res.status(400).json({ message: 'El tema y la fecha son obligatorios.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insertamos la nueva sesión
    // === ESTA ES LA LÍNEA CORREGIDA ===
    // Le decimos a PostgreSQL: "Toma esta hora ($2) e interprétala como si estuviera en 'America/Guatemala',
    // luego guárdala correctamente en UTC (timestamp with time zone)".
    const result = await client.query(
      'INSERT INTO sesiones (tema, fecha_hora, descripcion, id_ubicacion, id_estado) VALUES ($1, $2 AT TIME ZONE \'America/Guatemala\', $3, $4, 1) RETURNING *',
      [tema, fecha_hora, descripcion || null, id_ubicacion || null]
    );
    const nuevaSesion = result.rows[0];
    
    // 2. Obtenemos la lista de todos los miembros activos
    const miembrosActivosRes = await client.query('SELECT id_miembro FROM miembros WHERE id_estado = 1');
    const miembrosActivos = miembrosActivosRes.rows;

    if (miembrosActivos.length > 0) {
        // 3. Preparamos el mensaje de notificación
        // Usamos la fecha que la BD guardó (nuevaSesion.fecha_hora) que ya es un objeto Date correcto
        const fechaFormateada = new Date(nuevaSesion.fecha_hora).toLocaleDateString('es-GT', { 
            day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Guatemala' 
        });
        const mensaje = `Nueva sesión "${tema}" programada para el ${fechaFormateada}.`;
        const enlace = '/calendario';

        // 4. Creamos una notificación para cada miembro activo
        for (const miembro of miembrosActivos) {
            await client.query(
                'INSERT INTO notificaciones (id_miembro_destino, mensaje, enlace) VALUES ($1, $2, $3)',
                [miembro.id_miembro, mensaje, enlace]
            );
        }
    }
    
    await client.query('COMMIT');
    res.status(201).json(nuevaSesion);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear la sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// RUTA PARA ELIMINAR UNA SESIÓN
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sesiones WHERE id_sesion = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Sesión no encontrada.' });
    }
    
    res.json({ message: 'Sesión eliminada con éxito.' });
  } catch (error) {
    console.error('Error al eliminar la sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;