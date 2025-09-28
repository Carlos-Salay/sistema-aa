import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaBookMedical, FaFeatherAlt } from 'react-icons/fa';

function MemberBitacora() {
  const { user } = useAuth();
  const [entradas, setEntradas] = useState([]);
  const [nuevaEntrada, setNuevaEntrada] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- LÓGICA DE DATOS (sin cambios) ---
  useEffect(() => {
    if (!user) return;
    const fetchEntradas = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/bitacora/${user.id}`);
        const data = await response.json();
        setEntradas(data);
      } catch (err) {
        setError('No se pudo cargar tu bitácora.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntradas();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaEntrada.trim()) return;
    try {
      const response = await fetch('http://localhost:4000/api/bitacora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_miembro: user.id, reflexion: nuevaEntrada }),
      });
      if (!response.ok) throw new Error('Error al guardar la entrada.');
      const nuevaEntradaGuardada = await response.json();
      setEntradas([nuevaEntradaGuardada, ...entradas]);
      setNuevaEntrada('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title"><FaBookMedical className="page-logo-icon" /> Mi Bitácora Personal</h1>
      
      <div className="content-section">
        <h2 className="section-title"><FaFeatherAlt /> Nueva Entrada</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              rows="6"
              placeholder="Escribe aquí tus reflexiones del día, tus logros o tus desafíos..."
              value={nuevaEntrada}
              onChange={(e) => setNuevaEntrada(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="form-actions">
            <button type="submit"><span>Guardar Reflexión</span></button>
          </div>
        </form>
      </div>

      <div className="content-section">
        <h2 className="section-title">Mis Entradas Anteriores</h2>
        {loading && <p>Cargando...</p>}
        {error && <p className="message-error">{error}</p>}
        
        {!loading && entradas.length > 0 ? (
          <div className="bitacora-list">
            {entradas.map(entrada => (
              <div key={entrada.id_bitacora} className="bitacora-entry">
                <p>{entrada.reflexion}</p>
                <small>{new Date(entrada.fecha_registro).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
              </div>
            ))}
          </div>
        ) : (
          !loading && <p>Aún no tienes entradas en tu bitácora. ¡Anímate a escribir la primera!</p>
        )}
      </div>
    </div>
  );
}

export default MemberBitacora;