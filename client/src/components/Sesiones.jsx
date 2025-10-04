import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config.js';
import { FaCalendarPlus, FaListAlt, FaBook, FaCalendarAlt, FaMapMarkerAlt, FaAlignLeft, FaChevronDown } from 'react-icons/fa';

function Sesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [formData, setFormData] = useState({
    tema: '',
    fecha_hora: '',
    id_ubicacion: '',
    descripcion: ''
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // --- LÓGICA DE DATOS (NO HAY CAMBIOS AQUÍ) ---
  const fetchData = async () => {
    try {
      const [sesionesRes, ubicacionesRes] = await Promise.all([
        fetch(`${API_URL}/api/sesiones`),
        fetch(`${API_URL}/api/ubicaciones`)
      ]);
      const sesionesData = await sesionesRes.json();
      const ubicacionesData = await ubicacionesRes.json();
      
      setSesiones(sesionesData);
      setUbicaciones(ubicacionesData);

      if (ubicacionesData.length > 0 && !formData.id_ubicacion) {
        setFormData(prev => ({...prev, id_ubicacion: ubicacionesData[0].id_ubicacion}));
      }
    } catch (err) {
      setError("No se pudieron cargar los datos iniciales.");
    }
  };

  useEffect(() => {
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
      const response = await fetch(`${API_URL}/api/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear la sesión.');
      }
      setMensaje('¡Sesión creada con éxito!');
      setFormData({ 
        tema: '', 
        fecha_hora: '', 
        id_ubicacion: ubicaciones[0]?.id_ubicacion || '', 
        descripcion: '' 
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">
        <FaCalendarPlus className="page-logo-icon" />
        Gestión de Sesiones
      </h1>

      {/* Usamos los mismos contenedores que el login para centrar la tarjeta */}
      <div className="login-page-container" style={{ minHeight: 'auto', padding: '0 0 40px 0' }}>
        <div className="login-card-split" style={{ maxWidth: '700px', display: 'block' }}>
          <div className="login-form-section">
            <h2 className="login-title-split">Crear Nueva Sesión</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <FaBook className="input-icon" />
                <input type="text" name="tema" placeholder="Tema de la Sesión" value={formData.tema} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <FaCalendarAlt className="input-icon" />
                <input type="datetime-local" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} required />
              </div>

              <div className="input-group select-group">
                <FaMapMarkerAlt className="input-icon" />
                <select name="id_ubicacion" value={formData.id_ubicacion} onChange={handleChange}>
                  {ubicaciones.map(u => (
                    <option key={u.id_ubicacion} value={u.id_ubicacion}>{u.nombre}</option>
                  ))}
                </select>
                <FaChevronDown className="select-arrow" />
              </div>

              <div className="input-group textarea-group">
                <FaAlignLeft className="input-icon" />
                <textarea name="descripcion" placeholder="Descripción (opcional)" value={formData.descripcion} onChange={handleChange} rows="4"></textarea>
              </div>

              <button type="submit" className="login-button-primary">
                <span>Crear Sesión</span>
              </button>
            </form>
            {mensaje && <p className="message-success" style={{marginTop: '20px'}}>{mensaje}</p>}
            {error && <p className="message-error" style={{marginTop: '20px'}}>{error}</p>}
          </div>
        </div>
      </div>

      {/* Tarjeta para Sesiones Programadas */}
      <div className="content-section">
        <h2 className="section-title"><FaListAlt /> Sesiones Programadas</h2>
        <div className="table-responsive">
          <table className="miembros-table">
            <thead>
              <tr>
                <th>Tema</th>
                <th>Fecha y Hora</th>
                <th style={{textAlign: 'center'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((sesion) => (
                <tr key={sesion.id_sesion}>
                  <td>{sesion.tema}</td>
                  <td>{new Date(sesion.fecha_hora).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{textAlign: 'center'}}>
                    <Link to={`/sesiones/${sesion.id_sesion}/asistencia`}>
                      <button><span>Asistencia</span></button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Sesiones;