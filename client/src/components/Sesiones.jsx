// client/src/components/Sesiones.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaListAlt } from 'react-icons/fa';

function Sesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]); // Nuevo estado para las ubicaciones
  
  // Añadimos los nuevos campos al estado del formulario
  const [formData, setFormData] = useState({
    tema: '',
    fecha_hora: '',
    id_ubicacion: '',
    descripcion: ''
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Carga tanto las sesiones como las ubicaciones al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pedimos la lista de sesiones
        const sesionesRes = await fetch('http://localhost:4000/api/sesiones');
        const sesionesData = await sesionesRes.json();
        setSesiones(sesionesData);

        // Pedimos la lista de ubicaciones
        const ubicacionesRes = await fetch('http://localhost:4000/api/ubicaciones'); // Asumimos que esta ruta existirá
        const ubicacionesData = await ubicacionesRes.json();
        setUbicaciones(ubicacionesData);
        if (ubicacionesData.length > 0) {
          setFormData(prev => ({...prev, id_ubicacion: ubicacionesData[0].id_ubicacion}));
        }
      } catch (err) {
        setError("No se pudieron cargar los datos iniciales.");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const response = await fetch('http://localhost:4000/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear la sesión.');
      }
      setMensaje('¡Sesión creada con éxito!');
      setFormData({ tema: '', fecha_hora: '', id_ubicacion: ubicaciones[0]?.id_ubicacion || '', descripcion: '' });
      fetchSesiones();
    } catch (err) {
      setError(err.message);
    }
  };

  // Función para recargar solo las sesiones
  const fetchSesiones = async () => {
    const response = await fetch('http://localhost:4000/api/sesiones');
    const data = await response.json();
    setSesiones(data);
  }

  return (
    <div>
      <h1 className="page-title">
        <FaCalendarPlus className="page-logo-icon" />
        Gestión de Sesiones
      </h1>
      <div className="content-section">
        <h2>Crear Nueva Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tema">Tema de la Sesión:</label>
            <input type="text" id="tema" name="tema" value={formData.tema} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="fecha_hora">Fecha y Hora:</label>
            <input type="datetime-local" id="fecha_hora" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} required />
          </div>
          
          {/* --- NUEVOS CAMPOS AÑADIDOS --- */}
          <div className="form-group">
            <label htmlFor="id_ubicacion">Ubicación:</label>
            <select id="id_ubicacion" name="id_ubicacion" value={formData.id_ubicacion} onChange={handleChange}>
              {ubicaciones.map(u => (
                <option key={u.id_ubicacion} value={u.id_ubicacion}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="descripcion">Descripción (opcional):</label>
            <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3"></textarea>
          </div>
          
          <button type="submit">Crear Sesión</button>
        </form>
        {mensaje && <p className="message-success">{mensaje}</p>}
        {error && <p className="message-error">{error}</p>}
      </div>

      <div className="content-section" style={{ marginTop: '30px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaListAlt style={{ color: 'var(--primary-green)' }} /> Sesiones Programadas
        </h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tema</th>
              <th>Fecha y Hora</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map((sesion) => (
              <tr key={sesion.id_sesion}>
                <td>{sesion.id_sesion}</td>
                <td>{sesion.tema}</td>
                <td>{new Date(sesion.fecha_hora).toLocaleString('es-GT')}</td>
                <td>
                  <Link to={`/sesiones/${sesion.id_sesion}/asistencia`}>
                    <button>Asistencia</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Sesiones;