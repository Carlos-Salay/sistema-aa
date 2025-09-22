// db.js

// 1. Cargar la librería de PostgreSQL
const { Pool } = require('pg');

// 2. Cargar las variables de entorno
require('dotenv').config();

// 3. Crear el "pool" de conexiones
// Un pool es más eficiente que una conexión única para un servidor web
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 4. (Opcional) Función para probar la conexión
async function testDbConnection() {
  try {
    await pool.query('SELECT NOW()'); // Consulta muy simple para probar
    console.log('✅ Conexión con la base de datos exitosa.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
}

// 5. Exportar el pool para poder usarlo en otras partes de la aplicación
module.exports = {
  pool,
  testDbConnection,
};