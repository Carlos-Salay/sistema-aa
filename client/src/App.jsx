import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Layouts
import AdminLayout from './components/Layout.jsx';
import MemberLayout from './components/MemberLayout.jsx';

// Páginas Públicas
import Login from './components/Login.jsx';

// Páginas de Administrador
import AdminDashboard from './components/Dashboard.jsx';
import Registro from './components/Registro.jsx';
import Miembros from './components/Miembros.jsx';
import Sesiones from './components/Sesiones.jsx';
import Asistencia from './components/Asistencia.jsx';
import Reportes from './components/Reportes.jsx';
import Usuarios from './components/Usuarios.jsx';
import Mensajes from './components/Mensajes.jsx';
import Calendario from './components/Calendario.jsx';
import Testimonios from './components/Testimonios.jsx';

// Páginas de Miembro
import MemberDashboard from './components/MemberDashboard.jsx';
import MemberBitacora from './components/MemberBitacora.jsx';
import MemberMensajes from './components/MemberMensajes.jsx';
import ChatView from './components/ChatView.jsx';

import './App.css';

function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (user.rol === 'Administrador' || user.rol === 'Coordinador') {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/miembros" element={<Miembros />} />
          <Route path="/sesiones" element={<Sesiones />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/sesiones/:id/asistencia" element={<Asistencia />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          {/* LA RUTA A LA BITÁCORA DE ADMIN HA SIDO ELIMINADA */}
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/testimonios" element={<Testimonios />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (user.rol === 'Miembro') {
    return (
      <MemberLayout>
        <Routes>
          <Route path="/" element={<MemberDashboard />} />
          <Route path="/mi-bitacora" element={<MemberBitacora />} />
          <Route path="/mis-mensajes" element={<MemberMensajes />} />
          <Route path="/mis-mensajes/:otroMiembroId" element={<ChatView />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/testimonios" element={<Testimonios />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </MemberLayout>
    );
  }

  return <p>Rol no reconocido.</p>;
}

export default App;