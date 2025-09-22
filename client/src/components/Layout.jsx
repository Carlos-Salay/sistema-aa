import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import logo from '../logos/logo-aa.png';

function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <img src={logo} alt="ClaraVía AA Logo" className="navbar-logo" />
            <div className="navbar-title-group">
              <h2 className="navbar-title">ClaraVía</h2>
              <p className="app-slogan">Camino claro, en alusión a la claridad y guía en el proceso.</p>
            </div>
          </div>
          <nav>
            <ul className="nav-links">
              <li><NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink></li>
              <li><NavLink to="/registro" className={({ isActive }) => (isActive ? 'active' : '')}>Registro</NavLink></li>
              <li><NavLink to="/miembros" className={({ isActive }) => (isActive ? 'active' : '')}>Miembros</NavLink></li>
              <li><NavLink to="/sesiones" className={({ isActive }) => (isActive ? 'active' : '')}>Sesiones</NavLink></li>
              <li><NavLink to="/calendario" className={({ isActive }) => (isActive ? 'active' : '')}>Calendario</NavLink></li>
              {/* EL ENLACE A BITÁCORA HA SIDO ELIMINADO DE AQUÍ */}
              <li><NavLink to="/testimonios" className={({ isActive }) => (isActive ? 'active' : '')}>Testimonios</NavLink></li>
              {user && user.rol === 'Administrador' && (
                <li><NavLink to="/reportes" className={({ isActive }) => (isActive ? 'active' : '')}>Reportes</NavLink></li>
              )}
            </ul>
          </nav>
          <div className="navbar-user">
            {user && (
              <>
                <div className="user-info">
                  <span className="user-name">{user.nombre}</span>
                  <span className="user-role">{user.rol}</span>
                </div>
                {user.rol === 'Administrador' && (
                  <NavLink to="/usuarios" className="nav-link-icon" title="Gestionar Usuarios">
                    <FaUserShield />
                  </NavLink>
                )}
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

export default Layout;