// client/src/components/Modal.jsx
import React from 'react';

function Modal({
  isOpen,
  onClose,
  title,
  children
}) {
  if (!isOpen) {
    return null; // No renderiza nada si no está abierto
  }

  return (
    <div className = "modal-overlay" >
    <div className = "modal-content" >
    <h2 className = "modal-title" > {
      title
    } </h2>
    <div className = "modal-body" > {
      children
    } </div>
    <div className = "modal-footer" >
    <button onClick = {
      onClose
    }
    className = "modal-close-button" > Aceptar </button>
    </div>
    </div>
    </div>
  );
}

export default Modal;