import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaComments, FaUserFriends } from 'react-icons/fa';
import { API_URL } from '../config.js';

function MemberMensajes() {
  const { user } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchConversaciones = async () => {
      try {
        const response = await fetch(`${API_URL}/api/mensajes/conversaciones/${user.id}`);
        if (!response.ok) throw new Error('No se pudieron cargar tus conversaciones.');
        const data = await response.json();
        setConversaciones(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConversaciones();
  }, [user]);

  if (loading) return <p>Cargando conversaciones...</p>;
  if (error) return <p className="message-error">{error}</p>;

  return (
    <div>
      <h1 className="page-title"><FaComments className="page-logo-icon" /> Mis Mensajes</h1>
      <div className="content-section">
        <h2>Bandeja de Entrada</h2>
        {conversaciones.length > 0 ? (
          <div className="conversation-list">
            {conversaciones.map(conv => (
              <Link key={conv.id_miembro} to={`/mis-mensajes/${conv.id_miembro}`} className="conversation-item">
                <FaUserFriends className="conversation-icon" />
                <div className="conversation-details">
                  <span className="conversation-alias">{conv.alias}</span>
                  <span className="conversation-code">{conv.codigo_confidencial}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>Aún no tienes conversaciones. Un administrador puede asignarte un padrino o ahijado.</p>
        )}
      </div>
    </div>
  );
}

export default MemberMensajes;