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

// backend/routes/reportes.routes.js

// --- RUTA PARA CALCULAR ESTADÍSTICAS DE PARTICIPACIÓN (CORREGIDA) ---
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
    
    // 4. OBTENER DATOS ADICIONALES DEL MIEMBRO (¡NUEVO!)
    const miembroInfoQuery = pool.query(
      `SELECT 
        EXTRACT(DAY FROM (NOW() - m.fecha_sobriedad)) AS dias_sobriedad,
        p_ultimo.paso as paso_actual,
        padrino.alias as nombre_padrino
      FROM public.miembros m
      LEFT JOIN public.apoyo a ON m.id_miembro = a.id_ahijado AND a.fecha_fin IS NULL
      LEFT JOIN public.miembros padrino ON a.id_padrino = padrino.id_miembro
      LEFT JOIN (
        SELECT DISTINCT ON (id_miembro) id_miembro, paso
        FROM public.progreso ORDER BY id_miembro, fecha DESC, id_progreso DESC
      ) p_ultimo ON m.id_miembro = p_ultimo.id_miembro
      WHERE m.id_miembro = $1`,
      [id_miembro]
    );

    const [totalRes, asistenciasRes, ultimaRes, miembroInfoRes] = await Promise.all([
      totalSesionesQuery,
      asistenciasMiembroQuery,
      ultimaAsistenciaQuery,
      miembroInfoQuery // Se añade la nueva consulta
    ]);

    const totalSesiones = parseInt(totalRes.rows[0].count, 10);
    const asistenciasMiembro = parseInt(asistenciasRes.rows[0].count, 10);
    const porcentaje = totalSesiones > 0 ? (asistenciasMiembro / totalSesiones) * 100 : 0;
    const miembroInfo = miembroInfoRes.rows[0] || {};

    // SE AÑADEN LOS NUEVOS DATOS A LA RESPUESTA
    res.json({
      total_sesiones_trimestre: totalSesiones,
      asistencias_trimestre: asistenciasMiembro,
      porcentaje_asistencia: Math.round(porcentaje),
      ultima_asistencia: ultimaRes.rows[0].ultima_fecha,
      dias_sobriedad: miembroInfo.dias_sobriedad ? Math.floor(miembroInfo.dias_sobriedad) : 0,
      paso_actual: miembroInfo.paso_actual || 1,
      nombre_padrino: miembroInfo.nombre_padrino || 'No asignado'
    });

  } catch (error) {
    console.error('Error al calcular la evaluación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;