import React, { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaStar, FaCalendarAlt } from 'react-icons/fa';
import AsistenciaChart from './AsistenciaChart';
import { API_URL } from '../config.js';

function Dashboard() {
  const [stats, setStats] = useState({
    miembrosActivos: 0,
    asistenciaHoy: 0,
    nuevosRegistros: 0,
    proximaSesion: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats/dashboard`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar las estadísticas.');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Función para formatear la fecha y hora de la sesión
  const formatSessionDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'No disponible';
    const date = new Date(dateTimeString);
    const options = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-GT', options);
  };

  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <p className="message-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title">Dashboard Administrativo</h1>
      
      <div className="dashboard-grid">
        
        {/* --- Tarjeta de Miembros Activos --- */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon"><FaUsers /></span>
            <span>Miembros Activos</span>
          </div>
          <div className="card-body">
            <span className="card-value">{stats.miembrosActivos}</span>
          </div>
          <div className="card-footer">
            <span>Total de miembros registrados</span>
          </div>
        </div>

        {/* --- Tarjeta de Asistencia Hoy --- */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon"><FaCheckCircle /></span>
            <span>Asistencia Hoy</span>
          </div>
          <div className="card-body">
            <span className="card-value">{stats.asistenciaHoy}</span>
          </div>
          <div className="card-footer">
            <span>Asistentes a sesiones de hoy</span>
          </div>
        </div>
        
        {/* --- Tarjeta de Nuevos Miembros --- */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon"><FaStar /></span>
            <span>Nuevos Miembros</span>
          </div>
          <div className="card-body">
            <span className="card-value">{stats.nuevosRegistros}</span>
          </div>
          <div className="card-footer">
            <span>Registrados esta semana</span>
          </div>
        </div>
        
        {/* --- Tarjeta de Próxima Sesión --- */}
        <div className="card">
            <div className="card-header">
                <span className="card-icon"><FaCalendarAlt /></span>
                <span>Próxima Sesión</span>
            </div>
            <div className="card-body">
              {stats.proximaSesion ? (
                <div>
                  <span className="card-value" style={{fontSize: '2rem', lineHeight: '1.2'}}>
                    {stats.proximaSesion.tema}
                  </span>
                  <p className="card-footer" style={{marginTop: '10px'}}>
                    {formatSessionDateTime(stats.proximaSesion.fecha_hora)}
                  </p>
                </div>
              ) : (
                <span className="card-value" style={{fontSize: '1.5rem', color: 'var(--text-secondary)'}}>
                  No hay sesiones programadas
                </span>
              )}
            </div>
            <div className="card-footer">
                <span>{stats.proximaSesion?.ubicacion || 'Ubicación no definida'}</span>
            </div>
        </div>
      </div>

      <div className="content-section" style={{marginTop: '40px'}}>
        <AsistenciaChart />
      </div>
    </div>
  );
}

export default Dashboard;