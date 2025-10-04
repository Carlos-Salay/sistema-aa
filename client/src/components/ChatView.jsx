import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FaComments, FaPaperPlane } from 'react-icons/fa';
import { API_URL } from '../config.js';

function ChatView() {
  const { otroMiembroId } = useParams();
  const { user } = useAuth();
  
  const [conversacionCon, setConversacionCon] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (!user || !otroMiembroId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/mensajes/${user.id}/${otroMiembroId}`);
        if (!response.ok) throw new Error("No se pudo cargar el historial de mensajes.");
        const data = await response.json();
        setMensajes(data);
      } catch (err) {
        console.error("Error al cargar mensajes:", err);
        setError(err.message);
      }
    };

    const fetchPartnerInfo = async () => {
      try {
        // Usamos la ruta de perfil que ya existe para obtener los datos del otro miembro
        const response = await fetch(`${API_URL}/api/miembros/${otroMiembroId}`);
        const data = await response.json();
        setConversacionCon(data);
      } catch (err) {
        console.error("Error al cargar info del compañero:", err);
      }
    };

    setLoading(true);
    fetchPartnerInfo();
    fetchMessages().finally(() => setLoading(false));

    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);

  }, [user, otroMiembroId]);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !user || !conversacionCon?.id_miembro) return;

    try {
      const response = await fetch(`${API_URL}/api/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_remitente: user.id,
          id_destinatario: conversacionCon.id_miembro,
          mensaje: nuevoMensaje,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el mensaje.');
      }
      setMensajes(prev => [...prev, data]);
      setNuevoMensaje('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title"><FaComments className="page-logo-icon" /> Mis Mensajes</h1>
      <div className="chat-container">
        <div className="chat-header">
          <h3>Conversación con: {conversacionCon ? conversacionCon.alias : 'Cargando...'}</h3>
        </div>
        <div className="chat-messages">
          {loading ? (
            <p style={{textAlign: 'center', padding: '20px'}}>Cargando mensajes...</p>
          ) : (
            mensajes.map(msg => (
              <div key={msg.id_mensaje} className={`message ${msg.id_remitente === user?.id ? 'sent' : 'received'}`}>
                <p>{msg.mensaje}</p>
                <span>{new Date(msg.fecha_envio).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-form" onSubmit={handleEnviarMensaje}>
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder={conversacionCon?.id_miembro ? "Escribe tu mensaje de apoyo..." : "No puedes enviar mensajes."}
            disabled={!conversacionCon?.id_miembro}
          />
          <button type="submit" disabled={!conversacionCon?.id_miembro}><FaPaperPlane /></button>
        </form>
      </div>
      {error && <p className="message-error">{error}</p>}
    </div>
  );
}

export default ChatView;