import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaUsers, FaAward, FaKey, FaUserSlash, FaUserCheck, FaExclamationTriangle } from 'react-icons/fa';
import Modal from './Modal.jsx';

// Diccionario con la descripción de los 12 Pasos
const descripcionPasos = {
    1: "Admitir: la impotencia ante el alcohol y la vida ingobernable.",
    2: "Creer: que un Poder Superior puede devolver la salud mental.",
    3: "Decidir: confiar la voluntad y la vida al cuidado de un Poder Superior.",
    4: "Hacer: un inventario moral sincero y completo de sí mismo.",
    5: "Admitir: la naturaleza exacta de las faltas ante Dios, uno mismo y otro ser humano.",
    6: "Estar: enteramente dispuesto a que Dios elimine los defectos de carácter.",
    7: "Pedir: humildemente que se eliminen las fallas y culpas.",
    8: "Hacer: una lista de todas las personas perjudicadas y estar dispuesto a reparar el daño.",
    9: "Reparar: directamente el daño causado cuando sea posible.",
    10: "Continuar: el examen de conciencia y admitir las faltas al momento de reconocerlas.",
    11: "Buscar: mejorar el contacto consciente con Dios mediante la oración y la meditación.",
    12: "Llevar: el mensaje a otros alcohólicos y practicar estos principios en todas las actividades."
};

