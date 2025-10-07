const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const config = require('../config');

const router = Router();

router.post('/login', async (req, res) => {
  // El campo 'credencial' puede ser un código de miembro o de usuario
  const { credencial, password } = req.body;

  if (!credencial || !password) {
    return res.status(400).json({ message: 'El código y la contraseña son requeridos.' });
  }

  try {
    let user = null;
    let userRole = '';
    let userName = '';
    let userId = null;

    // Determinar si es un intento de login de Miembro (AA) o Usuario (UAA)
    const isUserLogin = credencial.startsWith('UAA');
    const isMemberLogin = credencial.startsWith('AA');

    if (isUserLogin) {
      // Login para Administrador o Coordinador por 'codigo_usuario'
      const userResult = await pool.query(
        'SELECT u.*, r.nombre as nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.codigo_usuario = $1 AND u.id_estado = 1',
        [credencial]
      );

      if (userResult.rows.length > 0) {
        const potentialUser = userResult.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, potentialUser.password_hash);
        if (isPasswordCorrect) {
          user = potentialUser;
          userId = user.id_usuario;
          userName = user.alias;
          userRole = user.nombre_rol;
        }
      }
    } else if (isMemberLogin) {
      // Login para Miembro por 'codigo_confidencial'
      const memberResult = await pool.query(
        'SELECT m.id_miembro, m.alias, m.codigo_confidencial, m.password_hash FROM miembros m WHERE m.codigo_confidencial = $1 AND m.id_estado = 1',
        [credencial]
      );

      if (memberResult.rows.length > 0) {
        const potentialMember = memberResult.rows[0];
        if (potentialMember.password_hash) {
          const isPasswordCorrect = await bcrypt.compare(password, potentialMember.password_hash);
          if (isPasswordCorrect) {
            user = potentialMember;
            userId = user.id_miembro;
            userName = user.alias;
            userRole = 'Miembro';
          }
        }
      }
    }

    // Si no se encontró usuario o la contraseña fue incorrecta
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Crear el Token
    const payload = { id: userId, rol: userRole };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '8h' });

    // Enviar respuesta estandarizada
    res.json({
      message: '¡Login exitoso!',
      token: token,
      user: {
        id: userId,
        alias: userName,
        rol: userRole,
        id_miembro: userRole === 'Miembro' ? userId : null,
      },
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;