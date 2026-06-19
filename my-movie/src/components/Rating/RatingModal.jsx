import React, { useEffect, useState } from 'react';
import './RatingModal.css';

const RatingModal = ({ isOpen, onClose, movieTitle, language = 'uz', onSubmit, initialRating = null }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRating(0);
      setDragStartY(0);
      setDragCurrentY(0);
      setIsDragging(false);
      return;
    }
    const safeInitial = Number.isFinite(Number(initialRating)) ? Math.max(1, Math.min(10, Math.floor(Number(initialRating)))) : 0;
    setSelectedRating(safeInitial);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialRating]);

  if (!isOpen) return null;

  const questionText = language === 'uz' ? `${movieTitle} kinosiga baho bering` : `Оцените фильм ${movieTitle}`;
  const buttonText = language === 'uz' ? 'Baholash' : 'Оценить';
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 500;

  const handleDragStart = (e) => {
    if (!isSmallScreen) return;
    const startY = e.touches[0].clientY;
    setDragStartY(startY);
    setDragCurrentY(startY);
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isSmallScreen || !isDragging) return;
    const currentY = e.touches[0].clientY;
    if (currentY > dragStartY) {
      setDragCurrentY(currentY);
    }
  };

  const handleDragEnd = () => {
    if (!isSmallScreen || !isDragging) return;
    const deltaY = dragCurrentY - dragStartY;
    if (deltaY > 80) {
      onClose();
    }
    setIsDragging(false);
    setDragCurrentY(0);
    setDragStartY(0);
  };

  return (
    <div className="rating-modal-overlay" onClick={() => { if (!isSmallScreen) onClose(); }}>
      <div
        className={`rating-modal-content ${isDragging ? 'dragging' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={isSmallScreen && isDragging && dragCurrentY > dragStartY ? { transform: `translateY(${dragCurrentY - dragStartY}px)` } : {}}
      >
        <div
          className="rating-modal-drag-zone"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <span className="rating-modal-drag-handle" />
        </div>

        <button className="rating-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="rating-modal-main-star" aria-hidden>
          <span className="rating-modal-main-star-icon">★</span>
          <span className="rating-modal-main-star-value">{selectedRating || '?'}</span>
        </div>

        <p className="rating-modal-title">{questionText}</p>

        <div className="rating-modal-stars">
          {Array.from({ length: 10 }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                className={`rating-modal-star-btn ${selectedRating >= value ? 'active' : ''}`}
                onClick={() => setSelectedRating(value)}
                aria-label={`${value}`}
              >
                ★
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={`rating-modal-submit ${selectedRating === 0 ? 'disabled' : ''}`}
          onClick={() => {
            if (!selectedRating) return;
            onSubmit(selectedRating);
            onClose();
          }}
          disabled={selectedRating === 0}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default RatingModal;
