import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaCheckCircle, FaTimesCircle, FaUser, FaLock, FaCalendarAlt } from 'react-icons/fa';
import Modal from './Modal.jsx';
import loginImage from '../logos/registro.png'; // Reusamos una imagen para el panel derecho

// Requisitos de la contraseña (sin cambios)
const passwordRequirements = [
  { id: 0, text: "Al menos 8 caracteres", regex: /.{8,}/ },
  { id: 1, text: "Al menos una letra", regex: /[a-zA-Z]/ },
  { id: 2, text: "Al menos un número", regex: /\d/ }
];

function Registro() {
  // Lógica de estado y validación (sin cambios)
  const [formData, setFormData] = useState({
    alias: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_sobriedad: new Date().toISOString().split('T')[0],
    password: '',
    confirmPassword: ''
  });
  const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: null });
  const [passwordValidation, setPasswordValidation] = useState(passwordRequirements.map(req => ({ ...req, valid: false })));
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  useEffect(() => { setPasswordValidation(passwordRequirements.map(req => ({ ...req, valid: req.regex.test(formData.password) }))) }, [formData.password]);
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleSubmit = async (e) => { /* ...Lógica de envío sin cambios... */ };

  return (
    // 1. Usamos los mismos contenedores que el login para consistencia
    <div className="login-page-container">
      <div className="login-card-split">
        
        {/* === Columna Izquierda: Formulario de Registro === */}
        <div className="login-form-section">
          <h2 className="login-title-split">Registro</h2>
          <p className="login-subtitle">Crea una nueva cuenta de miembro.</p>
          
          <form onSubmit={handleSubmit} className="registro-form">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input type="text" id="alias" name="alias" placeholder="Alias del miembro" value={formData.alias} onChange={handleChange} required />
            </div>

            <div className="form-grid-double">
              <div className="input-group">
                <FaCalendarAlt className="input-icon" />
                <input type="date" id="fecha_ingreso" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <FaCalendarAlt className="input-icon" />
                <input type="date" id="fecha_sobriedad" name="fecha_sobriedad" value={formData.fecha_sobriedad} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input type="password" id="password" name="password" placeholder="Crear contraseña" value={formData.password} onChange={handleChange} onFocus={() => setIsPasswordFocused(true)} required />
            </div>
            
            <div className="input-group">
              <FaLock className="input-icon" />
              <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirmar contraseña" value={formData.confirmPassword} onChange={handleChange} required />
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
            
            <button type="submit" className="login-button-primary">
              <span>Registrar Miembro</span>
            </button>
          </form>
        </div>

        {/* === Columna Derecha: Imagen Decorativa === */}
        <div className="login-image-section-blue">
            <div className="image-wrapper">
                <img src={loginImage} alt="Registro" className="login-decorative-image"/>
            </div>
        </div>
      </div>
      <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo({ isOpen: false, title: '', message: '' })} title={modalInfo.title}>{modalInfo.message}</Modal>
    </div>
  );
}

export default Registro;