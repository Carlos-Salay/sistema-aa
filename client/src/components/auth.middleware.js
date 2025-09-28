const jwt = require('jsonwebtoken');

const authMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
      return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    jwt.verify(token, 'TU_PALABRA_SECRETA_SUPER_SEGURA', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido o expirado.' });
      }

      // Si se especifican roles, verificamos que el usuario tenga uno de ellos
      if (rolesPermitidos && rolesPermitidos.length > 0) {
        if (!user.rol || !rolesPermitidos.includes(user.rol)) {
          return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
        }
      }

      req.user = user; // Adjuntamos la info del usuario a la petición
      next();
    });
  };
};

module.exports = authMiddleware;