// backend/db.js
const { Pool } = require('pg');
const config = require('./config');

// Configuración para la conexión a la base de datos
const dbConfig = {
  // Si estamos en producción (Render), usa la URL de conexión completa.
  connectionString: process.env.DATABASE_URL,
  // Configuración SSL necesaria para la conexión en producción (Render)
  ssl: {
    rejectUnauthorized: false
  }
};

// Si NO estamos en producción, usamos las variables locales.
// Esto asegura que puedas seguir trabajando en tu computadora como antes.
if (config.NODE_ENV !== 'production') {
  delete dbConfig.connectionString; // Borramos la propiedad que no usaremos
  delete dbConfig.ssl; // Borramos la propiedad que no usaremos
  dbConfig.user = config.DB_USER;
  dbConfig.host = config.DB_HOST;
  dbConfig.database = config.DB_DATABASE;
  dbConfig.password = config.DB_PASSWORD;
  dbConfig.port = config.DB_PORT;
}

const pool = new Pool(dbConfig);

/**
 * Función para verificar la conexión con la base de datos.
 */
async function testDbConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión con la base de datos exitosa.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
}

// Exportamos tanto el pool de conexiones como la función de prueba
module.exports = {
  pool,
  testDbConnection,
};