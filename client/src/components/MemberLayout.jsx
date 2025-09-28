import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import logo from '../logos/logo-aa.png';

function MemberLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // --- LÓGICA PARA EL CIERRE DE SESIÓN POR INACTIVIDAD ---
  const idleTimeout = useRef(null);
  const IDLE_TIME_MS = 3 * 60 * 1000; // 3 minutos

  const resetIdleTimer = () => {
    clearTimeout(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
      logout();
      navigate('/login'); // Opcional: redirigir al login
      alert('Tu sesión se ha cerrado por inactividad.');
    }, IDLE_TIME_MS);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    resetIdleTimer();
    events.forEach(event => window.addEventListener(event, resetIdleTimer));

    return () => {
      clearTimeout(idleTimeout.current);
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, [logout, navigate]);
  
  return (
    <div className="app-layout">
      <header className="top-navbar">
        {/* Fila Superior */}
        <div className="top-bar">
          <div className="navbar-brand">
            <img src={logo} alt="ClaraVía Logo" className="navbar-logo" />
            <h2 className="navbar-title">ClaraVía</h2>
          </div>
          <div className="navbar-user">
            <button onClick={toggleTheme} className="theme-toggle-button" title="Cambiar tema">
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
            <div className="user-info">
              <span className="user-name">{user.alias}</span>
              <span className="user-role">{user.rol}</span>
            </div>
            <button onClick={logout} className="logout-button" title="Cerrar Sesión">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
        {/* Fila Inferior */}
        <div className="bottom-bar">
          <nav className="nav-links">
            <NavLink to="/">Mi Perfil</NavLink>
            <NavLink to="/mi-bitacora">Mi Bitácora</NavLink>
            <NavLink to="/mis-mensajes">Mis Mensajes</NavLink>
            <NavLink to="/calendario">Calendario</NavLink>
            <NavLink to="/testimonios">Testimonios</NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <div className="page-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
export default MemberLayout;