function Miembros() {
  const { user } = useAuth();
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateStatus, setUpdateStatus] = useState({ id: null, message: '', type: '' });
  const [viendoInactivos, setViendoInactivos] = useState(false);
  
  const [modalPadrino, setModalPadrino] = useState({ isOpen: false, miembro: null, padrinoId: '' });
  const [modalPassword, setModalPassword] = useState({ isOpen: false, miembro: null, newPassword: '', confirmPassword: '' });
  const [modalBaja, setModalBaja] = useState({ isOpen: false, miembro: null, activar: false });
  const [modalRecaida, setModalRecaida] = useState({ isOpen: false, miembro: null });

  const fetchMiembros = async () => {
    const estado = viendoInactivos ? 'inactivos' : 'activos';
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/miembros?estado=${estado}`);
      if (!response.ok) throw new Error('No se pudo obtener la lista de miembros.');
      const data = await response.json();
      setMiembros(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMiembros();
  }, [viendoInactivos]);

  const handlePasoChange = async (miembroId, nuevoPaso) => {
    setUpdateStatus({ id: miembroId, message: '', type: '' });
    try {
      const response = await fetch(`http://localhost:4000/api/miembros/${miembroId}/paso`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paso_actual: nuevoPaso }),
      });
      if (!response.ok) throw new Error('No se pudo guardar.');

      setMiembros(miembrosActuales =>
        miembrosActuales.map(miembro =>
          miembro.id_miembro === miembroId ? { ...miembro, paso_actual: nuevoPaso } : miembro
        )
      );
      setUpdateStatus({ id: miembroId, message: '✅ Guardado', type: 'success' });
    } catch (err) {
      setUpdateStatus({ id: miembroId, message: '❌ Error', type: 'error' });
    } finally {
      setTimeout(() => setUpdateStatus({ id: null, message: '', type: '' }), 2000);
    }
  };
  
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    const { miembro, newPassword, confirmPassword } = modalPassword;
    if (newPassword !== confirmPassword) return alert("Las contraseñas no coinciden.");
    try {
      await fetch(`http://localhost:4000/api/miembros/${miembro.id_miembro}/cambiar-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      setModalPassword({ isOpen: false, miembro: null, newPassword: '', confirmPassword: '' });
      alert("Contraseña actualizada con éxito.");
    } catch (err) {
      alert("No se pudo cambiar la contraseña.");
    }
  };

  const handleEstadoChange = async () => {
    if (!modalBaja.miembro) return;
    const nuevoEstado = modalBaja.activar ? 1 : 2; // 1 para Activo, 2 para Inactivo
    try {
      await fetch(`http://localhost:4000/api/miembros/${modalBaja.miembro.id_miembro}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_estado: nuevoEstado }),
      });
      setModalBaja({ isOpen: false, miembro: null, activar: false });
      fetchMiembros();
    } catch (err) {
      alert("No se pudo cambiar el estado del miembro.");
    }
  };

  const handleGuardarPadrino = async () => {
    if (!modalPadrino.miembro) return;
    try {
      await fetch(`http://localhost:4000/api/miembros/${modalPadrino.miembro.id_miembro}/padrino`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPadrino: modalPadrino.padrinoId }),
      });
      setModalPadrino({ isOpen: false, miembro: null, padrinoId: '' });
      fetchMiembros();
    } catch (err) {
      alert("No se pudo asignar el padrino.");
    }
  };
  
  const handleRegistrarRecaida = async () => {
    if (!modalRecaida.miembro) return;
    try {
      await fetch(`http://localhost:4000/api/miembros/${modalRecaida.miembro.id_miembro}/recaida`, {
        method: 'PUT',
      });
      setModalRecaida({ isOpen: false, miembro: null });
      fetchMiembros();
    } catch (err) {
      alert("No se pudo registrar la recaída.");
    }
  };
  
  const renderLogro = (dias) => {
    if (dias === null || dias < 15) return null;
    if (dias >= 365) return <span title="1 Año o más" className="logro-icon oro"><FaAward /></span>;
    if (dias >= 150) return <span title="150 Días" className="logro-icon plata"><FaAward /></span>;
    if (dias >= 90) return <span title="90 Días" className="logro-icon bronce"><FaAward /></span>;
    if (dias >= 60) return <span title="60 Días" className="logro-icon"><FaAward /></span>;
    if (dias >= 30) return <span title="30 Días" className="logro-icon"><FaAward /></span>;
    if (dias >= 15) return <span title="15 Días" className="logro-icon"><FaAward /></span>;
    return null;
  };

  if (loading) return <p>Cargando miembros...</p>;
  if (error) return <p className="message-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title"><FaUsers className="page-logo-icon"/> Miembros Registrados</h1>
      <div className="content-section">
        <div className="view-toggle">
            <button onClick={() => setViendoInactivos(false)} className={!viendoInactivos ? 'active' : ''}>Ver Activos</button>
            <button onClick={() => setViendoInactivos(true)} className={viendoInactivos ? 'active' : ''}>Ver Inactivos</button>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: '5%', textAlign: 'center' }}>Logro</th>
              <th>Alias</th>
              <th>Cód. Confidencial</th>
              <th>Padrino</th>
              <th>Días de Sobriedad</th>
              <th>Paso Actual</th>
              <th style={{width: '25%'}}>Acciones</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {miembros.map((miembro) => {
              return (
                <tr key={miembro.id_miembro}>
                  <td style={{ textAlign: 'center', fontSize: '1.3rem' }}>{renderLogro(Math.floor(miembro.dias_sobriedad))}</td>
                  <td>{miembro.alias}</td>
                  <td>{miembro.codigo_confidencial}</td>
                  <td>{miembro.nombre_padrino || <span style={{color: 'var(--text-secondary)'}}>No asignado</span>}</td>
                  <td className="dias-sobriedad">{miembro.dias_sobriedad !== null ? `${Math.floor(miembro.dias_sobriedad)} días` : 'N/A'}</td>
                  <td>
                    <select value={miembro.paso_actual || 1} onChange={(e) => handlePasoChange(miembro.id_miembro, e.target.value)}>
                      {[...Array(12).keys()].map(num => (
                        <option key={num + 1} value={num + 1}>
                          Paso {num + 1}: {descripcionPasos[num + 1]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="acciones-cell">
                      <button onClick={() => setModalPadrino({ isOpen: true, miembro, padrinoId: miembro.id_padrino || '' })} title="Asignar Padrino">Padrino</button>
                      <button className="recaida-button" onClick={() => setModalRecaida({ isOpen: true, miembro })} title="Reiniciar Días de Sobriedad"><FaExclamationTriangle /></button>
                      <button className="password-button" onClick={() => setModalPassword({ isOpen: true, miembro })} title="Cambiar Contraseña"><FaKey /></button>
                      {user.rol === 'Administrador' && (
                        miembro.id_estado === 1 ? (
                          <button className="baja-button" onClick={() => setModalBaja({ isOpen: true, miembro, activar: false })} title="Dar de Baja"><FaUserSlash /></button>
                        ) : (
                          <button className="alta-button" onClick={() => setModalBaja({ isOpen: true, miembro, activar: true })} title="Reactivar Miembro"><FaUserCheck /></button>
                        )
                      )}
                    </div>
                  </td>
                  <td>{updateStatus.id === miembro.id_miembro && (<span className={`status-${updateStatus.type}`}>{updateStatus.message}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* --- Modales --- */}
      <Modal 
        isOpen={modalPassword.isOpen} 
        onClose={() => setModalPassword({ isOpen: false, miembro: null, newPassword: '', confirmPassword: '' })}
        title={`Cambiar Contraseña de ${modalPassword.miembro?.alias}`}
      >
        <form onSubmit={handleCambiarPassword}>
          <div className="form-group">
            <label>Nueva Contraseña:</label>
            <input type="password" value={modalPassword.newPassword} onChange={e => setModalPassword(p => ({...p, newPassword: e.target.value}))} required />
          </div>
          <div className="form-group">
            <label>Confirmar Contraseña:</label>
            <input type="password" value={modalPassword.confirmPassword} onChange={e => setModalPassword(p => ({...p, confirmPassword: e.target.value}))} required />
          </div>
          <button type="submit">Guardar Contraseña</button>
        </form>
      </Modal>

      <Modal 
        isOpen={modalBaja.isOpen} 
        onClose={() => setModalBaja({ isOpen: false, miembro: null, activar: false })} 
        title={modalBaja.activar ? "Reactivar Miembro" : "Dar de Baja Miembro"}
      >
        <p>¿Estás seguro de que quieres {modalBaja.activar ? 'reactivar' : 'dar de baja'} a <strong>{modalBaja.miembro?.alias}</strong>?</p>
        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px'}}>
            <button onClick={() => setModalBaja({ isOpen: false, miembro: null, activar: false })}>Cancelar</button>
            <button onClick={handleEstadoChange} className="baja-button-confirm">{modalBaja.activar ? 'Sí, Reactivar' : 'Sí, Dar de Baja'}</button>
        </div>
      </Modal>

      <Modal 
        isOpen={modalPadrino.isOpen} 
        onClose={() => setModalPadrino({ isOpen: false, miembro: null, padrinoId: '' })} 
        title={`Asignar Padrino a ${modalPadrino.miembro?.alias}`}
      >
        <div className="form-group">
          <label>Selecciona un padrino:</label>
          <select value={modalPadrino.padrinoId} onChange={(e) => setModalPadrino(p => ({...p, padrinoId: e.target.value}))}>
            <option value="">-- Quitar Padrino --</option>
            {miembros
              .filter(p => p.id_miembro !== modalPadrino.miembro?.id_miembro)
              .map(padrinoPotencial => (
                <option key={padrinoPotencial.id_miembro} value={padrinoPotencial.id_miembro}>
                  {padrinoPotencial.alias} ({padrinoPotencial.codigo_confidencial})
                </option>
              ))
            }
          </select>
        </div>
        <button onClick={handleGuardarPadrino} style={{ width: '100%', marginTop: '20px' }}>Guardar Cambios</button>
      </Modal>
      
      <Modal 
        isOpen={modalRecaida.isOpen} 
        onClose={() => setModalRecaida({ isOpen: false, miembro: null })} 
        title="Registrar Recaída"
      >
        <p>¿Estás seguro de que quieres reiniciar la fecha de sobriedad de <strong>{modalRecaida.miembro?.alias}</strong> a la fecha de hoy?</p>
        <p>Esta acción no se puede deshacer.</p>
        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px'}}>
            <button onClick={() => setModalRecaida({ isOpen: false, miembro: null })}>Cancelar</button>
            <button onClick={handleRegistrarRecaida} className="recaida-button-confirm">Sí, registrar</button>
        </div>
      </Modal>
    </div>
  );
}

export default Miembros;