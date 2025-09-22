import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaPenSquare, FaHandHoldingHeart, FaLightbulb, FaHeart, FaTrash } from 'react-icons/fa';
import Modal from './Modal.jsx'; // Usaremos nuestro modal de confirmación

function Testimonios() {
  const { user } = useAuth();
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTestimonio, setNewTestimonio] = useState({ titulo: '', contenido: '' });
  const [userReactions, setUserReactions] = useState({});
  const [modalDelete, setModalDelete] = useState({ isOpen: false, testimonioId: null });

  const fetchTestimonios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/testimonios');
      const data = await response.json();
      setTestimonios(data);
    } catch (err) {
      setError('No se pudieron cargar los testimonios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonios();
  }, []);

  const handleInputChange = (e) => {
    setNewTestimonio({ ...newTestimonio, [e.target.name]: e.target.value });
  };

  const handlePostTestimonio = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:4000/api/testimonios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTestimonio, id_miembro: user.id }),
      });
      setNewTestimonio({ titulo: '', contenido: '' });
      fetchTestimonios();
    } catch (err) {
      setError('Error al publicar el testimonio.');
    }
  };

  const handleReaccionar = async (idTestimonio, tipoReaccion) => {
      const newReactions = { ...userReactions };
      if (newReactions[idTestimonio] === tipoReaccion) {
        delete newReactions[idTestimonio];
      } else {
        newReactions[idTestimonio] = tipoReaccion;
      }
      setUserReactions(newReactions);
      try {
        await fetch(`http://localhost:4000/api/testimonios/${idTestimonio}/reaccionar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_miembro: user.id, tipo_reaccion: tipoReaccion }),
        });
        fetchTestimonios();
      } catch (err) {
        console.error("Error al reaccionar:", err);
      }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR TESTIMONIO ---
  const handleDeleteTestimonio = async () => {
    if (!modalDelete.testimonioId) return;
    try {
      await fetch(`http://localhost:4000/api/testimonios/${modalDelete.testimonioId}`, {
        method: 'DELETE',
      });
      setModalDelete({ isOpen: false, testimonioId: null });
      fetchTestimonios(); // Recargamos la lista
    } catch (err) {
      alert("No se pudo eliminar el testimonio.");
    }
  };

  return (
    <div>
      <h1 className="page-title"><FaPenSquare className="page-logo-icon" /> Muro de Testimonios</h1>
      
      {/* FORMULARIO PARA COMPARTIR (SOLO PARA MIEMBROS) */}
      {user.rol === 'Miembro' && (
        <div className="content-section">
          <h2>Comparte tu Historia</h2>
          <form onSubmit={handlePostTestimonio}>
            <div className="form-group">
              <label htmlFor="titulo">Título de tu testimonio:</label>
              <input type="text" name="titulo" value={newTestimonio.titulo} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="contenido">Tu historia:</label>
              <textarea name="contenido" rows="5" value={newTestimonio.contenido} onChange={handleInputChange} required></textarea>
            </div>
            <button type="submit">Publicar Testimonio</button>
          </form>
        </div>
      )}

      <div className="testimonios-list">
        {loading ? <p>Cargando testimonios...</p> : testimonios.map(t => (
          <div key={t.id_testimonio} className="testimonio-card">
            <div className="testimonio-header">
              <h3>{t.titulo}</h3>
              {/* Lógica para mostrar el botón de eliminar solo al autor */}
              {(user.id === t.id_miembro || user.rol === 'Administrador') && (
                <button 
                  className="delete-testimonio-btn" 
                  title="Eliminar publicación"
                  onClick={() => setModalDelete({ isOpen: true, testimonioId: t.id_testimonio })}
                >
                  <FaTrash />
                </button>
              )}
            </div>
            <p className="testimonio-autor">Compartido por: <strong>{t.autor}</strong></p>
            <p className="testimonio-contenido">{t.contenido}</p>
            <div className="reaction-bar">
              <button 
                onClick={() => handleReaccionar(t.id_testimonio, 'apoyo')} 
                className={`reaction-button apoyo ${userReactions[t.id_testimonio] === 'apoyo' ? 'active' : ''}`}
              >
                <FaHandHoldingHeart /> Te Apoyo ({t.apoyos || 0})
              </button>
              <button 
                onClick={() => handleReaccionar(t.id_testimonio, 'inspiracion')} 
                className={`reaction-button inspiracion ${userReactions[t.id_testimonio] === 'inspiracion' ? 'active' : ''}`}
              >
                <FaLightbulb /> Me Inspira ({t.inspiraciones || 0})
              </button>
              <button 
                onClick={() => handleReaccionar(t.id_testimonio, 'gratitud')} 
                className={`reaction-button gratitud ${userReactions[t.id_testimonio] === 'gratitud' ? 'active' : ''}`}
              >
                <FaHeart /> Gracias ({t.gratitudes || 0})
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="message-error">{error}</p>}

      {/* --- MODAL DE CONFIRMACIÓN PARA ELIMINAR --- */}
      <Modal 
        isOpen={modalDelete.isOpen} 
        onClose={() => setModalDelete({ isOpen: false, testimonioId: null })}
        title="Confirmar Eliminación"
      >
        <p>¿Estás seguro de que quieres eliminar esta publicación?</p>
        <p>Esta acción no se puede deshacer.</p>
        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px'}}>
            <button onClick={() => setModalDelete({ isOpen: false, testimonioId: null })}>Cancelar</button>
            <button onClick={handleDeleteTestimonio} className="baja-button-confirm">Sí, eliminar</button>
        </div>
      </Modal>
    </div>
  );
}

export default Testimonios;