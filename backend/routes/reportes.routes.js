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

// --- NUEVA RUTA PARA CALCULAR ESTADÍSTICAS DE PARTICIPACIÓN ---
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

    // 4. Obtener datos del perfil del miembro (días sobriedad, paso actual)
    const perfilMiembroQuery = pool.query(
      `SELECT 
        m.fecha_sobriedad,
        EXTRACT(DAY FROM (NOW() - m.fecha_sobriedad)) AS dias_sobriedad,
        p_ultimo.paso as paso_actual
       FROM miembros m
       LEFT JOIN (
         SELECT DISTINCT ON (id_miembro) id_miembro, paso
         FROM progreso ORDER BY id_miembro, fecha DESC, id_progreso DESC
       ) p_ultimo ON m.id_miembro = p_ultimo.id_miembro
       WHERE m.id_miembro = $1`,
       [id_miembro]
    );

    // 5. Obtener el nombre del padrino del miembro
    const padrinoQuery = pool.query(
      `SELECT p.alias as nombre_padrino FROM apoyo a
       JOIN miembros p ON a.id_padrino = p.id_miembro
       WHERE a.id_ahijado = $1 AND a.fecha_fin IS NULL`,
       [id_miembro]
    );

    // 6. Contar cuántos ahijados tiene este miembro
    const ahijadosQuery = pool.query(
      `SELECT COUNT(*) as total_ahijados FROM apoyo
       WHERE id_padrino = $1 AND fecha_fin IS NULL`,
       [id_miembro]
    );

    const [totalRes, asistenciasRes, ultimaRes, perfilRes, padrinoRes, ahijadosRes] = await Promise.all([
      totalSesionesQuery,
      asistenciasMiembroQuery,
      ultimaAsistenciaQuery,
      perfilMiembroQuery,
      padrinoQuery,
      ahijadosQuery
    ]);

    const totalSesiones = parseInt(totalRes.rows[0].count, 10);
    const asistenciasMiembro = parseInt(asistenciasRes.rows[0].count, 10);
    
    // Calculamos el porcentaje, evitando división por cero
    const porcentaje = totalSesiones > 0 ? (asistenciasMiembro / totalSesiones) * 100 : 0;

    const perfil = perfilRes.rows[0] || {};
    const padrino = padrinoRes.rows[0] || {};
    const ahijados = ahijadosRes.rows[0] || {};

    res.json({
      total_sesiones_trimestre: totalSesiones,
      asistencias_trimestre: asistenciasMiembro,
      porcentaje_asistencia: Math.round(porcentaje),
      ultima_asistencia: ultimaRes.rows[0].ultima_fecha,
      dias_sobriedad: perfil.dias_sobriedad ? Math.floor(perfil.dias_sobriedad) : 0,
      paso_actual: perfil.paso_actual || 1,
      fecha_recaida_o_inicio: perfil.fecha_sobriedad, // Esta fecha es el inicio de la sobriedad o la última recaída
      nombre_padrino: padrino.nombre_padrino || 'No asignado',
      total_ahijados: parseInt(ahijados.total_ahijados, 10) || 0
    });

  } catch (error) {
    console.error('Error al calcular la evaluación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;