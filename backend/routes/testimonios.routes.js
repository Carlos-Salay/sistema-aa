const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// RUTA GET CORREGIDA Y COMPLETA
router.get('/:id_miembro', async (req, res) => {
  const { id_miembro } = req.params;
  try {
    const query = `
      SELECT 
        t.id_testimonio, t.titulo, t.contenido, t.fecha_publicacion,
        m.id_miembro,
        m.codigo_confidencial as autor,
        (SELECT COUNT(*) FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND tipo_reaccion = 'apoyo') AS apoyos,
        (SELECT COUNT(*) FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND tipo_reaccion = 'inspiracion') AS inspiraciones,
        (SELECT COUNT(*) FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND tipo_reaccion = 'gratitud') AS gratitudes,
        (SELECT tipo_reaccion FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND id_miembro = $1) AS reaccion_usuario
      FROM 
        testimonios t
      JOIN 
        miembros m ON t.id_miembro = m.id_miembro
      ORDER BY 
        t.fecha_publicacion DESC;
    `;
    const result = await pool.query(query, [id_miembro]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener testimonios:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA PUBLICAR UN NUEVO TESTIMONIO
router.post('/', async (req, res) => {
  const { id_miembro, titulo, contenido } = req.body;
  if (!id_miembro || !titulo || !contenido) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO testimonios (id_miembro, titulo, contenido) VALUES ($1, $2, $3) RETURNING *',
      [id_miembro, titulo, contenido]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al publicar testimonio:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// RUTA PARA REACCIONAR
router.post('/:id/reaccionar', async (req, res) => {
  const { id: id_testimonio } = req.params;
  const { id_miembro, tipo_reaccion } = req.body;
  if (!id_miembro || !tipo_reaccion) {
    return res.status(400).json({ message: 'Se requiere id_miembro y tipo_reaccion.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificamos si el usuario ya reaccionó con el MISMO tipo de reacción
    const reaccionExistente = await client.query(
        'SELECT id_reaccion FROM testimonio_reacciones WHERE id_testimonio = $1 AND id_miembro = $2 AND tipo_reaccion = $3',
        [id_testimonio, id_miembro, tipo_reaccion]
    );

    // 2. Borramos cualquier reacción previa del usuario en este post para manejar el cambio de reacción
    await client.query(
      'DELETE FROM testimonio_reacciones WHERE id_testimonio = $1 AND id_miembro = $2',
      [id_testimonio, id_miembro]
    );

    // 3. Si la reacción no existía previamente, la insertamos. Si existía, no hacemos nada (efecto de "quitar" la reacción).
    if (reaccionExistente.rows.length === 0) { // Solo insertamos si NO era la misma reacción
      await client.query(
        'INSERT INTO testimonio_reacciones (id_testimonio, id_miembro, tipo_reaccion) VALUES ($1, $2, $3)',
        [id_testimonio, id_miembro, tipo_reaccion]
      );
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Reacción actualizada.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al reaccionar:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

// RUTA PARA ELIMINAR UN TESTIMONIO
router.delete('/:id', async (req, res) => {
  const { id: id_testimonio } = req.params;
  const { id_miembro, rol } = req.body;

  if (!id_miembro || !rol) {
    return res.status(400).json({ message: 'Se requiere información del usuario para eliminar.' });
  }

  try {
    const testimonioResult = await pool.query('SELECT id_miembro FROM testimonios WHERE id_testimonio = $1', [id_testimonio]);

    if (testimonioResult.rows.length === 0) {
      return res.status(404).json({ message: 'El testimonio no existe.' });
    }

    const autorTestimonio = testimonioResult.rows[0].id_miembro;
    if (autorTestimonio !== id_miembro && rol !== 'Administrador') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta publicación.' });
    }

    // Primero borramos las reacciones asociadas para evitar errores de restricción
    await pool.query('DELETE FROM testimonio_reacciones WHERE id_testimonio = $1', [id_testimonio]);
    // Ahora borramos el testimonio
    await pool.query('DELETE FROM testimonios WHERE id_testimonio = $1', [id_testimonio]);
    res.status(200).json({ message: 'Testimonio eliminado con éxito.' });
  } catch (error) {
    console.error("Error al eliminar testimonio:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;