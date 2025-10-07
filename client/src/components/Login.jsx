import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSun, FaMoon } from 'react-icons/fa';
import loginImage from '../logos/login.png';
import { API_URL } from '../config.js';

function Login() {
  const [credencial, setCredencial] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ===== CORRECCIÓN AQUÍ =====
        // Se envía 'credencial' en lugar de 'correo_electronico'
        body: JSON.stringify({ credencial: credencial, password: password }),
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
    <div className="login-page-container">
      <div className="login-card-split">
        
        <div className="login-form-section">
          <button onClick={toggleTheme} className="theme-toggle-button-login" title="Cambiar tema">
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>

          <h2 className="login-title-split">Login</h2>
          <p className="login-subtitle">Bienvenido de nuevo a ClaraVía.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Código de Usuario / Miembro"
                autoComplete="username"
                value={credencial}
                onChange={(e) => setCredencial(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            
            <button type="submit" className="login-button-primary">
              <span>Iniciar Sesión</span>
            </button>
          </form>
          {error && <p className="message-error" style={{marginTop: '15px'}}>{error}</p>}
        </div>

        <div className="login-image-section-blue">
            <div className="image-wrapper">
                <img src={loginImage} alt="Logo de AA San José Pinula" className="login-decorative-image"/>
            </div>
        </div>

      </div>
    </div>
  );
}

export default Login;