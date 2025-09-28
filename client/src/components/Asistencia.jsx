import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUsers, FaCheck } from 'react-icons/fa';

function Asistencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [asistentes, setAsistentes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [miembrosRes, asistenciaRes, sessionRes] = await Promise.all([
          fetch('http://localhost:4000/api/miembros'),
          fetch(`http://localhost:4000/api/asistencia/${id}`),
          fetch(`http://localhost:4000/api/sesiones/${id}`)
        ]);

        if (!miembrosRes.ok || !asistenciaRes.ok || !sessionRes.ok) {
            throw new Error('No se pudieron cargar los datos necesarios.');
        }

        const miembrosData = await miembrosRes.json();
        const asistenciaData = await asistenciaRes.json();
        const sessionData = await sessionRes.json();
        
        setMiembros(miembrosData);
        // CORRECCIÓN: Aseguramos que los IDs sean de tipo numérico para una comparación correcta
        setAsistentes(new Set(asistenciaData.map(Number)));
        setSessionInfo(sessionData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCheckboxChange = (miembroId) => {
    setAsistentes(prevAsistentes => {
      const nuevosAsistentes = new Set(prevAsistentes);
      if (nuevosAsistentes.has(miembroId)) {
        nuevosAsistentes.delete(miembroId);
      } else {
        nuevosAsistentes.add(miembroId);
      }
      return nuevosAsistentes;
    });
  };

  // CORRECCIÓN: Función de envío restaurada y completa
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('Guardando...');
    try {
      const response = await fetch('http://localhost:4000/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_sesion: parseInt(id, 10),
          miembros: Array.from(asistentes)
        }),
      });
      if (!response.ok) throw new Error('No se pudo guardar la asistencia.');
      setMensaje('¡Asistencia guardada con éxito!');
      setTimeout(() => navigate('/sesiones'), 1500);
    } catch (err) {
      setError(err.message);
      setMensaje('');
    }
  };

  if (loading) return <p style={{textAlign: 'center', padding: '40px'}}>Cargando lista de miembros...</p>;
  if (error) return <p className="message-error">{error}</p>;

  return (
    <div>
      <h1 className="page-title">
        <FaUsers className="page-logo-icon"/> 
        Registrar Asistencia: {sessionInfo ? `"${sessionInfo.tema}"` : `Sesión #${id}`}
      </h1>
      <div className="content-section">
        <form onSubmit={handleSubmit}>
          <div className="asistencia-header">
            <p>Total de asistentes marcados: <strong>{asistentes.size} de {miembros.length}</strong></p>
          </div>
          
          <div className="table-responsive">
            <table className="miembros-table asistencia-table">
              <thead>
                <tr>
                  <th style={{width: '10%'}}>Asistió</th>
                  <th>Alias</th>
                  <th>Código Confidencial</th>
                </tr>
              </thead>
              <tbody>
                {miembros.map(miembro => (
                  <tr key={miembro.id_miembro} className={asistentes.has(miembro.id_miembro) ? 'fila-marcada' : ''} onClick={() => handleCheckboxChange(miembro.id_miembro)}>
                    <td className="checkbox-cell">
                      <div className="custom-checkbox">
                        {asistentes.has(miembro.id_miembro) && <FaCheck />}
                      </div>
                    </td>
                    <td>{miembro.alias}</td>
                    <td>{miembro.codigo_confidencial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            <button type="submit">
              <span>Guardar Asistencia</span>
            </button>
          </div>
        </form>

        {mensaje && <p className="message-success" style={{marginTop: '20px'}}>{mensaje}</p>}
      </div>
    </div>
  );
}

export default Asistencia;