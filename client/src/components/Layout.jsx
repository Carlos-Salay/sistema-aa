import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { FaUserShield, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import logo from '../logos/logo-aa.png';
import Notificaciones from './Notificaciones.jsx'; // 1. La importación ya está aquí, ¡perfecto!

function Layout({ children }) {
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
      navigate('/login');
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
        {/* Fila Superior: Logo y Controles de Usuario */}
        <div className="top-bar">
          <div className="navbar-brand">
            <img src={logo} alt="ClaraVía Logo" className="navbar-logo" />
            <h2 className="navbar-title">ClaraVía</h2>
          </div>
          <div className="navbar-user">
            <button onClick={toggleTheme} className="theme-toggle-button" title="Cambiar tema">
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* === INICIO DE LA CORRECCIÓN === */}
            <Notificaciones /> {/* 2. Añadimos el componente aquí */}
            {/* === FIN DE LA CORRECCIÓN === */}
            
            <div className="user-info">
              <span className="user-name">{user.alias}</span>
              <span className="user-role">{user.rol}</span>
            </div>
            {user.rol === 'Administrador' && (
              <NavLink to="/usuarios" className="nav-icon-button" title="Gestionar Usuarios">
                <FaUserShield />
              </NavLink>
            )}
            <button onClick={logout} className="logout-button" title="Cerrar Sesión">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
        {/* Fila Inferior: Enlaces de Navegación */}
        <div className="bottom-bar">
          <nav className="nav-links">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/miembros">Miembros</NavLink>
            <NavLink to="/sesiones">Sesiones</NavLink>
            <NavLink to="/calendario">Calendario</NavLink>
            <NavLink to="/testimonios">Testimonios</NavLink>
            {user.rol === 'Administrador' && <NavLink to="/reportes">Reportes</NavLink>}
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
export default Layout;