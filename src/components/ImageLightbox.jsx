import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './ImageLightbox.css';

export default function ImageLightbox({ imageUrl, onClose }) {
  // Fecha o lightbox se a tecla Esc for pressionada
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Fechar">
        <X size={32} />
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Ampliada" className="lightbox-image" />
      </div>
    </div>
  );
}
