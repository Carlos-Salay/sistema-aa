// client/src/components/Usuarios.jsx
import React, { useState, useEffect } from 'react';
import { FaUserShield } from 'react-icons/fa';

function Usuarios() {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo_electronico: '',
    password: '',
    id_rol: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Carga los roles desde el backend para el menú desplegable
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/roles');
        const data = await response.json();
        setRoles(data);
        if (data.length > 0) {
          // Selecciona el primer rol de la lista por defecto
          setFormData(prev => ({ ...prev, id_rol: data[0].id_rol }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const response = await fetch('http://localhost:4000/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el usuario.');
      }
      setMensaje(`Usuario "${data.nombre_completo}" creado con éxito.`);
      // Limpia el formulario después de un registro exitoso
      setFormData({
        nombre_completo: '',
        correo_electronico: '',
        password: '',
        id_rol: roles[0]?.id_rol || ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title"><FaUserShield className="page-logo-icon"/> Gestión de Usuarios</h1>
      <div className="content-section">
        <h2>Crear Nuevo Usuario del Sistema</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre_completo">Nombre Completo:</label>
            <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="correo_electronico">Correo Electrónico:</label>
            <input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="id_rol">Rol:</label>
            <select name="id_rol" value={formData.id_rol} onChange={handleChange} required>
              {roles.map(rol => (
                <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>
              ))}
            </select>
          </div>
          <button type="submit">Crear Usuario</button>
        </form>
        {mensaje && <p className="message-success">{mensaje}</p>}
        {error && <p className="message-error">{error}</p>}
      </div>
    </div>
  );
}

export default Usuarios;