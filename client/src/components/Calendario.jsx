import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Modal from './Modal.jsx';
import { API_URL } from '../config.js';

function Calendario() {
  const [sesiones, setSesiones] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSesiones = async () => {
      try {
        const response = await fetch(`${API_URL}/api/sesiones`);
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

  const sessionsForSelectedDay = sesiones.filter(
    s => s.fecha_hora.toDateString() === selectedDate.toDateString()
  );

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
    const isSelected = selectedDate.toDateString() === dayDate.toDateString();
    const daySessions = sesiones.filter(s => s.fecha_hora.toDateString() === dayDate.toDateString());

    calendarDays.push(
      <div 
        key={day} 
        className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedDate(dayDate)}
      >
        <div className="day-number">{day}</div>
        <div className="sessions-container">
          {daySessions.map(sesion => (
            <div 
              key={sesion.id_sesion} 
              className="session-event"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSession(sesion);
              }}
            >
              {sesion.tema}
            </div>
          ))}
          {daySessions.length > 0 && <div className="session-indicator"></div>} 
        </div>
      </div>
    );
  }

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

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

        <div className="calendar-layout">
          <div>
            <div className="calendar-weekdays">
              {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="calendar-grid">
              {calendarDays}
            </div>
          </div>
        
          <div className="agenda-view">
            <h3 className="agenda-title">
              Sesiones del {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
            </h3>
            <div className="agenda-list">
              {sessionsForSelectedDay.length > 0 ? (
                sessionsForSelectedDay.map(sesion => (
                  <div key={sesion.id_sesion} className="agenda-item" onClick={() => setSelectedSession(sesion)}>
                    <div className="agenda-item-time">
                      {sesion.fecha_hora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="agenda-item-details">
                      <div className="agenda-item-title">{sesion.tema}</div>
                      <div className="agenda-item-location">{sesion.ubicacion || 'No especificada'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="agenda-item-empty">
                  No hay sesiones programadas para este día.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {error && <p className="message-error">{error}</p>}

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