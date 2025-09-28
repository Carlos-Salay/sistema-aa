import React from 'react';
import { FaTimes } from 'react-icons/fa';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    // El overlay es el fondo oscuro semitransparente
    <div className="modal-overlay" onClick={onClose}>
      {/* Detenemos la propagación para que al hacer clic en el contenido no se cierre */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close-button">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;