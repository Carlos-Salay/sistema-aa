// client/src/components/Reportes.jsx
import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCalendarCheck, FaPercentage } from 'react-icons/fa';

function Reportes() {
  const [miembros, setMiembros] = useState([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState('');
  const [historial, setHistorial] = useState([]);
  const [evaluacion, setEvaluacion] = useState(null); // Nuevo estado para las estadísticas
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/miembros');
        const data = await response.json();
        setMiembros(data);
      } catch (err) {
        setError('No se pudo cargar la lista de miembros.');
      }
    };
    fetchMiembros();
  }, []);

  const handleMiembroChange = async (e) => {
    const idMiembro = e.target.value;
    setMiembroSeleccionado(idMiembro);
    setHistorial([]);
    setEvaluacion(null);

    if (idMiembro) {
      setLoading(true);
      setError('');
      try {
        // Pedimos tanto el historial como la evaluación en paralelo
        const [historialRes, evaluacionRes] = await Promise.all([
          fetch(`http://localhost:4000/api/reportes/asistencia/${idMiembro}`),
          fetch(`http://localhost:4000/api/reportes/evaluacion/${idMiembro}`)
        ]);
        
        const historialData = await historialRes.json();
        const evaluacionData = await evaluacionRes.json();

        setHistorial(historialData);
        setEvaluacion(evaluacionData);
      } catch (err) {
        setError('No se pudo cargar el reporte completo.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <h1 className="page-title">
        <FaChartBar className="page-logo-icon" />
        Reportes de Participación
      </h1>

      <div className="content-section">
        <h2>Evaluación de Constancia por Miembro</h2>
        <div className="form-group" style={{maxWidth: '500px'}}>
          <label htmlFor="miembro-select">Selecciona un miembro:</label>
          <select id="miembro-select" value={miembroSeleccionado} onChange={handleMiembroChange}>
            <option value="">-- Elige un miembro --</option>
            {miembros.map(miembro => (
              <option key={miembro.id_miembro} value={miembro.id_miembro}>
                {miembro.alias} ({miembro.codigo_confidencial})
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Cargando reporte...</p>}
        {error && <p className="message-error">{error}</p>}

        {evaluacion && !loading && (
          <div className="dashboard-grid" style={{marginTop: '30px'}}>
            <div className="card">
              <div className="card-header"><FaPercentage /> Porcentaje de Asistencia</div>
              <div className="card-body"><span className="card-value">{evaluacion.porcentaje_asistencia}%</span></div>
              <div className="card-footer">En los últimos 90 días</div>
            </div>
            <div className="card">
              <div className="card-header"><FaCalendarCheck /> Asistencias</div>
              <div className="card-body"><span className="card-value">{evaluacion.asistencias_trimestre} / {evaluacion.total_sesiones_trimestre}</span></div>
              <div className="card-footer">Sesiones en los últimos 90 días</div>
            </div>
            <div className="card">
              <div className="card-header"><FaCalendarCheck /> Última Asistencia</div>
              <div className="card-body">
                <span className="card-value" style={{fontSize: '1.5rem'}}>
                  {evaluacion.ultima_asistencia ? new Date(evaluacion.ultima_asistencia).toLocaleDateString('es-ES') : 'Ninguna'}
                </span>
              </div>
            </div>
          </div>
        )}

        {miembroSeleccionado && !loading && (
          <div style={{marginTop: '30px'}}>
            <h3>Historial Detallado de Asistencia</h3>
            <table>
              {/* ... tu tabla de historial ... */}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reportes;