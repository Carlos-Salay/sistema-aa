// client/src/config.js

// Lee la variable de entorno VITE_API_URL.
// Si no la encuentra, usa http://localhost:4000 como valor por defecto.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';