import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaPenSquare, FaHandHoldingHeart, FaLightbulb, FaHeart, FaTrash } from 'react-icons/fa';
import Modal from './Modal.jsx';

function Testimonios() {
  const { user } = useAuth();
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTestimonio, setNewTestimonio] = useState({ titulo: '', contenido: '' });
  const [modalDelete, setModalDelete] = useState({ isOpen: false, testimonioId: null });

  const fetchTestimonios = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/testimonios/${user.id_miembro}`);
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
  }, [user]);

  const handleInputChange = (e) => {
    setNewTestimonio({ ...newTestimonio, [e.target.name]: e.target.value });
  };

  const handlePostTestimonio = async (e) => {
    e.preventDefault();
    if (!newTestimonio.titulo.trim() || !newTestimonio.contenido.trim()) return;
    try {
      await fetch('http://localhost:4000/api/testimonios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTestimonio, id_miembro: user.id_miembro }),
      });
      setNewTestimonio({ titulo: '', contenido: '' });
      fetchTestimonios();
    } catch (err) {
      setError('Error al publicar el testimonio.');
    }
  };

  const handleReaccionar = (idTestimonio, tipoReaccion) => {
    setTestimonios(currentTestimonios => 
      currentTestimonios.map(t => {
        if (t.id_testimonio === idTestimonio) {
          const yaReaccionado = t.reaccion_usuario;
          const mismaReaccion = yaReaccionado === tipoReaccion;
          
          let nuevosApoyos = parseInt(t.apoyos, 10);
          let nuevasInspiraciones = parseInt(t.inspiraciones, 10);
          let nuevasGratitudes = parseInt(t.gratitudes, 10);

          if (yaReaccionado) {
            if (yaReaccionado === 'apoyo') nuevosApoyos--;
            if (yaReaccionado === 'inspiracion') nuevasInspiraciones--;
            if (yaReaccionado === 'gratitud') nuevasGratitudes--;
          }
          if (!mismaReaccion) {
            if (tipoReaccion === 'apoyo') nuevosApoyos++;
            if (tipoReaccion === 'inspiracion') nuevasInspiraciones++;
            if (tipoReaccion === 'gratitud') nuevasGratitudes++;
          }
          
          return { ...t, reaccion_usuario: mismaReaccion ? null : tipoReaccion, apoyos: nuevosApoyos, inspiraciones: nuevasInspiraciones, gratitudes: nuevasGratitudes };
        }
        return t;
      })
    );

    fetch(`http://localhost:4000/api/testimonios/${idTestimonio}/reaccionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_miembro: user.id_miembro, rol: user.rol, tipo_reaccion: tipoReaccion }),
    }).catch(() => fetchTestimonios());
  };

  const handleDeleteTestimonio = async () => {
    if (!modalDelete.testimonioId) return;
    try {
      await fetch(`http://localhost:4000/api/testimonios/${modalDelete.testimonioId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_miembro: user.id_miembro, rol: user.rol }),
      });
      setModalDelete({ isOpen: false, testimonioId: null });
      fetchTestimonios();
    } catch (err) { alert("No se pudo eliminar el testimonio."); }
  };

  return (
    <div>
      <h1 className="page-title"><FaPenSquare className="page-logo-icon" /> Muro de Testimonios</h1>
      
      {user.id_miembro && (
        <div className="content-section">
          <h2 className="section-title">Comparte tu Historia</h2>
          <form onSubmit={handlePostTestimonio}>
            <div className="form-group">
              <label htmlFor="titulo">Título de tu testimonio:</label>
              <input type="text" id="titulo" name="titulo" value={newTestimonio.titulo} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="contenido">Tu historia:</label>
              <textarea id="contenido" name="contenido" rows="5" value={newTestimonio.contenido} onChange={handleInputChange} required></textarea>
            </div>
            <div className="form-actions">
                <button type="submit"><span>Publicar Testimonio</span></button>
            </div>
          </form>
        </div>
      )}

      <div className="testimonios-list">
        {loading && <p>Cargando testimonios...</p>}
        {error && <p className="message-error">{error}</p>}
        {!loading && testimonios.map(t => (
          <div key={t.id_testimonio} className="testimonio-card">
            <div className="testimonio-header">
              <h3>{t.titulo}</h3>
              {(user.id_miembro === t.id_miembro || user.rol === 'Administrador') && (
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
              <button onClick={() => handleReaccionar(t.id_testimonio, 'apoyo')} className={`reaction-button apoyo ${t.reaccion_usuario === 'apoyo' ? 'active' : ''}`}>
                <FaHandHoldingHeart /> <span>Te Apoyo ({t.apoyos})</span>
              </button>
              <button onClick={() => handleReaccionar(t.id_testimonio, 'inspiracion')} className={`reaction-button inspiracion ${t.reaccion_usuario === 'inspiracion' ? 'active' : ''}`}>
                <FaLightbulb /> <span>Me Inspira ({t.inspiraciones})</span>
              </button>
              <button onClick={() => handleReaccionar(t.id_testimonio, 'gratitud')} className={`reaction-button gratitud ${t.reaccion_usuario === 'gratitud' ? 'active' : ''}`}>
                <FaHeart /> <span>Gracias ({t.gratitudes})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={modalDelete.isOpen} 
        onClose={() => setModalDelete({ isOpen: false, testimonioId: null })}
        title="Confirmar Eliminación"
      >
        <p>¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
            <button onClick={() => setModalDelete({ isOpen: false, testimonioId: null })} className="button-secondary"><span>Cancelar</span></button>
            <button onClick={handleDeleteTestimonio} className="button-danger"><span>Sí, eliminar</span></button>
        </div>
      </Modal>
    </div>
  );
}

export default Testimonios;