// backend/routes/auth.routes.js
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = Router();

router.post('/login', async (req, res) => {
  const { correo_electronico, password } = req.body; // El campo se sigue llamando correo_electronico, pero puede contener un código

  if (!correo_electronico || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    let user = null;
    let userRole = '';
    let userName = '';
    let userId = null;
    let idOtroChat = null; // ID del padrino o ahijado

    // 1. Verificamos si el input es un correo electrónico
    if (correo_electronico.includes('@')) {
      // Es un Administrador o Coordinador
      const userResult = await pool.query(
        'SELECT u.*, r.nombre as nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.correo_electronico = $1 AND u.id_estado = 1',
        [correo_electronico]
      );

      if (userResult.rows.length > 0) {
        const potentialUser = userResult.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, potentialUser.password_hash);
        if (isPasswordCorrect) {
          user = potentialUser;
          userId = user.id_usuario;
          userName = user.nombre_completo;
          userRole = user.nombre_rol;
        }
      }
    } else {
      // Es un Miembro Anónimo (buscamos por código confidencial)
      const memberResult = await pool.query(
        `SELECT m.*, a.id_padrino, ahijado.id_miembro as id_ahijado
         FROM miembros m 
         LEFT JOIN apoyo a ON m.id_miembro = a.id_ahijado AND a.fecha_fin IS NULL
         LEFT JOIN apoyo ahijado_rel ON m.id_miembro = ahijado_rel.id_padrino AND ahijado_rel.fecha_fin IS NULL
         LEFT JOIN miembros ahijado ON ahijado_rel.id_ahijado = ahijado.id_miembro
         WHERE m.codigo_confidencial = $1 AND m.id_estado = 1`,
        [correo_electronico]
      );

      if (memberResult.rows.length > 0) {
        const potentialMember = memberResult.rows[0];
        if (potentialMember.password_hash) {
          const isPasswordCorrect = await bcrypt.compare(password, potentialMember.password_hash);
          if (isPasswordCorrect) {
            user = potentialMember;
            userId = user.id_miembro;
            userName = user.alias;
            userRole = 'Miembro'; // Asignamos el rol 'Miembro'
            // Determinamos con quién debe chatear
            idOtroChat = user.id_padrino || user.id_ahijado;
          }
        }
      }
    }

    // 2. Si no se encontró usuario o la contraseña fue incorrecta
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 3. Si el login es exitoso, creamos el Token
    const payload = {
      id: userId,
      rol: userRole,
    };
    
    const token = jwt.sign(payload, 'TU_PALABRA_SECRETA_SUPER_SEGURA', {
      expiresIn: '8h',
    });

    // 4. Enviamos una respuesta estandarizada
    res.json({
      message: '¡Login exitoso!',
      token: token,
      user: {
        id: userId,
        alias: userName, // Cambiamos 'nombre' por 'alias' para estandarizar
        rol: userRole,
        idOtroChat: idOtroChat, // <-- AÑADIDO: ID del padrino o ahijado
      },
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;