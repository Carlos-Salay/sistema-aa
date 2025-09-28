import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaCheckCircle, FaTimesCircle, FaUser, FaLock, FaCalendarAlt } from 'react-icons/fa';
import Modal from './Modal.jsx';
import loginImage from '../logos/registro.png';

// Requisitos de la contraseña
const passwordRequirements = [
  { id: 0, text: "Al menos 8 caracteres", regex: /.{8,}/ },
  { id: 1, text: "Al menos una letra", regex: /[a-zA-Z]/ },
  { id: 2, text: "Al menos un número", regex: /\d/ }
];

function Registro() {
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

  useEffect(() => {
    setPasswordValidation(passwordRequirements.map(req => ({ ...req, valid: req.regex.test(formData.password) })));
  }, [formData.password]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isPasswordValid = passwordValidation.every(req => req.valid);

    if (formData.password !== formData.confirmPassword) {
      setModalInfo({ isOpen: true, title: 'Error de Validación', message: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!isPasswordValid) {
      setModalInfo({ isOpen: true, title: 'Contraseña Débil', message: 'La contraseña no cumple todos los requisitos.' });
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/miembros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: formData.alias,
          fecha_ingreso: formData.fecha_ingreso,
          fecha_sobriedad: formData.fecha_sobriedad,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el miembro.');
      }
      
      setModalInfo({
        isOpen: true,
        title: '¡Registro Exitoso!',
        message: (
          <div>
            Miembro "<strong>{data.alias}</strong>" creado con el código: <strong>{data.codigo_confidencial}</strong>.<br />
            Ya puede iniciar sesión con este código y la contraseña establecida.
          </div>
        ),
      });

      setFormData({ alias: '', fecha_ingreso: new Date().toISOString().split('T')[0], fecha_sobriedad: new Date().toISOString().split('T')[0], password: '', confirmPassword: '' });
      setIsPasswordFocused(false);

    } catch (err) {
      setModalInfo({ isOpen: true, title: 'Error en el Registro', message: err.message });
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-split">
        
        <div className="login-form-section">
          <h2 className="login-title-split">Registro</h2>
          <p className="login-subtitle">Crea una nueva cuenta de miembro.</p>
          
          <form onSubmit={handleSubmit} className="registro-form">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input type="text" id="alias" name="alias" placeholder="Alias del miembro" value={formData.alias} onChange={handleChange} required />
            </div>

            <div className="form-grid-double">
              {/* --- CAMBIO AQUÍ: AÑADIMOS LABELS A LAS FECHAS --- */}
              <div className="form-group">
                <label htmlFor="fecha_ingreso">Fecha de Ingreso</label>
                <div className="input-group">
                  <FaCalendarAlt className="input-icon" />
                  <input type="date" id="fecha_ingreso" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="fecha_sobriedad">Fecha de Sobriedad</label>
                <div className="input-group">
                  <FaCalendarAlt className="input-icon" />
                  <input type="date" id="fecha_sobriedad" name="fecha_sobriedad" value={formData.fecha_sobriedad} onChange={handleChange} required />
                </div>
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