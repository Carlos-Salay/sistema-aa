// client/src/components/Notificaciones.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../config.js';
import { FaBell, FaTimes } from 'react-icons/fa';

function Notificaciones() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Función para obtener las notificaciones del backend
  const fetchNotificaciones = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/notificaciones/${user.id}`);
      const data = await response.json();
      setNotificaciones(data);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  // Cargar notificaciones al inicio y luego cada 15 segundos
  useEffect(() => {
    fetchNotificaciones();
    const intervalId = setInterval(fetchNotificaciones, 15000); // Refresca cada 15 segundos
    return () => clearInterval(intervalId);
  }, [user]);

  // Función para manejar el clic en una notificación
  const handleNotificacionClick = async (notificacion) => {
    try {
      // 1. Marcar la notificación como leída en el backend
      await fetch(`${API_URL}/api/notificaciones/${notificacion.id_notificacion}/leido`, {
        method: 'PUT',
      });
      
      // 2. Cerrar el panel y navegar al enlace
      setIsOpen(false);
      navigate(notificacion.enlace);
      
      // 3. Actualizar la lista de notificaciones en el frontend
      setNotificaciones(prev => prev.filter(n => n.id_notificacion !== notificacion.id_notificacion));
    } catch (error) {
      console.error("Error al procesar la notificación:", error);
    }
  };

  // Función para marcar todas como leídas
  const handleMarcarTodasLeidas = async () => {
    try {
        await fetch(`${API_URL}/api/notificaciones/marcar-todas-leidas/${user.id}`, {
            method: 'PUT',
        });
        setNotificaciones([]); // Vaciar la lista en el frontend
    } catch (error) {
        console.error("Error al marcar todas como leídas:", error);
    }
  };


  return (
    <div className="notificaciones-container">
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
        <FaBell />
        {notificaciones.length > 0 && (
          <span className="notification-badge">{notificaciones.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notificaciones-panel">
          <div className="panel-header">
            <h3>Notificaciones</h3>
            <button className="close-panel-btn" onClick={() => setIsOpen(false)}><FaTimes /></button>
          </div>
          <div className="notificaciones-list">
            {notificaciones.length > 0 ? (
              notificaciones.map(notif => (
                <div key={notif.id_notificacion} className="notificacion-item" onClick={() => handleNotificacionClick(notif)}>
                  <p>{notif.mensaje}</p>
                  <small>{new Date(notif.fecha_creacion).toLocaleString('es-GT')}</small>
                </div>
              ))
            ) : (
              <p className="no-notificaciones">No tienes notificaciones nuevas.</p>
            )}
          </div>
          {notificaciones.length > 0 && (
              <div className="panel-footer">
                  <button onClick={handleMarcarTodasLeidas} className="marcar-leidas-btn">
                      Marcar todas como leídas
                  </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notificaciones;