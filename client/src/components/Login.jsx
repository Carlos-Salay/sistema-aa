// client/src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoLogin from '../logos/logo.png';

function Login() {
  const [credencial, setCredencial] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // El backend ahora entiende que este campo puede ser un correo o un código
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo_electronico: credencial, password: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión.');
      }
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logoLogin} alt="Logo de Inicio de Sesión" className="login-logo" />
        <h2 className="login-title">Acceso a ClaraVía</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {/* --- CAMBIO DE TEXTO AQUÍ --- */}
            <label htmlFor="credencial">Usuario / Código Confidencial:</label>
            <input
              type="text" // Cambiado a 'text' para aceptar códigos
              id="credencial"
              name="credencial"
              autoComplete="username"
              value={credencial}
              onChange={(e) => setCredencial(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Ingresar</button>
        </form>
        {error && <p className="message-error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;