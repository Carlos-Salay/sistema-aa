// backend/routes/asistencia.routes.js

const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// RUTA PARA OBTENER LOS IDs DE MIEMBROS QUE ASISTIERON A UNA SESIÓN
// GET /api/asistencia/:id_sesion
router.get('/:id_sesion', async (req, res) => {
  const { id_sesion } = req.params;
  try {
    const result = await pool.query(
      'SELECT id_miembro FROM asistencia WHERE id_sesion = $1',
      [id_sesion]
    );
    // Devolvemos un array simple de IDs, ej: [1, 5, 12]
    const asistentesIds = result.rows.map(row => row.id_miembro);
    res.json(asistentesIds);
  } catch (error) {
    console.error('Error al obtener asistencia:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA GUARDAR LA ASISTENCIA DE UNA SESIÓN
// POST /api/asistencia
router.post('/', async (req, res) => {
  const { id_sesion, miembros } = req.body; // miembros será un array de IDs, ej: [1, 5, 12]

  if (!id_sesion || !Array.isArray(miembros)) {
    return res.status(400).json({ message: 'Se requiere un id_sesion y un array de miembros.' });
  }

  // Usamos un cliente para manejar la transacción
  const client = await pool.connect();

  try {
    // Iniciamos una transacción para asegurar que todas las operaciones se completen o ninguna
    await client.query('BEGIN');

    // 1. Primero, borramos toda la asistencia previa para esta sesión.
    // Esto simplifica la lógica para añadir o quitar asistentes.
    await client.query('DELETE FROM asistencia WHERE id_sesion = $1', [id_sesion]);

    // 2. Si la lista de miembros no está vacía, insertamos los nuevos registros
    if (miembros.length > 0) {
      // Creamos una consulta SQL para insertar múltiples filas
      const values = miembros.map((id_miembro, index) => `($${index * 2 + 1}, $${index * 2 + 2}, 1)`).join(',');
      const params = miembros.flatMap(id_miembro => [id_sesion, id_miembro]);
      const query = `INSERT INTO asistencia (id_sesion, id_miembro, id_estado) VALUES ${values}`;
      
      await client.query(query, params);
    }

    // 3. Si todo salió bien, confirmamos los cambios en la base de datos
    await client.query('COMMIT');
    res.status(201).json({ message: 'Asistencia guardada con éxito.' });

  } catch (error) {
    // 4. Si algo falla, revertimos todos los cambios
    await client.query('ROLLBACK');
    console.error('Error al guardar la asistencia:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    // Liberamos el cliente para que pueda ser usado por otras peticiones
    client.release();
  }
});

module.exports = router;