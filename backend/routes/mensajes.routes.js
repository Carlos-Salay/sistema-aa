const { Router } = require('express');
const { pool } = require('../db');
const crypto = require('crypto');
const config = require('../config');

const router = Router();

// --- Configuración de Cifrado ---
const ENCRYPTION_KEY = config.ENCRYPTION_KEY; 
const IV_LENGTH = 16; 

function encrypt(text) {
  // === INICIO DEL CÓDIGO DE DIAGNÓSTICO ===
  // Estas líneas nos mostrarán en la terminal qué clave se está usando realmente.
  console.log('--- INICIANDO CIFRADO ---');
  console.log('CLAVE DE CIFRADO RECIBIDA:', ENCRYPTION_KEY);
  console.log('LONGITUD DE LA CLAVE:', ENCRYPTION_KEY.length);
  // === FIN DEL CÓDIGO DE DIAGNÓSTICO ===

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Error al descifrar:", error);
    return "Mensaje no se pudo descifrar.";
  }
}

// --- RUTA: OBTENER LISTA DE CONVERSACIONES DE UN MIEMBRO ---
router.get('/conversaciones/:id_miembro', async (req, res) => {
  const { id_miembro } = req.params;
  try {
    const query = `
      SELECT DISTINCT p.id_miembro, p.alias, p.codigo_confidencial
      FROM public.apoyo a
      JOIN public.miembros p ON 
        (a.id_padrino = p.id_miembro OR a.id_ahijado = p.id_miembro) AND p.id_miembro != $1
      WHERE 
        (a.id_padrino = $1 OR a.id_ahijado = $1) AND a.fecha_fin IS NULL;
    `;
    const result = await pool.query(query, [id_miembro]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener la lista de conversaciones:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA OBTENER UNA CONVERSACIÓN ESPECÍFICA ---
router.get('/:id_miembro1/:id_miembro2', async (req, res) => {
  const { id_miembro1, id_miembro2 } = req.params;
  try {
    const result = await pool.query(
      `SELECT id_mensaje, id_remitente, mensaje_cifrado, fecha_envio, leido 
       FROM mensajes 
       WHERE (id_remitente = $1 AND id_destinatario = $2) 
          OR (id_remitente = $2 AND id_destinatario = $1)
       ORDER BY fecha_envio ASC`,
      [id_miembro1, id_miembro2]
    );
    const conversacion = result.rows.map(msg => ({
      ...msg,
      mensaje: decrypt(msg.mensaje_cifrado)
    }));
    res.json(conversacion);
  } catch (error) {
    console.error('Error al obtener la conversación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// --- RUTA PARA ENVIAR UN MENSAJE ---
router.post('/', async (req, res) => {
  const { id_remitente, id_destinatario, mensaje } = req.body;
  if (!id_remitente || !id_destinatario || !mensaje) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  try {
    const mensaje_cifrado = encrypt(mensaje);
    const result = await pool.query(
      'INSERT INTO mensajes (id_remitente, id_destinatario, mensaje_cifrado) VALUES ($1, $2, $3) RETURNING *',
      [id_remitente, id_destinatario, mensaje_cifrado]
    );

    // (La lógica de notificación no se incluye aquí para enfocarnos en el error)

    res.status(201).json({
      ...result.rows[0],
      mensaje: decrypt(result.rows[0].mensaje_cifrado)
    });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;