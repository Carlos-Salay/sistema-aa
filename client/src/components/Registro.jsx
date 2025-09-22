import React, { useState } from 'react';
import { FaUserPlus } from 'react-icons/fa'; // 1. Usaremos este icono
import Modal from './Modal.jsx';

function Registro() {
  const [formData, setFormData] = useState({
    alias: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_sobriedad: new Date().toISOString().split('T')[0],
    password: '',
    confirmPassword: ''
  });

  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: '',
    message: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setModalInfo({
        isOpen: true,
        title: 'Error de Validación',
        message: 'Las contraseñas no coinciden. Por favor, inténtalo de nuevo.',
      });
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

      setFormData({
        alias: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        fecha_sobriedad: new Date().toISOString().split('T')[0],
        password: '',
        confirmPassword: ''
      });

    } catch (err) {
      console.error('Error en el registro:', err);
      setModalInfo({
        isOpen: true,
        title: 'Error en el Registro',
        message: err.message,
      });
    }
  };

  return (
    // Reutilizamos los estilos del contenedor de Login para consistencia
    <div className="login-container"> 
      <div className="login-card" style={{ maxWidth: '800px' }}> {/* Hacemos la tarjeta más ancha */}
        
        {/* Reemplazamos la imagen con un icono */}
        <FaUserPlus className="login-logo" style={{ fontSize: '4rem', marginBottom: '20px' }} />
        
        <h2 className="login-title">
          Registro de Nuevo Miembro
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="alias">Alias:</label>
              <input type="text" id="alias" name="alias" value={formData.alias} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="fecha_ingreso">Fecha de Ingreso:</label>
              <input type="date" id="fecha_ingreso" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="fecha_sobriedad">Fecha de Sobriedad:</label>
              <input type="date" id="fecha_sobriedad" name="fecha_sobriedad" value={formData.fecha_sobriedad} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña Inicial:</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="submit-button">Registrar Miembro</button>
        </form>
      </div>

      <Modal 
        isOpen={modalInfo.isOpen} 
        onClose={() => setModalInfo({ isOpen: false, title: '', message: '' })} 
        title={modalInfo.title}
      >
        {modalInfo.message}
      </Modal>
    </div>
  );
}

export default Registro;