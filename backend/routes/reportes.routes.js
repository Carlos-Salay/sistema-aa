// backend/routes/reportes.routes.js
const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// RUTA PARA OBTENER EL HISTORIAL DE ASISTENCIA DE UN MIEMBRO
router.get('/asistencia/:id_miembro', async (req, res) => {
  const { id_miembro } = req.params;
  try {
    const query = `
      SELECT s.id_sesion, s.tema, s.fecha_hora
      FROM public.asistencia a
      JOIN public.sesiones s ON a.id_sesion = s.id_sesion
      WHERE a.id_miembro = $1
      ORDER BY s.fecha_hora DESC;
    `;
    const result = await pool.query(query, [id_miembro]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener el historial de asistencia:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA CALCULAR ESTADÍSTICAS DE PARTICIPACIÓN ---
router.get('/evaluacion/:id_miembro', async (req, res) => {
  const { id_miembro } = req.params;
  try {
    // 1. Contar el total de sesiones en los últimos 90 días
    const totalSesionesQuery = pool.query(
      "SELECT COUNT(*) FROM sesiones WHERE fecha_hora >= NOW() - INTERVAL '90 days'"
    );

    // 2. Contar a cuántas de esas sesiones asistió el miembro
    const asistenciasMiembroQuery = pool.query(
      `SELECT COUNT(a.id_asistencia) FROM asistencia a
       JOIN sesiones s ON a.id_sesion = s.id_sesion
       WHERE a.id_miembro = $1 AND s.fecha_hora >= NOW() - INTERVAL '90 days'`,
      [id_miembro]
    );

    // 3. Encontrar la fecha de la última asistencia
    const ultimaAsistenciaQuery = pool.query(
      `SELECT MAX(s.fecha_hora) as ultima_fecha FROM asistencia a
       JOIN sesiones s ON a.id_sesion = s.id_sesion
       WHERE a.id_miembro = $1`,
       [id_miembro]
    );

    const [totalRes, asistenciasRes, ultimaRes] = await Promise.all([
      totalSesionesQuery,
      asistenciasMiembroQuery,
      ultimaAsistenciaQuery
    ]);

    const totalSesiones = parseInt(totalRes.rows[0].count, 10);
    const asistenciasMiembro = parseInt(asistenciasRes.rows[0].count, 10);
    
    // Calculamos el porcentaje, evitando división por cero
    const porcentaje = totalSesiones > 0 ? (asistenciasMiembro / totalSesiones) * 100 : 0;

    res.json({
      total_sesiones_trimestre: totalSesiones,
      asistencias_trimestre: asistenciasMiembro,
      porcentaje_asistencia: Math.round(porcentaje),
      ultima_asistencia: ultimaRes.rows[0].ultima_fecha
    });

  } catch (error) {
    console.error('Error al calcular la evaluación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;