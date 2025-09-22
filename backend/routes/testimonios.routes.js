const { Router } = require('express');
const { pool } = require('../db');
const router = Router();

// RUTA PARA OBTENER TODOS LOS TESTIMONIOS (INCLUYE REACCIONES Y ID DE AUTOR)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id_testimonio, t.titulo, t.contenido, t.fecha_publicacion,
        m.id_miembro, -- Importante para saber quién es el autor
        m.codigo_confidencial as autor,
        (SELECT COUNT(*) FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND tipo_reaccion = 'apoyo') AS apoyos,
        (SELECT COUNT(*) FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND tipo_reaccion = 'inspiracion') AS inspiraciones,
        (SELECT COUNT(*) FROM testimonio_reacciones WHERE id_testimonio = t.id_testimonio AND tipo_reaccion = 'gratitud') AS gratitudes
      FROM 
        testimonios t
      JOIN 
        miembros m ON t.id_miembro = m.id_miembro
      ORDER BY 
        t.fecha_publicacion DESC;
    `;
    const result = await pool.query(query);
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
    const reaccionExistente = await client.query(
      'SELECT id_reaccion FROM testimonio_reacciones WHERE id_testimonio = $1 AND id_miembro = $2 AND tipo_reaccion = $3',
      [id_testimonio, id_miembro, tipo_reaccion]
    );
    await client.query(
      'DELETE FROM testimonio_reacciones WHERE id_testimonio = $1 AND id_miembro = $2',
      [id_testimonio, id_miembro]
    );
    if (reaccionExistente.rows.length === 0) {
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

// --- RUTA NUEVA PARA ELIMINAR UN TESTIMONIO ---
router.delete('/:id', async (req, res) => {
  const { id: id_testimonio } = req.params;
  // En una app real, aquí verificaríamos que el 'req.user.id' sea igual al autor del post
  try {
    await pool.query('DELETE FROM testimonios WHERE id_testimonio = $1', [id_testimonio]);
    res.status(200).json({ message: 'Testimonio eliminado con éxito.' });
  } catch (error) {
    console.error("Error al eliminar testimonio:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;