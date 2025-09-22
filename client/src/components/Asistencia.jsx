import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';

function Asistencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [miembros, setMiembros] = useState([]);
  const [asistentes, setAsistentes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const miembrosRes = await fetch('http://localhost:4000/api/miembros');
        if (!miembrosRes.ok) throw new Error('Error al cargar la lista de miembros.');
        const miembrosData = await miembrosRes.json();
        setMiembros(miembrosData);

        const asistenciaRes = await fetch(`http://localhost:4000/api/asistencia/${id}`);
        if (!asistenciaRes.ok) throw new Error('Error al cargar la asistencia previa.');
        const asistenciaData = await asistenciaRes.json();
        setAsistentes(new Set(asistenciaData));

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

  if (loading) return <p>Cargando lista de miembros...</p>;
  if (error) return <p className="message-error">{error}</p>;

  return (
    <div>
      <h1 className="page-title"><FaUsers className="page-logo-icon"/> Registrar Asistencia de la Sesión #{id}</h1>
      <div className="content-section" style={{maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto'}}>
        <form onSubmit={handleSubmit}>
          
          <div className="asistencia-header">
            <p>Total de asistentes marcados: <strong>{asistentes.size} de {miembros.length}</strong></p>
          </div>
          
          <table className="asistencia-table">
            <thead>
              <tr>
                <th style={{width: '10%'}}>Asistió</th>
                <th>Alias</th>
                <th>Código Confidencial</th>
              </tr>
            </thead>
            <tbody>
              {miembros.map(miembro => (
                <tr key={miembro.id_miembro} className={asistentes.has(miembro.id_miembro) ? 'fila-marcada' : ''}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="asistencia-checkbox"
                      checked={asistentes.has(miembro.id_miembro)}
                      onChange={() => handleCheckboxChange(miembro.id_miembro)}
                    />
                  </td>
                  <td>{miembro.alias}</td>
                  <td>{miembro.codigo_confidencial}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="submit" className="submit-button-asistencia">
            Guardar Asistencia
          </button>
        </form>

        {mensaje && <p className="message-success">{mensaje}</p>}
        {error && <p className="message-error">{error}</p>}
      </div>
    </div>
  );
}

export default Asistencia;