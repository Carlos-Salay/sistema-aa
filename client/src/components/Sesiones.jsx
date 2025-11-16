import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
    FaCalendarPlus, FaListAlt, FaBook, FaCalendarAlt, FaMapMarkerAlt, 
    FaAlignLeft, FaChevronDown, FaPlus, FaMapMarkedAlt, FaTrash
} from 'react-icons/fa';
import Modal from './Modal.jsx';

function Sesiones() {
  const { user } = useAuth();
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
  
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [nuevaUbicacion, setNuevaUbicacion] = useState({ nombre: '', direccion: '' });
  const [modalDelete, setModalDelete] = useState({ isOpen: false, sesion: null });

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

  useEffect(() => { fetchData(); }, []);

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
      setFormData({ tema: '', fecha_hora: '', id_ubicacion: ubicaciones[0]?.id_ubicacion || '', descripcion: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuardarUbicacion = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_URL}/api/ubicaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaUbicacion),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Error al guardar.');
        }
        const ubicacionGuardada = await response.json();
        
        const ubicacionesActualizadas = [...ubicaciones, ubicacionGuardada].sort((a, b) => a.nombre.localeCompare(b.nombre));
        setUbicaciones(ubicacionesActualizadas);
        setFormData(prev => ({...prev, id_ubicacion: ubicacionGuardada.id_ubicacion}));
        
        setIsUbicacionModalOpen(false);
        setNuevaUbicacion({ nombre: '', direccion: '' });
    } catch (err) {
        alert(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!modalDelete.sesion) return;
    try {
      setError('');
      const response = await fetch(`${API_URL}/api/sesiones/${modalDelete.sesion.id_sesion}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('No se pudo eliminar la sesión.');
      }
      setModalDelete({ isOpen: false, sesion: null });
      fetchData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title"><FaCalendarPlus /> Gestión de Sesiones</h1>

      <div className="login-page-container" style={{ minHeight: 'auto', padding: '0 0 40px 0' }}>
        <div className="login-card-split" style={{ maxWidth: '700px', display: 'block' }}>
          <div className="login-form-section">
            <h2 className="login-title-split">Crear Nueva Sesión</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <FaBook className="input-icon" />
                <input type="text" placeholder="Tema de la Sesión" name="tema" value={formData.tema} onChange={handleChange} required />
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
              
              <button type="button" onClick={() => setIsUbicacionModalOpen(true)} className="button-link" style={{marginBottom: '20px'}}>
                  <FaPlus /> Añadir nueva ubicación
              </button>

              <div className="input-group textarea-group">
                <FaAlignLeft className="input-icon" />
                <textarea name="descripcion" placeholder="Descripción (opcional)" value={formData.descripcion} onChange={handleChange} rows="3"></textarea>
              </div>
              <button type="submit" className="login-button-primary"><span>Crear Sesión</span></button>
            </form>
            {mensaje && <p className="message-success">{mensaje}</p>}
            {error && <p className="message-error">{error}</p>}
          </div>
        </div>
      </div>

      <div className="content-section">
        <h2><FaListAlt /> Sesiones Programadas</h2>
        <div className="table-responsive">
            <table className="miembros-table">
                <thead>
                    <tr>
                        <th>Tema</th>
                        <th>Ubicación</th>
                        <th>Fecha y Hora</th>
                        <th style={{textAlign: 'center'}}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sesiones.map((sesion) => (
                        <tr key={sesion.id_sesion}>
                            <td>{sesion.tema}</td>
                            <td>{sesion.ubicacion || 'N/D'}</td>
                            
                            {/* --- LÍNEA CORREGIDA ---
                                 Le decimos a JS que formatee la fecha UTC que recibe
                                 usando la zona horaria 'America/Guatemala'.
                            */}
                            <td>{new Date(sesion.fecha_hora).toLocaleString('es-GT', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true,
                                timeZone: 'America/Guatemala' 
                            })}</td>
                            
                            <td style={{textAlign: 'center'}}>
                                <div className="acciones-cell" style={{justifyContent: 'center'}}>
                                    <Link to={`/sesiones/${sesion.id_sesion}/asistencia`}>
                                        <button className="action-button">Asistencia</button>
                                    </Link>
                                    {user.rol === 'Administrador' && (
                                        <button 
                                            onClick={() => setModalDelete({ isOpen: true, sesion: sesion })}
                                            className="action-icon-button danger"
                                            title="Eliminar Sesión">
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <Modal 
        isOpen={isUbicacionModalOpen} 
        onClose={() => setIsUbicacionModalOpen(false)}
        title="Crear Nueva Ubicación"
      >
        <form onSubmit={handleGuardarUbicacion} className="modal-form">
            <div className="input-group">
                <FaMapMarkerAlt className="input-icon" />
                <input 
                    type="text" 
                    placeholder="Nombre de la Ubicación"
                    value={nuevaUbicacion.nombre}
                    onChange={(e) => setNuevaUbicacion(u => ({...u, nombre: e.target.value}))}
                    required
                />
            </div>
            <div className="input-group">
                <FaMapMarkedAlt className="input-icon" />
                <input 
                    type="text" 
                    placeholder="Dirección (Opcional)"
                    value={nuevaUbicacion.direccion}
                    onChange={(e) => setNuevaUbicacion(u => ({...u, direccion: e.target.value}))}
                />
            </div>
            <div className="modal-actions">
                <button type="button" onClick={() => setIsUbicacionModalOpen(false)} className="button-secondary"><span>Cancelar</span></button>
                <button type="submit"><span>Guardar Ubicación</span></button>
            </div>
        </form>
      </Modal>

      <Modal 
        isOpen={modalDelete.isOpen} 
        onClose={() => setModalDelete({ isOpen: false, sesion: null })}
        title="Confirmar Eliminación"
      >
        <p>¿Estás seguro de que quieres eliminar la sesión "<strong>{modalDelete.sesion?.tema}</strong>"?</p>
        <p style={{color: 'var(--error-color)', fontWeight: 'bold'}}>
          Esta acción no se puede deshacer y borrará todos los registros de asistencia asociados a ella.
        </p>
        <div className="modal-actions">
            <button onClick={() => setModalDelete({ isOpen: false, sesion: null })} className="button-secondary"><span>Cancelar</span></button>
            <button onClick={handleConfirmDelete} className="button-danger"><span>Sí, eliminar</span></button>
        </div>
      </Modal>

    </div>
  );
}

export default Sesiones;