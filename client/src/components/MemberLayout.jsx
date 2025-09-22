import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaSignOutAlt } from 'react-icons/fa';
import logo from '../logos/logo-aa.png';

function MemberLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <img src={logo} alt="ClaraVía Logo" className="navbar-logo" />
            <div className="navbar-title-group">
                <h2 className="navbar-title">ClaraVía</h2>
                <p className="app-slogan">Camino claro, en alusión a la claridad y guía en el proceso.</p>
            </div>
          </div>
          <nav>
            <ul className="nav-links">
              <li><NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>Mi Perfil</NavLink></li>
              <li><NavLink to="/mi-bitacora" className={({ isActive }) => (isActive ? 'active' : '')}>Mi Bitácora</NavLink></li>
              <li><NavLink to="/mis-mensajes" className={({ isActive }) => (isActive ? 'active' : '')}>Mis Mensajes</NavLink></li>
              <li><NavLink to="/calendario" className={({ isActive }) => (isActive ? 'active' : '')}>Calendario</NavLink></li>
              <li><NavLink to="/testimonios" className={({ isActive }) => (isActive ? 'active' : '')}>Testimonios</NavLink></li>
            </ul>
          </nav>
          <div className="navbar-user">
            {user && (
              <>
                <div className="user-info">
                  <span className="user-name">{user.nombre}</span>
                  <span className="user-role">{user.rol}</span>
                </div>
                <button onClick={logout} className="logout-button" title="Cerrar Sesión">
                  <FaSignOutAlt />
                </button>
              </>
            )}
          </div>
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