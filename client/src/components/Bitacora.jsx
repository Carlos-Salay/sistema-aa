// client/src/components/Bitacora.jsx
import React, { useState, useEffect } from 'react';
import { FaBook } from 'react-icons/fa';
import { API_URL } from '../config.js';

function Bitacora() {
  const [miembros, setMiembros] = useState([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState('');
  const [entradas, setEntradas] = useState([]);
  const [nuevaEntrada, setNuevaEntrada] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carga la lista de todos los miembros para el menú desplegable
  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const response = await fetch('${API_URL}/api/miembros?estado=todos');
        const data = await response.json();
        setMiembros(data);
      } catch (err) {
        setError('No se pudo cargar la lista de miembros.');
      } finally {
        setLoading(false);
      }
    };
    fetchMiembros();
  }, []);

  // Carga las entradas de la bitácora cuando se selecciona un miembro
  useEffect(() => {
    if (!miembroSeleccionado) {
      setEntradas([]);
      return;
    }
    const fetchEntradas = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/bitacora/${miembroSeleccionado}`);
        const data = await response.json();
        setEntradas(data);
      } catch (err) {
        setError('No se pudo cargar la bitácora de este miembro.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntradas();
  }, [miembroSeleccionado]);

  // Guarda una nueva entrada en la bitácora
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaEntrada.trim()) return;

    try {
      const response = await fetch('${API_URL}/api/bitacora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_miembro: miembroSeleccionado,
          reflexion: nuevaEntrada,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar la entrada.');
      
      const nuevaEntradaGuardada = await response.json();
      // Añade la nueva entrada al principio de la lista visible
      setEntradas([nuevaEntradaGuardada, ...entradas]);
      setNuevaEntrada(''); // Limpia el área de texto
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && miembros.length === 0) return <p>Cargando...</p>;

  return (
    <div>
      <h1 className="page-title"><FaBook className="page-logo-icon" /> Bitácora Personal</h1>
      
      <div className="content-section">
        <h2>Seleccionar Miembro</h2>
        <p>Como aún no tenemos login de miembros, selecciona uno para ver su bitácora.</p>
        <select 
          value={miembroSeleccionado} 
          onChange={(e) => setMiembroSeleccionado(e.target.value)}
        >
          <option value="">-- Elige un miembro --</option>
          {miembros.map(miembro => (
            <option key={miembro.id_miembro} value={miembro.id_miembro}>
              {miembro.alias} ({miembro.codigo_confidencial})
            </option>
          ))}
        </select>
      </div>

      {/* Solo muestra el resto si se ha seleccionado un miembro */}
      {miembroSeleccionado && (
        <>
          <div className="content-section" style={{ marginTop: '30px' }}>
            <h2>Nueva Entrada</h2>
            <form onSubmit={handleSubmit}>
              <textarea
                rows="5"
                placeholder="Escribe tu reflexión de hoy..."
                value={nuevaEntrada}
                onChange={(e) => setNuevaEntrada(e.target.value)}
              ></textarea>
              <button type="submit">Guardar Entrada</button>
            </form>
          </div>

          <div className="content-section" style={{ marginTop: '30px' }}>
            <h2>Entradas Anteriores</h2>
            {loading ? <p>Cargando...</p> : (
              entradas.length > 0 ? (
                entradas.map(entrada => (
                  <div key={entrada.id_bitacora} className="bitacora-entry">
                    {/* Recuerda que este campo está 'cifrado' en la DB, pero lo desciframos en el backend */}
                    <p>{entrada.reflexion_cifrada}</p> 
                    <small>{new Date(entrada.fecha_registro).toLocaleDateString('es-ES')}</small>
                  </div>
                ))
              ) : (
                <p>Este miembro aún no tiene entradas en su bitácora.</p>
              )
            )}
          </div>
        </>
      )}
      {error && <p className="message-error">{error}</p>}
    </div>
  );
}

export default Bitacora;