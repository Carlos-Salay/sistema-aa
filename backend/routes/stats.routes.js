const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// RUTA PARA OBTENER LAS ESTADÍSTICAS DEL DASHBOARD
router.get('/dashboard', async (req, res) => {
  try {
    // Consulta 1: Contar todos los miembros activos
    const miembrosActivosQuery = pool.query("SELECT COUNT(*) FROM miembros WHERE id_estado = 1;");

    // Consulta 2: Contar la asistencia de hoy
    const asistenciaHoyQuery = pool.query(
      `SELECT COUNT(DISTINCT id_miembro) FROM asistencia 
       WHERE id_sesion IN (SELECT id_sesion FROM sesiones WHERE DATE(fecha_hora) = CURRENT_DATE);`
    );

    // Consulta 3: Contar los nuevos miembros de esta semana
    const nuevosEstaSemanaQuery = pool.query(
      "SELECT COUNT(*) FROM miembros WHERE fecha_ingreso >= date_trunc('week', CURRENT_DATE);"
    );
    
    // Consulta 4: Encontrar la próxima sesión programada (CORREGIDA)
    const proximaSesionQuery = pool.query(
      `SELECT s.tema, s.fecha_hora, u.nombre AS ubicacion 
       FROM sesiones s
       LEFT JOIN ubicaciones u ON s.id_ubicacion = u.id_ubicacion
       WHERE s.fecha_hora >= NOW() 
       ORDER BY s.fecha_hora ASC 
       LIMIT 1;`
    );

    // Ejecutamos todas las consultas en paralelo
    const [
      miembrosRes,
      asistenciaRes,
      nuevosRes,
      proximaSesionRes
    ] = await Promise.all([
      miembrosActivosQuery,
      asistenciaHoyQuery,
      nuevosEstaSemanaQuery,
      proximaSesionQuery
    ]);

    const stats = {
      miembrosActivos: parseInt(miembrosRes.rows[0].count, 10),
      asistenciaHoy: parseInt(asistenciaRes.rows[0].count, 10),
      nuevosRegistros: parseInt(nuevosRes.rows[0].count, 10),
      proximaSesion: proximaSesionRes.rows[0] || null 
    };

    res.json(stats);

  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// RUTA PARA OBTENER DATOS PARA EL GRÁFICO DE ASISTENCIA MENSUAL
router.get('/asistencia-mensual', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.tema,
        TO_CHAR(s.fecha_hora, 'DD Mon') AS fecha_corta, 
        COUNT(a.id_miembro) AS total_asistentes
      FROM 
        public.sesiones s
      LEFT JOIN 
        public.asistencia a ON s.id_sesion = a.id_sesion
      WHERE 
        s.fecha_hora >= NOW() - INTERVAL '30 days'
      GROUP BY 
        s.id_sesion, s.tema, s.fecha_hora
      ORDER BY 
        s.fecha_hora ASC;
    `;
    const result = await pool.query(query);

    const labels = result.rows.map(row => `${row.fecha_corta}: ${row.tema}`);
    const data = result.rows.map(row => parseInt(row.total_asistentes, 10));

    res.json({ labels, data });
  } catch (error) {
    console.error("Error al obtener datos para el gráfico:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;