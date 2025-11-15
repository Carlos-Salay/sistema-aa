import React, { useState, useEffect } from 'react';
import { FaChartBar, FaUser, FaGlobe, FaSearch, FaFilePdf, FaPercentage, FaCalendarCheck, FaAward, FaBook, FaUserFriends, FaUsers, FaChartLine, FaBookOpen } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { API_URL } from '../config.js';
import logoAA from '../logos/logo-aa.png';
import Modal from './Modal.jsx';

// Esta función convierte un número total de días en un formato legible
function formatearTiempoSobriedad(totalDias) {
  if (totalDias === null || totalDias === undefined) return 'N/A';
  
  const dias = Math.floor(totalDias);
  
  if (dias < 0) return 'N/A';
  if (dias === 0) return '0 días';

  const anios = Math.floor(dias / 365.25);
  const diasRestantes = dias % 365.25;
  const meses = Math.floor(diasRestantes / 30.44); // Promedio de días al mes

  let partes = [];
  if (anios > 0) {
    partes.push(anios === 1 ? '1 año' : `${anios} años`);
  }
  if (meses > 0) {
    partes.push(meses === 1 ? '1 mes' : `${meses} meses`);
  }

  // Si es menos de 1 mes, mostrar solo los días
  if (anios === 0 && meses === 0) {
    return dias === 1 ? '1 día' : `${dias} días`;
  }
  
  return partes.join(' y ');
}

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const ReportesGlobales = () => {
    const [reportes, setReportes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReportesGlobales = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/reportes-globales`);
                if (!response.ok) throw new Error('No se pudieron cargar los reportes globales.');
                const data = await response.json();
                setReportes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReportesGlobales();
    }, []);

    if (loading) return <div className="content-section"><p>Cargando reportes globales...</p></div>;
    if (error) return <div className="content-section"><p className="message-error">{error}</p></div>;
    if (!reportes) return <div className="content-section"><p>No hay datos disponibles.</p></div>;

    const progresoData = {
        labels: reportes.progreso.map(p => `Paso ${p.paso}`),
        datasets: [{ label: 'Nº de Miembros', data: reportes.progreso.map(p => p.total_miembros), backgroundColor: 'rgba(0, 106, 78, 0.6)', borderColor: 'rgba(0, 106, 78, 1)', borderWidth: 1 }],
    };

    const permanenciaData = {
        labels: reportes.permanencia.map(p => p.mes_nombre),
        datasets: [
            { label: 'Miembros Nuevos', data: reportes.permanencia.map(p => p.nuevos), borderColor: '#2ecc71', backgroundColor: '#2ecc71', tension: 0.3 },
            { label: 'Miembros Inactivos', data: reportes.permanencia.map(p => p.inactivos), borderColor: '#e74c3c', backgroundColor: '#e74c3c', tension: 0.3 }
        ]
    };

    return (
        <div>
            <div className="content-section">
                <h2>Resumen General del Grupo</h2>
                <div className="dashboard-grid">
                    <div className="card"><div className="card-header"><FaUsers /> Miembros Activos</div><div className="card-body"><span className="card-value">{reportes.miembros.activos}</span></div></div>
                    <div className="card"><div className="card-header"><FaUsers /> Miembros Inactivos</div><div className="card-body"><span className="card-value">{reportes.miembros.inactivos}</span></div></div>
                    <div className="card"><div className="card-header"><FaCalendarCheck /> Sesiones Realizadas</div><div className="card-body"><span className="card-value">{reportes.asistencia.totalSesiones}</span></div></div>
                    <div className="card"><div className="card-header"><FaPercentage /> Asistencia Promedio</div><div className="card-body"><span className="card-value">{reportes.asistencia.promedio}</span></div><div className="card-footer">Asistentes por sesión</div></div>
                </div>
            </div>
            <div className="content-section" style={{ marginTop: '40px' }}>
                <h3><FaBookOpen /> Distribución de Miembros por Paso</h3>
                <div style={{ height: '400px' }}><Bar data={progresoData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
            </div>
            <div className="content-section" style={{ marginTop: '40px' }}>
                <h3><FaChartLine /> Permanencia (Últimos 6 Meses)</h3>
                <div style={{ height: '400px' }}><Line data={permanenciaData} options={{ maintainAspectRatio: false }} /></div>
            </div>
        </div>
    );
};

function Reportes() {
  const [vista, setVista] = useState('individual');
  const [miembros, setMiembros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vista === 'individual') {
      const fetchMiembros = async () => {
        try {
          const response = await fetch(`${API_URL}/api/miembros`);
          const data = await response.json();
          setMiembros(data);
        } catch (err) {
          setError('No se pudo cargar la lista de miembros.');
        }
      };
      fetchMiembros();
    }
  }, [vista]);

  const handleMiembroSelect = async (miembro) => {
     if (miembroSeleccionado?.id_miembro === miembro.id_miembro) {
        closeModal();
        return;
    }
    setMiembroSeleccionado(miembro);
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/reportes/evaluacion/${miembro.id_miembro}`);
      const data = await response.json();
      setEvaluacion(data);
    } catch (err) {
      setError('No se pudo cargar el reporte del miembro.');
      setMiembroSeleccionado(null);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setMiembroSeleccionado(null);
    setEvaluacion(null);
  };

  const generatePdf = () => {
    if (!evaluacion || !miembroSeleccionado) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(0, 106, 78);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.addImage(logoAA, 'PNG', pageWidth / 2 - 20, 15, 40, 40);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificado de Progreso', pageWidth / 2, 70, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`"El Grupo de Alcohólicos anónimos San José Pinula" se enorgullece en reconocer a:`, pageWidth / 2, 90, { align: 'center' });
    
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 106, 78);
    doc.text(miembroSeleccionado?.alias || '', pageWidth / 2, 108, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Por haber alcanzado con valentía y perseverancia`, pageWidth / 2, 125, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(formatearTiempoSobriedad(evaluacion.dias_sobriedad), pageWidth / 2 - 50, 145, { align: 'center' });
    doc.text(`Paso ${evaluacion.paso_actual}`, pageWidth / 2 + 50, 145, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const fechaEmision = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Emitido en Guatemala, el ${fechaEmision}.`, pageWidth / 2, 170, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(50, 190, 110, 190);
    doc.text('Coordinador del Grupo', 80, 195, { align: 'center' });
    
    doc.line(pageWidth - 110, 190, pageWidth - 50, 190);
    doc.text('Padrino de Apoyo', pageWidth - 80, 195, { align: 'center' });

    doc.save(`Certificado-${miembroSeleccionado?.alias}-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const miembrosFiltrados = miembros.filter(m => 
    m.alias.toLowerCase().includes(filtro.toLowerCase()) ||
    m.codigo_confidencial.toLowerCase().includes(filtro.toLowerCase())
  );
  
  const ausencias = evaluacion ? evaluacion.total_sesiones_trimestre - evaluacion.asistencias_trimestre : 0;
  const chartData = {
    labels: ['Asistencias', 'Ausencias'],
    datasets: [{ data: [evaluacion?.asistencias_trimestre, ausencias], backgroundColor: ['#2ecc71', '#e74c3c'], hoverBackgroundColor: ['#27ae60', '#c0392b'] }]
  };

  return (
    <div>
      <h1 className="page-title"><FaChartBar /> Reportes de Participación</h1>
      
      <div className="view-toggle" style={{ marginBottom: '30px' }}>
          <button onClick={() => setVista('individual')} className={vista === 'individual' ? 'active' : ''}><FaUser /> <span>Reporte Individual</span></button>
          <button onClick={() => setVista('global')} className={vista === 'global' ? 'active' : ''}><FaGlobe /> <span>Reporte Global</span></button>
      </div>
      
      {vista === 'individual' && (
        <div className="content-section">
          <h2>Evaluación de Constancia por Miembro</h2>
          <p>Selecciona un miembro de la lista para generar su reporte detallado.</p>
          <div className="table-controls">
            <div className="search-input-group">
                <FaSearch />
                <input type="text" placeholder="Buscar por alias o código..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </div>
          </div>
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="miembros-table asistencia-table">
              <thead><tr><th>Alias</th><th>Código Confidencial</th></tr></thead>
              <tbody>
                {miembrosFiltrados.map(miembro => (
                  <tr key={miembro.id_miembro} onClick={() => handleMiembroSelect(miembro)} className={miembroSeleccionado?.id_miembro === miembro.id_miembro ? 'fila-marcada' : ''}>
                    <td>{miembro.alias}</td>
                    <td>{miembro.codigo_confidencial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === 'global' && <ReportesGlobales />}

      <Modal isOpen={!!evaluacion} onClose={closeModal} title={`Reporte de: ${miembroSeleccionado?.alias}`}>
        {loading && <p>Cargando reporte...</p>}
        {error && <p className="message-error">{error}</p>}
        {evaluacion && !loading && (
            <div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
                    <button onClick={generatePdf} className="pdf-button"><FaFilePdf /><span>Generar Certificado</span></button>
                </div>
                <div id="report-cards" className="dashboard-grid">
                    <div className="card chart-card"><div className="card-header">Asistencia (90 días)</div><div className="card-body" style={{height: '150px'}}><Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
                    <div className="card"><div className="card-header"><FaPercentage /> Porcentaje</div><div className="card-body"><span className="card-value">{evaluacion.porcentaje_asistencia}%</span></div></div>
                    <div className="card"><div className="card-header"><FaCalendarCheck /> Asistencias</div><div className="card-body"><span className="card-value">{evaluacion.asistencias_trimestre}/{evaluacion.total_sesiones_trimestre}</span></div></div>
                    <div className="card"><div className="card-header"><FaAward /> Sobriedad</div><div className="card-body"><span className="card-value" style={{fontSize: '2rem'}}>{formatearTiempoSobriedad(evaluacion.dias_sobriedad)}</span></div></div>
                    <div className="card"><div className="card-header"><FaBook /> Paso Actual</div><div className="card-body"><span className="card-value">{evaluacion.paso_actual}</span></div></div>
                    <div className="card"><div className="card-header"><FaUserFriends /> Padrino</div><div className="card-body"><span className="card-value card-value-small">{evaluacion.nombre_padrino || 'No asignado'}</span></div></div>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
}

export default Reportes;