// backend/db.js

const { Pool } = require('pg');
const config = require('./config'); // Importamos la configuración central

const pool = new Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_DATABASE,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  // Configuración SSL necesaria para la conexión en producción (Render)
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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