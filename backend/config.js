// backend/config.js
require('dotenv').config();

// Lee las variables de entorno del sistema o usa valores por defecto para desarrollo local
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_DATABASE: process.env.DB_DATABASE || 'seguimientoaa',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',

  JWT_SECRET: process.env.JWT_SECRET || 'local-secret-key-for-jwt',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'local-encryption-key-1234567890'
};