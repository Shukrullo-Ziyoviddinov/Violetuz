import React, { useEffect, useState } from 'react';
import './RatingModal.css';

const RatingModal = ({ isOpen, onClose, movieTitle, language = 'uz', onSubmit, initialRating = null }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedRating(0);
      setDragStartY(0);
      setDragCurrentY(0);
      setIsDragging(false);
      setSubmitting(false);
      setError('');
      return;
    }
    const safeInitial = Number.isFinite(Number(initialRating))
      ? Math.max(1, Math.min(10, Math.floor(Number(initialRating))))
      : 0;
    setSelectedRating(safeInitial);
    setError('');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialRating]);

  if (!isOpen) return null;

  const questionText =
    language === 'uz' ? `${movieTitle} kinosiga baho bering` : `Оцените фильм ${movieTitle}`;
  const buttonText = language === 'uz' ? 'Baholash' : 'Оценить';
  const submittingText = language === 'uz' ? 'Saqlanmoqda…' : 'Сохранение…';
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 500;
  const canSubmit = selectedRating >= 1 && selectedRating <= 10 && !submitting;

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

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await Promise.resolve(onSubmit(selectedRating));
      onClose();
    } catch (err) {
      const msg =
        err?.message ||
        (language === 'uz' ? 'Reyting saqlanmadi. Qayta urinib ko‘ring.' : 'Не удалось сохранить оценку.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rating-modal-overlay"
      onClick={() => {
        if (!isSmallScreen && !submitting) onClose();
      }}
    >
      <div
        className={`rating-modal-content ${isDragging ? 'dragging' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={
          isSmallScreen && isDragging && dragCurrentY > dragStartY
            ? { transform: `translateY(${dragCurrentY - dragStartY}px)` }
            : {}
        }
      >
        <div
          className="rating-modal-drag-zone"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <span className="rating-modal-drag-handle" />
        </div>

        <button
          className="rating-modal-close"
          onClick={onClose}
          aria-label="Close"
          disabled={submitting}
        >
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
                onClick={() => {
                  if (submitting) return;
                  setSelectedRating(value);
                  setError('');
                }}
                aria-label={`${value}`}
                disabled={submitting}
              >
                ★
              </button>
            );
          })}
        </div>

        {error ? <p className="rating-modal-error">{error}</p> : null}

        <button
          type="button"
          className={`rating-modal-submit ${!canSubmit ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? submittingText : buttonText}
        </button>
      </div>
    </div>
  );
};

export default RatingModal;
