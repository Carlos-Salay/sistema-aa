import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaUsers, FaUserShield, FaUser, FaLock, FaKey, FaUserSlash, FaUserCheck, FaPlus, FaCheckCircle, FaTimesCircle, FaChevronDown } from 'react-icons/fa';
import Modal from './Modal.jsx';
import { API_URL } from '../config.js';

const passwordRequirements = [
  { id: 0, text: "Al menos 8 caracteres", regex: /.{8,}/ },
  { id: 1, text: "Al menos una letra", regex: /[a-zA-Z]/ },
  { id: 2, text: "Al menos un número", regex: /\d/ }
];

function Usuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viendoInactivos, setViendoInactivos] = useState(false);
  const [modalCrear, setModalCrear] = useState({ isOpen: false, alias: '', password: '', confirmPassword: '', id_rol: '' });
  const [modalPassword, setModalPassword] = useState({ isOpen: false, usuario: null, newPassword: '', confirmPassword: '' });
  const [modalBaja, setModalBaja] = useState({ isOpen: false, usuario: null, activar: false });
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '' });
  const [passwordValidation, setPasswordValidation] = useState(passwordRequirements.map(req => ({ ...req, valid: false })));
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    const passwordToCheck = modalCrear.isOpen ? modalCrear.password : modalPassword.newPassword;
    setPasswordValidation(
      passwordRequirements.map(req => ({ ...req, valid: req.regex.test(passwordToCheck) }))
    );
  }, [modalCrear.password, modalPassword.newPassword, modalCrear.isOpen, modalPassword.isOpen]);
  
  const fetchData = async () => {
    const estado = viendoInactivos ? 'inactivos' : 'activos';
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/api/usuarios?estado=${estado}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/roles`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!usersRes.ok || !rolesRes.ok) throw new Error('No se pudieron cargar los datos.');

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      setUsuarios(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0) {
        setModalCrear(prev => ({ ...prev, id_rol: rolesData[0].id_rol }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viendoInactivos, token]);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    const { alias, password, confirmPassword, id_rol } = modalCrear;
    if (password !== confirmPassword) return alert('Las contraseñas no coinciden.');
    if (!passwordValidation.every(req => req.valid)) return alert('La contraseña no cumple los requisitos.');

    try {
      const res = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        // Ya no se envía correo_electronico
        body: JSON.stringify({ alias, password, id_rol }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
      setModalCrear({ isOpen: false, alias: '', password: '', confirmPassword: '', id_rol: roles.length > 0 ? roles[0].id_rol : '' });
      fetchData();
      setConfirmationModal({ isOpen: true, title: '¡Usuario Creado!', message: `El código de acceso para "${data.alias}" es: ${data.codigo_usuario}` });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    const { usuario, newPassword, confirmPassword } = modalPassword;
    if (newPassword !== confirmPassword) return alert('Las contraseñas no coinciden.');
    if (!passwordValidation.every(req => req.valid)) return alert('La contraseña no cumple los requisitos.');

    try {
      await fetch(`${API_URL}/api/usuarios/${usuario.id_usuario}/cambiar-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword }),
      });
      setModalPassword({ isOpen: false, usuario: null, newPassword: '', confirmPassword: '' });
      setConfirmationModal({ isOpen: true, title: 'Éxito', message: 'Contraseña actualizada.' });
    } catch (err) {
      alert('Error al cambiar la contraseña.');
    }
  };

  const handleEstadoChange = async () => {
    const { usuario, activar } = modalBaja;
    if (!usuario) return;
    try {
      await fetch(`${API_URL}/api/usuarios/${usuario.id_usuario}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id_estado: activar ? 1 : 2 }),
      });
      setModalBaja({ isOpen: false, usuario: null, activar: false });
      fetchData();
    } catch (err) {
      alert('No se pudo cambiar el estado del usuario.');
    }
  };

  return (
    <div>
      <h1 className="page-title"><FaUserShield className="page-logo-icon"/> Gestión de Usuarios</h1>
      <div className="content-section">
        <div className="table-controls">
          <div className="view-toggle">
            <button onClick={() => setViendoInactivos(false)} className={!viendoInactivos ? 'active' : ''}><span>Activos</span></button>
            <button onClick={() => setViendoInactivos(true)} className={viendoInactivos ? 'active' : ''}><span>Inactivos</span></button>
          </div>
          <button onClick={() => setModalCrear(prev => ({...prev, isOpen: true}))} className="add-button">
            <FaPlus /> <span>Agregar Usuario</span>
          </button>
        </div>

        {loading ? <p>Cargando...</p> : error ? <p className="message-error">{error}</p> : (
          <div className="table-responsive">
            <table className="miembros-table">
              <thead>
                <tr>
                  <th>Alias</th>
                  <th>Código de Usuario</th>
                  <th>Rol</th>
                  <th style={{textAlign: 'center'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id_usuario}>
                    <td>{usuario.alias}</td>
                    <td>{usuario.codigo_usuario}</td>
                    <td>{usuario.rol}</td>
                    <td>
                      <div className="acciones-cell">
                        <button onClick={() => { setIsPasswordFocused(false); setModalPassword({ isOpen: true, usuario, newPassword: '', confirmPassword: '' }); }} title="Cambiar Contraseña" className="action-icon-button"><FaKey /></button>
                        {usuario.id_estado === 1 ? (
                          <button onClick={() => setModalBaja({ isOpen: true, usuario, activar: false })} title="Dar de Baja" className="action-icon-button danger"><FaUserSlash /></button>
                        ) : (
                          <button onClick={() => setModalBaja({ isOpen: true, usuario, activar: true })} title="Reactivar Usuario" className="action-icon-button success"><FaUserCheck /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR USUARIO */}
      <Modal isOpen={modalCrear.isOpen} onClose={() => setModalCrear(prev => ({...prev, isOpen: false, alias: '', password: '', confirmPassword: ''}))} title="Crear Nuevo Usuario">
        <form onSubmit={handleCrearUsuario} className="modal-form">
          <div className="input-group"><FaUser className="input-icon" /><input type="text" placeholder="Alias" value={modalCrear.alias} onChange={e => setModalCrear(m => ({...m, alias: e.target.value}))} required /></div>
          <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Contraseña" value={modalCrear.password} onChange={e => setModalCrear(m => ({...m, password: e.target.value}))} onFocus={() => setIsPasswordFocused(true)} required /></div>
          {isPasswordFocused && modalCrear.isOpen && (
              <div className="password-requirements-registro">{passwordValidation.map(req => (<div key={req.id} className={`requirement ${req.valid ? 'valid' : ''}`}>{req.valid ? <FaCheckCircle/> : <FaTimesCircle/>}<span>{req.text}</span></div>))}</div>
          )}
          <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Confirmar Contraseña" value={modalCrear.confirmPassword} onChange={e => setModalCrear(m => ({...m, confirmPassword: e.target.value}))} required /></div>
          <div className="input-group select-group"><FaUserShield className="input-icon" /><select value={modalCrear.id_rol} onChange={e => setModalCrear(m => ({...m, id_rol: e.target.value}))} required>{roles.map(rol => (<option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>))}</select><FaChevronDown className="select-arrow" /></div>
          <div className="modal-actions">
            <button type="button" onClick={() => setModalCrear(prev => ({...prev, isOpen: false}))} className="button-secondary"><span>Cancelar</span></button>
            <button type="submit"><span>Crear Usuario</span></button>
          </div>
        </form>
      </Modal>

      {/* MODAL PARA CAMBIAR CONTRASEÑA */}
      <Modal isOpen={modalPassword.isOpen} onClose={() => setModalPassword({ isOpen: false, usuario: null })} title={`Cambiar Contraseña de ${modalPassword.usuario?.alias}`}>
        <form onSubmit={handleCambiarPassword} className="modal-form">
          <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Nueva Contraseña" value={modalPassword.newPassword} onChange={e => setModalPassword(p => ({...p, newPassword: e.target.value}))} onFocus={() => setIsPasswordFocused(true)} required /></div>
          {isPasswordFocused && modalPassword.isOpen && (
              <div className="password-requirements-registro">{passwordValidation.map(req => (<div key={req.id} className={`requirement ${req.valid ? 'valid' : ''}`}>{req.valid ? <FaCheckCircle/> : <FaTimesCircle/>}<span>{req.text}</span></div>))}</div>
          )}
          <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Confirmar Contraseña" value={modalPassword.confirmPassword} onChange={e => setModalPassword(p => ({...p, confirmPassword: e.target.value}))} required /></div>
          <div className="modal-actions">
            <button type="button" onClick={() => setModalPassword({ isOpen: false, usuario: null })} className="button-secondary"><span>Cancelar</span></button>
            <button type="submit"><span>Guardar</span></button>
          </div>
        </form>
      </Modal>

      {/* MODAL PARA ACTIVAR/DESACTIVAR */}
      <Modal isOpen={modalBaja.isOpen} onClose={() => setModalBaja({ isOpen: false, usuario: null })} title={modalBaja.activar ? "Reactivar Usuario" : "Dar de Baja Usuario"}>
        <p>¿Estás seguro de que quieres {modalBaja.activar ? 'reactivar' : 'dar de baja'} a <strong>{modalBaja.usuario?.alias}</strong>?</p>
        <div className="modal-actions">
            <button onClick={() => setModalBaja({ isOpen: false, usuario: null })} className="button-secondary"><span>Cancelar</span></button>
            <button onClick={handleEstadoChange} className={modalBaja.activar ? 'button-success' : 'button-danger'}><span>Sí, {modalBaja.activar ? 'Reactivar' : 'Dar de Baja'}</span></button>
        </div>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN GENERAL */}
      <Modal isOpen={confirmationModal.isOpen} onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '' })} title={confirmationModal.title}>
        <p>{confirmationModal.message}</p>
        <div className="modal-actions"><button onClick={() => setConfirmationModal({ isOpen: false, title: '', message: '' })}><span>Aceptar</span></button></div>
      </Modal>

    </div>
  );
}

export default Usuarios;