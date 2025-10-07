import React, { useState, useEffect } from 'react';
import { FaUserShield, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaTimesCircle, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import loginImage from '../logos/registro.png';
import { API_URL } from '../config.js';

// Requisitos de contraseña
const passwordRequirements = [
  { id: 0, text: "Al menos 8 caracteres", regex: /.{8,}/ },
  { id: 1, text: "Al menos una letra", regex: /[a-zA-Z]/ },
  { id: 2, text: "Al menos un número", regex: /\d/ }
];

function Usuarios() {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo_electronico: '',
    password: '',
    confirmPassword: '' // 1. Nuevo campo en el estado
  });
  const [idRolSeleccionado, setIdRolSeleccionado] = useState(''); // Estado separado para el rol
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(passwordRequirements.map(req => ({ ...req, valid: false })));
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    setPasswordValidation(
      passwordRequirements.map(req => ({ ...req, valid: req.regex.test(formData.password) }))
    );
  }, [formData.password]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/roles`);
        const data = await response.json();
        setRoles(data);
        if (data.length > 0) {
          setIdRolSeleccionado(data[0].id_rol); // Asigna el primer rol por defecto
        }
      } catch (err) {
        setError('No se pudieron cargar los roles.');
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRolChange = (e) => {
    setIdRolSeleccionado(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    // 2. Nueva validación para confirmar contraseña
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    const isPasswordValid = passwordValidation.every(req => req.valid);
    if (!isPasswordValid) {
      setError('La contraseña no cumple con todos los requisitos de seguridad.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, id_rol: idRolSeleccionado }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al crear el usuario.');
      
      setMensaje(`Usuario "${data.nombre_completo}" creado con éxito.`);
      setFormData({ nombre_completo: '', correo_electronico: '', password: '', confirmPassword: '' });
      if (roles.length > 0) setIdRolSeleccionado(roles[0].id_rol);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-split">
        <div className="login-form-section">
          <h2 className="login-title-split">Crear Usuario</h2>
          <p className="login-subtitle">Añadir un nuevo administrador o coordinador.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group"><FaUser className="input-icon" /><input type="text" name="nombre_completo" placeholder="Nombre Completo" value={formData.nombre_completo} onChange={handleChange} required /></div>
            <div className="input-group"><FaEnvelope className="input-icon" /><input type="email" name="correo_electronico" placeholder="Correo Electrónico" value={formData.correo_electronico} onChange={handleChange} required /></div>
            <div className="input-group"><FaLock className="input-icon" /><input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} onFocus={() => setIsPasswordFocused(true)} required /></div>
            
            {/* 3. Nuevo campo para confirmar contraseña */}
            <div className="input-group"><FaLock className="input-icon" /><input type="password" name="confirmPassword" placeholder="Confirmar Contraseña" value={formData.confirmPassword} onChange={handleChange} required /></div>

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
            
            <div className="input-group select-group">
              <FaUserShield className="input-icon" />
              <select name="id_rol" value={idRolSeleccionado} onChange={handleRolChange} required>
                {roles.length === 0 ? <option>Cargando roles...</option> : roles.map(rol => (
                  <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>
                ))}
              </select>
              <FaChevronDown className="select-arrow" />
            </div>

            <button type="submit" className="login-button-primary"><span>Crear Usuario</span></button>
          </form>

          {mensaje && <p className="message-success" style={{marginTop: '20px'}}>{mensaje}</p>}
          {error && <p className="message-error" style={{marginTop: '20px'}}>{error}</p>}
        </div>

        <div className="login-image-section-blue">
            <div className="image-wrapper"><img src={loginImage} alt="Gestión de Usuarios" className="login-decorative-image"/></div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;