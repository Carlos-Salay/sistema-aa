import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaUsers, FaAward, FaKey, FaUserSlash, FaUserCheck, FaExclamationTriangle, FaUserFriends, FaChevronDown, FaLock, FaCheckCircle, FaTimesCircle, FaPlus, FaUser, FaCalendarAlt } from 'react-icons/fa';
import Modal from './Modal.jsx';

// Requisitos de la contraseña (para el modal)
const passwordRequirements = [
  { id: 0, text: "Al menos 8 caracteres", regex: /.{8,}/ },
  { id: 1, text: "Al menos una letra", regex: /[a-zA-Z]/ },
  { id: 2, text: "Al menos un número", regex: /\d/ }
];

// Lista corta de nombres de los Pasos
const nombrePasos = {
    1: "Paso 1: Rendición", 2: "Paso 2: Fe", 3: "Paso 3: Entrega",
    4: "Paso 4: Inventario", 5: "Paso 5: Admisión", 6: "Paso 6: Disposición",
    7: "Paso 7: Humildad", 8: "Paso 8: Enmiendas", 9: "Paso 9: Reparación",
    10: "Paso 10: Continuación", 11: "Paso 11: Meditación", 12: "Paso 12: Servicio"
};

function Miembros() {
  const { user, token } = useAuth(); // 1. Obtenemos el token del contexto
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viendoInactivos, setViendoInactivos] = useState(false);
  
  const [modalPadrino, setModalPadrino] = useState({ isOpen: false, miembro: null, padrinoId: '' });
  const [modalCrear, setModalCrear] = useState({ isOpen: false, alias: '', fecha_ingreso: '', fecha_sobriedad: '', password: '', confirmPassword: '' });
  const [modalPassword, setModalPassword] = useState({ isOpen: false, miembro: null, newPassword: '', confirmPassword: '' });
  const [modalBaja, setModalBaja] = useState({ isOpen: false, miembro: null, activar: false });
  const [modalRecaida, setModalRecaida] = useState({ isOpen: false, miembro: null });

  // Nuevos estados para la validación y confirmación de la contraseña
  const [passwordValidation, setPasswordValidation] = useState(passwordRequirements.map(req => ({ ...req, valid: false })));
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '' });

  // useEffect para validar la nueva contraseña en tiempo real
  useEffect(() => {
    if (modalPassword.isOpen || modalCrear.isOpen) {
      setPasswordValidation(
        passwordRequirements.map(req => ({ ...req, valid: req.regex.test(modalPassword.newPassword || modalCrear.password) }))
      );
    }
  }, [modalPassword.newPassword, modalPassword.isOpen, modalCrear.password, modalCrear.isOpen]);

  // --- LÓGICA FUNCIONAL ---
  const fetchMiembros = async () => {
    const estado = viendoInactivos ? 'inactivos' : 'activos';
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/api/miembros?estado=${estado}`);
      if (!res.ok) throw new Error('No se pudo obtener la lista de miembros.');
      const data = await res.json();
      setMiembros(data);
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };
  
  useEffect(() => { fetchMiembros(); }, [viendoInactivos]);

  const handlePasoChange = async (miembroId, nuevoPaso) => {
    try {
      const res = await fetch(`http://localhost:4000/api/miembros/${miembroId}/paso`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paso_actual: nuevoPaso }),
      });
      if (!res.ok) throw new Error('No se pudo guardar el paso.');
      setMiembros(m => m.map(mi => mi.id_miembro === miembroId ? { ...mi, paso_actual: nuevoPaso } : mi));
    } catch (err) { alert(err.message); }
  };

  const handleCrearMiembro = async (e) => {
    e.preventDefault();
    const { alias, fecha_ingreso, fecha_sobriedad, password, confirmPassword } = modalCrear;
    const isPasswordValid = passwordValidation.every(req => req.valid);

    if (password !== confirmPassword) {
      return setConfirmationModal({ isOpen: true, title: 'Error', message: 'Las contraseñas no coinciden.' });
    }
    if (!isPasswordValid) {
      return setConfirmationModal({ isOpen: true, title: 'Contraseña Débil', message: 'La contraseña no cumple los requisitos de seguridad.' });
    }

    try {
      const res = await fetch(`http://localhost:4000/api/miembros`, {
        method: 'POST',
        headers: { // 2. Añadimos el token a las cabeceras
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ alias, fecha_ingreso, fecha_sobriedad, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'No se pudo crear el miembro.');
      }

      setModalCrear({ isOpen: false, alias: '', fecha_ingreso: '', fecha_sobriedad: '', password: '', confirmPassword: '' });
      setConfirmationModal({ isOpen: true, title: 'Éxito', message: 'Nuevo miembro registrado correctamente.' });
      fetchMiembros(); // Recargamos la lista
    } catch (err) {
      setConfirmationModal({ isOpen: true, title: 'Error', message: err.message });
    }
  };
  
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    const { miembro, newPassword, confirmPassword } = modalPassword;
    const isPasswordValid = passwordValidation.every(req => req.valid);

    if (newPassword !== confirmPassword) {
      return setConfirmationModal({ isOpen: true, title: 'Error', message: 'Las contraseñas no coinciden.' });
    }
    if (!isPasswordValid) {
      return setConfirmationModal({ isOpen: true, title: 'Contraseña Débil', message: 'La nueva contraseña no cumple los requisitos de seguridad.' });
    }

    try {
      await fetch(`http://localhost:4000/api/miembros/${miembro.id_miembro}/cambiar-password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }),
      });
      setModalPassword({ isOpen: false, miembro: null, newPassword: '', confirmPassword: '' });
      setConfirmationModal({ isOpen: true, title: 'Éxito', message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      setConfirmationModal({ isOpen: true, title: 'Error', message: 'No se pudo cambiar la contraseña.' });
    }
  };

  const handleEstadoChange = async () => {
    if (!modalBaja.miembro) return;
    const nuevoEstado = modalBaja.activar ? 1 : 2;
    try {
      await fetch(`http://localhost:4000/api/miembros/${modalBaja.miembro.id_miembro}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_estado: nuevoEstado }),
      });
      setModalBaja({ isOpen: false, miembro: null, activar: false });
      fetchMiembros();
    } catch (err) { alert("No se pudo cambiar el estado del miembro."); }
  };

  const handleGuardarPadrino = async () => {
    if (!modalPadrino.miembro) return;
    try {
      await fetch(`http://localhost:4000/api/miembros/${modalPadrino.miembro.id_miembro}/padrino`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idPadrino: modalPadrino.padrinoId }),
      });
      setModalPadrino({ isOpen: false, miembro: null, padrinoId: '' });
      fetchMiembros();
    } catch (err) { alert("No se pudo asignar el padrino."); }
  };
  
  const handleRegistrarRecaida = async () => {
    if (!modalRecaida.miembro) return;
    try {
      await fetch(`http://localhost:4000/api/miembros/${modalRecaida.miembro.id_miembro}/recaida`, { method: 'PUT' });
      setModalRecaida({ isOpen: false, miembro: null });
      fetchMiembros();
    } catch (err) { alert("No se pudo registrar la recaída."); }
  };
  
  const renderLogro = (dias) => {
    if (dias === null || dias < 15) return null;
    if (dias >= 365) return <span title="1 Año o más" className="logro-icon"><FaAward /></span>;
    if (dias >= 15) return <span title="15 Días" className="logro-icon"><FaAward /></span>;
    return null;
  };

  if (loading) return <p>Cargando miembros...</p>;
  if (error) return <p className="message-error">Error: {error}</p>;

  return (
    <div>
      <h1 className="page-title"><FaUsers className="page-logo-icon"/> Miembros Registrados</h1>
      <div className="content-section">
        <div className="table-controls">
          <div className="view-toggle">
            <button onClick={() => setViendoInactivos(false)} className={!viendoInactivos ? 'active' : ''}><span>Activos</span></button>
            <button onClick={() => setViendoInactivos(true)} className={viendoInactivos ? 'active' : ''}><span>Inactivos</span></button>
          </div>
          <button onClick={() => setModalCrear({ isOpen: true, alias: '', fecha_ingreso: '', fecha_sobriedad: '', password: '', confirmPassword: '' })} className="add-button">
            <FaPlus /> <span>Agregar Miembro</span>
          </button>
        </div>
        <div className="table-responsive">
          <table className="miembros-table">
            <thead>
              <tr>
                <th style={{width: "5%"}}>Logro</th>
                <th>Alias</th>
                <th>Cód. Confidencial</th>
                <th>Padrino</th>
                <th>Días de Sobriedad</th>
                <th>Paso Actual</th>
                <th style={{textAlign: 'center'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((miembro) => (
                <tr key={miembro.id_miembro}>
                  <td style={{textAlign: 'center'}}>{renderLogro(Math.floor(miembro.dias_sobriedad))}</td>
                  <td>{miembro.alias}</td>
                  <td>{miembro.codigo_confidencial}</td>
                  <td>{miembro.nombre_padrino || <span className="text-secondary">No asignado</span>}</td>
                  <td className="dias-sobriedad">{miembro.dias_sobriedad !== null ? `${Math.floor(miembro.dias_sobriedad)} días` : 'N/A'}</td>
                  <td>
                    <div className="select-group paso-select-group">
                      <select className="paso-select" value={miembro.paso_actual || 1} onChange={(e) => handlePasoChange(miembro.id_miembro, e.target.value)}>
                        {Object.entries(nombrePasos).map(([num, nombre]) => (<option key={num} value={num}>{nombre}</option>))}
                      </select>
                      <FaChevronDown className="select-arrow" />
                    </div>
                  </td>
                  <td>
                    <div className="acciones-cell">
                      <button onClick={() => setModalPadrino({ isOpen: true, miembro, padrinoId: miembro.id_padrino || '' })} title="Asignar Padrino" className="action-icon-button"><FaUserFriends /></button>
                      <button onClick={() => setModalRecaida({ isOpen: true, miembro })} title="Registrar Recaída" className="action-icon-button warning"><FaExclamationTriangle /></button>
                      <button onClick={() => { setIsPasswordFocused(false); setModalPassword({ isOpen: true, miembro, newPassword: '', confirmPassword: '' }); }} title="Cambiar Contraseña" className="action-icon-button"><FaKey /></button>
                      {user.rol === 'Administrador' && (miembro.id_estado === 1 ? (<button onClick={() => setModalBaja({ isOpen: true, miembro, activar: false })} title="Dar de Baja" className="action-icon-button danger"><FaUserSlash /></button>) : (<button onClick={() => setModalBaja({ isOpen: true, miembro, activar: true })} title="Reactivar Miembro" className="action-icon-button success"><FaUserCheck /></button>))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- Modales --- */}
      <Modal
        isOpen={modalCrear.isOpen}
        onClose={() => setModalCrear({ isOpen: false })}
        title="Registrar Nuevo Miembro"
      >
        <form onSubmit={handleCrearMiembro} className="modal-form">
          <div className="input-group">
            <FaUser className="input-icon" />
            <input type="text" placeholder="Alias del miembro" value={modalCrear.alias} onChange={e => setModalCrear(m => ({...m, alias: e.target.value}))} required />
          </div>
          <div className="input-group">
            <FaCalendarAlt className="input-icon" />
            <input type="date" title="Fecha de Ingreso" value={modalCrear.fecha_ingreso} onChange={e => setModalCrear(m => ({...m, fecha_ingreso: e.target.value}))} required />
          </div>
          <div className="input-group">
            <FaCalendarAlt className="input-icon" />
            <input type="date" title="Fecha de Sobriedad" value={modalCrear.fecha_sobriedad} onChange={e => setModalCrear(m => ({...m, fecha_sobriedad: e.target.value}))} required />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" placeholder="Contraseña" value={modalCrear.password} onChange={e => setModalCrear(m => ({...m, password: e.target.value}))} onFocus={() => setIsPasswordFocused(true)} required />
          </div>
          {isPasswordFocused && (
            <div className="password-requirements-registro">
              {passwordValidation.map(req => (
                <div key={req.id} className={`requirement ${req.valid ? 'valid' : ''}`}>
                  {req.valid ? <FaCheckCircle/> : <FaTimesCircle/>}
                  <span>{req.text}</span>
                </div>
              ))}
            </div>
          )}
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" placeholder="Confirmar Contraseña" value={modalCrear.confirmPassword} onChange={e => setModalCrear(m => ({...m, confirmPassword: e.target.value}))} required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setModalCrear({ isOpen: false })} className="button-secondary"><span>Cancelar</span></button>
            <button type="submit"><span>Registrar Miembro</span></button>
          </div>
        </form>
      </Modal>


      <Modal 
        isOpen={modalPassword.isOpen} 
        onClose={() => setModalPassword({ isOpen: false, miembro: null })}
        title={`Cambiar Contraseña de ${modalPassword.miembro?.alias}`}
      >
        <form onSubmit={handleCambiarPassword} className="modal-form">
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" placeholder="Nueva Contraseña" value={modalPassword.newPassword} onChange={e => setModalPassword(p => ({...p, newPassword: e.target.value}))} onFocus={() => setIsPasswordFocused(true)} required />
          </div>
          {isPasswordFocused && (
            <div className="password-requirements-registro">
              {passwordValidation.map(req => (
                <div key={req.id} className={`requirement ${req.valid ? 'valid' : ''}`}>
                  {req.valid ? <FaCheckCircle/> : <FaTimesCircle/>}
                  <span>{req.text}</span>
                </div>
              ))}
            </div>
          )}
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" placeholder="Confirmar Contraseña" value={modalPassword.confirmPassword} onChange={e => setModalPassword(p => ({...p, confirmPassword: e.target.value}))} required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setModalPassword({ isOpen: false, miembro: null })} className="button-secondary"><span>Cancelar</span></button>
            <button type="submit"><span>Guardar Contraseña</span></button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={confirmationModal.isOpen} onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '' })} title={confirmationModal.title}>
        <p>{confirmationModal.message}</p>
        <div className="modal-actions"><button onClick={() => setConfirmationModal({ isOpen: false, title: '', message: '' })}><span>Aceptar</span></button></div>
      </Modal>
      
      <Modal 
        isOpen={modalPadrino.isOpen} 
        onClose={() => setModalPadrino({ isOpen: false, miembro: null })} 
        title={`Asignar Padrino a ${modalPadrino.miembro?.alias}`}
      >
        <div className="form-group">
          <label>Selecciona un padrino:</label>
          <select value={modalPadrino.padrinoId} onChange={(e) => setModalPadrino(p => ({...p, padrinoId: e.target.value}))}>
            <option value="">-- Quitar Padrino --</option>
            {miembros.filter(p => p.id_miembro !== modalPadrino.miembro?.id_miembro).map(padrino => (
                <option key={padrino.id_miembro} value={padrino.id_miembro}>{padrino.alias}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
            <button onClick={() => setModalPadrino({ isOpen: false, miembro: null })} className="button-secondary"><span>Cancelar</span></button>
            <button onClick={handleGuardarPadrino}><span>Guardar Cambios</span></button>
        </div>
      </Modal>
      
      <Modal 
        isOpen={modalRecaida.isOpen} 
        onClose={() => setModalRecaida({ isOpen: false, miembro: null })} 
        title="Registrar Recaída"
      >
        <p>¿Estás seguro de que quieres reiniciar la fecha de sobriedad de <strong>{modalRecaida.miembro?.alias}</strong> a la fecha de hoy? Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
            <button onClick={() => setModalRecaida({ isOpen: false, miembro: null })} className="button-secondary"><span>Cancelar</span></button>
            <button onClick={handleRegistrarRecaida} className="button-danger"><span>Sí, registrar</span></button>
        </div>
      </Modal>
      
      <Modal 
        isOpen={modalBaja.isOpen} 
        onClose={() => setModalBaja({ isOpen: false, miembro: null })} 
        title={modalBaja.activar ? "Reactivar Miembro" : "Dar de Baja Miembro"}
      >
        <p>¿Estás seguro de que quieres {modalBaja.activar ? 'reactivar' : 'dar de baja'} a <strong>{modalBaja.miembro?.alias}</strong>?</p>
        <div className="modal-actions">
            <button onClick={() => setModalBaja({ isOpen: false, miembro: null })} className="button-secondary"><span>Cancelar</span></button>
            <button onClick={handleEstadoChange} className={modalBaja.activar ? 'button-success' : 'button-danger'}>
                <span>Sí, {modalBaja.activar ? 'Reactivar' : 'Dar de Baja'}</span>
            </button>
        </div>
      </Modal>
    </div>
  );
}
export default Miembros;