// 1. Importación de Módulos
const express = require('express');
const cors = require('cors');
const { testDbConnection } = require('./db');
const config = require('./config'); // <-- AÑADIDO: Importar la configuración



// ===== CÓDIGO TEMPORAL PARA GENERAR HASH =====
const bcrypt = require('bcryptjs');
const miPassword = 'admin123'; // La contraseña que quieres usar

bcrypt.hash(miPassword, 10).then(hash => {
  console.log('==============================================');
  console.log('COPIA ESTE NUEVO HASH:');
  console.log(hash);
  console.log('==============================================');
});
// ===== FIN DE CÓDIGO TEMPORAL =====

// 2. Importación de Todos los Archivos de Rutas
const miembroRoutes = require('./routes/miembros.routes.js');
const sesionesRoutes = require('./routes/sesiones.routes.js');
const asistenciaRoutes = require('./routes/asistencia.routes.js');
const bitacoraRoutes = require('./routes/bitacora.routes.js');
const statsRoutes = require('./routes/stats.routes.js');
const usuariosRoutes = require('./routes/usuarios.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const rolesRoutes = require('./routes/roles.routes.js');
const mensajesRoutes = require('./routes/mensajes.routes.js');
const reportesRoutes = require('./routes/reportes.routes.js');
const ubicacionesRoutes = require('./routes/ubicaciones.routes.js');
const testimoniosRoutes = require('./routes/testimonios.routes.js');
const notificacionesRoutes = require('./routes/notificaciones.routes.js'); 
const reportesGlobalesRoutes = require('./routes/reportesGlobales.routes.js');

// 3. Inicialización de la Aplicación Express
const app = express();

// 4. Middlewares
app.use(cors());
app.use(express.json());

// 5. Registro de las Rutas de la API
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/miembros', miembroRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/bitacora', bitacoraRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/reportes-globales', reportesGlobalesRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);
app.use('/api/testimonios', testimoniosRoutes);

// 6. Definición del Puerto
const PORT = config.PORT; // <-- CAMBIO: Usar el puerto desde la config

// 7. Iniciar el Servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  testDbConnection();
});