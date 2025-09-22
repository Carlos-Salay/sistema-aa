// client/src/components/Calendario.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Modal from './Modal.jsx'; // 1. Importamos nuestro componente Modal

function Calendario() {
  const [sesiones, setSesiones] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null); // 2. Nuevo estado para la sesión seleccionada
  const [error, setError] = useState('');

  // Carga las sesiones (sin cambios)
  useEffect(() => {
    const fetchSesiones = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/sesiones');
        if (!response.ok) throw new Error('No se pudieron cargar las sesiones.');
        const data = await response.json();
        const formattedSesiones = data.map(s => ({...s, fecha_hora: new Date(s.fecha_hora)}));
        setSesiones(formattedSesiones);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSesiones();
  }, []);

  // --- Lógica para generar el calendario ---
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = firstDayOfMonth.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const isToday = new Date().toDateString() === dayDate.toDateString();
    const daySessions = sesiones.filter(s => s.fecha_hora.toDateString() === dayDate.toDateString());

    calendarDays.push(
      <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
        <div className="day-number">{day}</div>
        <div className="sessions-container">
          {daySessions.map(sesion => (
            // 3. Añadimos el evento onClick para abrir el modal con esta sesión
            <div 
              key={sesion.id_sesion} 
              className="session-event"
              onClick={() => setSelectedSession(sesion)}
            >
              {sesion.tema}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Funciones de Navegación (sin cambios) ---
  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div>
      <h1 className="page-title">
        <FaCalendarAlt className="page-logo-icon" />
        Calendario de Sesiones
      </h1>
      <div className="content-section">
        <div className="calendar-header">
          <button onClick={goToPreviousMonth} className="nav-button"><FaChevronLeft /></button>
          <h2 className="month-title">
            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToNextMonth} className="nav-button"><FaChevronRight /></button>
          <button onClick={goToToday} className="today-button">Hoy</button>
        </div>
        <div className="calendar-weekdays">
          {daysOfWeek.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="calendar-grid">
          {calendarDays}
        </div>
      </div>
      {error && <p className="message-error">{error}</p>}

      {/* 4. Añadimos el Modal al final. Será invisible hasta que se seleccione una sesión */}
      <Modal 
        isOpen={!!selectedSession} 
        onClose={() => setSelectedSession(null)} 
        title={selectedSession?.tema}
      >
        {selectedSession && (
          <div style={{textAlign: 'left'}}>
            <p><strong>Fecha:</strong> {new Date(selectedSession.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Hora:</strong> {new Date(selectedSession.fecha_hora).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Ubicación:</strong> {selectedSession.ubicacion || 'No especificada'}</p>
            <p><strong>Descripción:</strong> {selectedSession.descripcion || 'Sin descripción.'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Calendario;