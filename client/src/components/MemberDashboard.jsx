import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Asegúrate de que la extensión es .jsx
import { FaUserCircle, FaAward, FaBook, FaUsers, FaUserFriends, FaCommentDots } from 'react-icons/fa';

// Traemos las descripciones de los pasos para usarlas aquí
const descripcionPasos = {
    1: "Admitir: la impotencia ante el alcohol y la vida ingobernable.",
    2: "Creer: que un Poder Superior puede devolver la salud mental.",
    3: "Decidir: confiar la voluntad y la vida al cuidado de un Poder Superior.",
    4: "Hacer: un inventario moral sincero y completo de sí mismo.",
    5: "Admitir: la naturaleza exacta de las faltas ante Dios, uno mismo y otro ser humano.",
    6: "Estar: enteramente dispuesto a que Dios elimine los defectos de carácter.",
    7: "Pedir: humildemente que se eliminen las fallas y culpas.",
    8: "Hacer: una lista de todas las personas perjudicadas y estar dispuesto a reparar el daño.",
    9: "Reparar: directamente el daño causado cuando sea posible.",
    10: "Continuar: el examen de conciencia y admitir las faltas al momento de reconocerlas.",
    11: "Buscar: mejorar el contacto consciente con Dios mediante la oración y la meditación.",
    12: "Llevar: el mensaje a otros alcohólicos y practicar estos principios en todas las actividades."
};

function MemberDashboard() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPerfil = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/miembros/${user.id}`);
        const data = await response.json();
        setPerfil(data);
      } catch (err) {
        console.error("Error al cargar el perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, [user]);

  if (loading) return <p>Cargando tu perfil...</p>;
  if (!perfil) return <p>No se pudo cargar tu perfil.</p>;

  return (
    <div className="page-container">
      <div className="profile-header">
        <FaUserCircle className="profile-icon" />
        <div className="profile-info">
          <h1 className="profile-alias">{perfil.alias}</h1>
          <p className="profile-code">Código: {perfil.codigo_confidencial}</p>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><FaAward /> Días de Sobriedad</div>
          <div className="card-body">
            <span className="card-value">{perfil.dias_sobriedad !== null ? Math.floor(perfil.dias_sobriedad) : 'N/A'}</span>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><FaBook /> Progreso Actual</div>
          <div className="card-body card-body-step">
            <span className="card-value card-value-step">
              Paso {perfil.paso_actual || 1}
            </span>
            <p className="card-step-description">{descripcionPasos[perfil.paso_actual || 1]}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><FaUserFriends /> Padrino de Apoyo</div>
          <div className="card-body"><span className="card-value" style={{ fontSize: '2rem' }}>{perfil.nombre_padrino || 'No asignado'}</span></div>
        </div>
      </div>

      {/* --- NUEVA SECCIÓN: LISTA DE AHIJADOS --- */}
      {perfil.ahijados && perfil.ahijados.length > 0 && (
        <div className="content-section" style={{ marginTop: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FaUsers /> Mis Ahijados
          </h2>
          <div className="conversation-list">
            {perfil.ahijados.map(ahijado => (
              <Link key={ahijado.id_miembro} to={`/mis-mensajes/${ahijado.id_miembro}`} className="conversation-item">
                <div className="conversation-details">
                  <span className="conversation-alias">{ahijado.alias}</span>
                  <span className="conversation-code">{ahijado.codigo_confidencial}</span>
                </div>
                <FaCommentDots className="conversation-go-to-chat-icon" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDashboard;