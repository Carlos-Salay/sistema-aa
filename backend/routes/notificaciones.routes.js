// backend/routes/notificaciones.routes.js

const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// RUTA PARA OBTENER TODAS LAS NOTIFICACIONES NO LEÍDAS DE UN MIEMBRO
router.get('/:id_miembro', async (req, res) => {
  const { id_miembro } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM notificaciones WHERE id_miembro_destino = $1 AND leido = false ORDER BY fecha_creacion DESC',
      [id_miembro]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA MARCAR UNA NOTIFICACIÓN COMO LEÍDA
router.put('/:id_notificacion/leido', async (req, res) => {
  const { id_notificacion } = req.params;
  try {
    await pool.query('UPDATE notificaciones SET leido = true WHERE id_notificacion = $1', [id_notificacion]);
    res.json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA MARCAR TODAS LAS NOTIFICACIONES DE UN USUARIO COMO LEÍDAS
router.put('/marcar-todas-leidas/:id_miembro', async (req, res) => {
    const { id_miembro } = req.params;
    try {
        await pool.query(
            'UPDATE notificaciones SET leido = true WHERE id_miembro_destino = $1',
            [id_miembro]
        );
        res.json({ message: 'Todas las notificaciones marcadas como leídas.' });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


module.exports = router;