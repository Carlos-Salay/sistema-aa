// backend/routes/reportesGlobales.routes.js
const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    // 1. Reporte de Progreso de Pasos (sin cambios)
    const progresoQuery = pool.query(`
        SELECT p.paso, COUNT(p.id_miembro) AS total_miembros FROM (
            SELECT id_miembro, MAX(paso) as paso FROM progreso GROUP BY id_miembro
        ) AS p GROUP BY p.paso ORDER BY p.paso;
    `);

    // 2. Reporte de Permanencia (sin cambios)
    const permanenciaQuery = pool.query(`
        WITH meses AS (
            SELECT generate_series(date_trunc('month', NOW() - interval '5 months'), date_trunc('month', NOW()), '1 month'::interval) AS mes
        )
        SELECT 
            TO_CHAR(m.mes, 'Mon YYYY') AS mes_nombre,
            (SELECT COUNT(*) FROM miembros WHERE date_trunc('month', fecha_ingreso) = m.mes) AS nuevos,
            (SELECT COUNT(*) FROM miembros WHERE id_estado = 2 AND date_trunc('month', fecha_modificacion) = m.mes) AS inactivos
        FROM meses m;
    `);

    // 3. Reporte de Asistencia General (sin cambios)
    const asistenciaQuery = pool.query(`
        SELECT AVG(asistentes_por_sesion) AS promedio_asistencia FROM (
            SELECT id_sesion, COUNT(id_miembro) AS asistentes_por_sesion FROM asistencia GROUP BY id_sesion
        ) AS conteo_sesiones;
    `);

    // --- NUEVAS CONSULTAS ---
    const activosQuery = pool.query("SELECT COUNT(*) FROM miembros WHERE id_estado = 1");
    const inactivosQuery = pool.query("SELECT COUNT(*) FROM miembros WHERE id_estado = 2");
    const sesionesQuery = pool.query("SELECT COUNT(*) FROM sesiones WHERE fecha_hora < NOW()");
    
    // Ejecutar todas las consultas en paralelo
    const [
      progresoResult, permanenciaResult, asistenciaResult,
      activosResult, inactivosResult, sesionesResult
    ] = await Promise.all([
      progresoQuery, permanenciaQuery, asistenciaQuery,
      activosQuery, inactivosQuery, sesionesQuery
    ]);

    // Formatear los resultados
    const reportes = {
      progreso: progresoResult.rows,
      permanencia: permanenciaResult.rows,
      asistencia: {
        promedio: asistenciaResult.rows[0].promedio_asistencia ? parseFloat(asistenciaResult.rows[0].promedio_asistencia).toFixed(1) : '0.0',
        totalSesiones: parseInt(sesionesResult.rows[0].count, 10)
      },
      miembros: {
        activos: parseInt(activosResult.rows[0].count, 10),
        inactivos: parseInt(inactivosResult.rows[0].count, 10)
      }
    };

    res.json(reportes);

  } catch (error) {
    console.error('Error al obtener reportes globales:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;