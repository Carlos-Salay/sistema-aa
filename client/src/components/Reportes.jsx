// client/src/components/Reportes.jsx
import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCalendarCheck, FaPercentage, FaAward, FaBook, FaExclamationTriangle, FaUserFriends, FaUsers, FaFilePdf } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

ChartJS.register(ArcElement, Tooltip, Legend);

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

  const generatePdf = async () => {
    if (!evaluacion || !miembroSeleccionado) return;

    const doc = new jsPDF();
    const miembroActual = miembros.find(m => m.id_miembro === parseInt(miembroSeleccionado));

    // Título
    doc.setFontSize(20);
    doc.text(`Reporte de Progreso: ${miembroActual?.alias}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

    // Capturar las tarjetas como imagen
    const cardsElement = document.getElementById('report-cards');
    if (cardsElement) {
      let finalY = 40; // Posición inicial si no hay tarjetas
      const canvas = await html2canvas(cardsElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const imgHeight = (imgProps.height * (pdfWidth - 28)) / imgProps.width;
      doc.addImage(imgData, 'PNG', 14, 40, pdfWidth - 28, imgHeight);
      finalY = 40 + imgHeight + 10; // Posición después de la imagen + un margen
      
      // Tabla de historial de asistencia
      doc.autoTable({
        startY: finalY,
        head: [['Fecha de la Sesión', 'Tema de la Sesión']],
        body: historial.map(item => [
          new Date(item.fecha_hora).toLocaleDateString('es-ES'),
          item.tema
        ]),
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: (data) => {
          // Header en cada página
          doc.setFontSize(20);
          doc.text('Reporte de Progreso', data.settings.margin.left, 22);
        }
      });
    } else {
      // Si no hay tarjetas, simplemente añadimos la tabla
      doc.autoTable({
        startY: 40,
        head: [['Fecha de la Sesión', 'Tema de la Sesión']],
        body: historial.map(item => [
          new Date(item.fecha_hora).toLocaleDateString('es-ES'),
          item.tema
        ]),
        headStyles: { fillColor: [41, 128, 185] }
      });
    }
    doc.save(`Reporte-${miembroActual?.alias}-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const ausencias = evaluacion ? evaluacion.total_sesiones_trimestre - evaluacion.asistencias_trimestre : 0;
  const chartData = {
    labels: ['Asistencias', 'Ausencias'],
    datasets: [{ data: [evaluacion?.asistencias_trimestre, ausencias], backgroundColor: ['#2ecc71', '#e74c3c'], hoverBackgroundColor: ['#27ae60', '#c0392b'] }]
  };

  return (
    <div>
      <h1 className="page-title">
        <FaChartBar className="page-logo-icon" />
        Reportes de Participación
      </h1>

      <div className="content-section">
        <h2>Evaluación de Constancia por Miembro</h2>
        <div className="report-controls">
          <label htmlFor="miembro-select">Selecciona un miembro:</label>
          <select id="miembro-select" value={miembroSeleccionado} onChange={handleMiembroChange}>
            <option value="">-- Elige un miembro --</option>
            {miembros.map(miembro => (
              <option key={miembro.id_miembro} value={miembro.id_miembro}>
                {miembro.alias} ({miembro.codigo_confidencial})
              </option>
            ))}
          </select>
          {evaluacion && (
            <button onClick={generatePdf} className="pdf-button">
              <FaFilePdf />
              <span>Generar PDF</span>
            </button>
          )}
        </div>

        {loading && <p>Cargando reporte...</p>}
        {error && <p className="message-error">{error}</p>}

        {evaluacion && !loading && (
          <div id="report-cards" className="dashboard-grid" style={{marginTop: '30px'}}>
            <div className="card chart-card">
              <div className="card-header">Asistencia (Últimos 90 días)</div>
              <div className="card-body" style={{height: '150px', display: 'flex', justifyContent: 'center'}}>
                <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
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
              <div className="card-footer">Fecha de la última sesión</div>
            </div>
            {/* --- NUEVAS TARJETAS DE PROGRESO --- */}
            <div className="card">
              <div className="card-header"><FaAward /> Días de Sobriedad</div>
              <div className="card-body"><span className="card-value">{evaluacion.dias_sobriedad}</span></div>
              <div className="card-footer">Desde el {evaluacion.fecha_recaida_o_inicio ? new Date(evaluacion.fecha_recaida_o_inicio).toLocaleDateString('es-ES') : 'N/A'}</div>
            </div>
            <div className="card">
              <div className="card-header"><FaBook /> Paso Actual</div>
              <div className="card-body"><span className="card-value">{evaluacion.paso_actual}</span></div>
              <div className="card-footer">Progreso en los 12 pasos</div>
            </div>
            <div className="card">
              <div className="card-header"><FaExclamationTriangle /> Inicio / Recaída</div>
              <div className="card-body">
                <span className="card-value" style={{fontSize: '1.5rem'}}>
                  {evaluacion.fecha_recaida_o_inicio ? new Date(evaluacion.fecha_recaida_o_inicio).toLocaleDateString('es-ES') : 'No registrada'}
                </span>
              </div>
              <div className="card-footer">Fecha de inicio de sobriedad</div>
            </div>
            <div className="card">
              <div className="card-header"><FaUserFriends /> Padrino de Apoyo</div>
              <div className="card-body"><span className="card-value" style={{fontSize: '2rem'}}>{evaluacion.nombre_padrino}</span></div>
              <div className="card-footer">Guía en el proceso</div>
            </div>
            <div className="card">
              <div className="card-header"><FaUsers /> Ahijados a Cargo</div>
              <div className="card-body"><span className="card-value">{evaluacion.total_ahijados}</span></div>
              <div className="card-footer">Miembros que apadrina</div>
            </div>
          </div>
        )}

        {miembroSeleccionado && !loading && (
          <div className="content-section" style={{marginTop: '40px'}}>
            <h3>Historial Detallado de Asistencia</h3>
            <div className="table-responsive">
              <table className="miembros-table">
                <thead>
                  <tr>
                    <th>Fecha de la Sesión</th>
                    <th>Tema de la Sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(item => (
                    <tr key={item.id_sesion}><td>{new Date(item.fecha_hora).toLocaleDateString('es-ES')}</td><td>{item.tema}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reportes;