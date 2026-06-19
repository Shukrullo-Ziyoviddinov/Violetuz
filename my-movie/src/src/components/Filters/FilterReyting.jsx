import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './FilterReyting.css';

const RATING_TYPE_KEYS = {
  rating: 'violet',
  ratingImdb: 'imdb',
  ratingKinopoisk: 'kinopoisk',
  ratingNetflix: 'netflix'
};

const RATING_TYPE_LOGOS = {
  rating: '/img/photo_2026-02-16_20-30-31_preview_rev_1.png',
  ratingImdb: '/img/imdb.jpg',
  ratingKinopoisk: '/img/kinopoisk.jpg',
  ratingNetflix: '/img/netflix.jpg'
};

const FilterReyting = ({
  movies = [],
  selectedRatingType = 'rating',
  selectedRating,
  onRatingTypeSelect,
  onRatingSelect,
  hideVlFilter = false
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalTranslateY, setModalTranslateY] = useState(0);
  const modalRef = useRef(null);

  const effectiveRatingType = (hideVlFilter && selectedRatingType === 'rating') ? 'ratingImdb' : selectedRatingType;
  const ratingTypeField = effectiveRatingType;
  const uniqueRatings = [...new Set(
    movies
      .map(m => m[ratingTypeField])
      .filter(v => v != null && v !== '' && v !== 'none')
  )].sort((a, b) => Number(b) - Number(a));

  const getRatingCount = (rating) => {
    return movies.filter(m => m[ratingTypeField] == rating).length;
  };

  const closeModal = () => setIsModalOpen(false);

  const handleRatingTypeClick = (type) => {
    onRatingTypeSelect(type);
    onRatingSelect(null);
  };

  const handleRatingSelect = (rating) => {
    onRatingSelect(rating);
    closeModal();
  };

  const handleClearRating = () => {
    onRatingSelect(null);
    closeModal();
  };

  useEffect(() => {
    if (isModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.dataset.filtersModalScrollY = String(scrollY);
    } else {
      const raw = document.body.dataset.filtersModalScrollY;
      if (raw != null && raw !== '') {
        const scrollY = parseInt(raw, 10);
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        delete document.body.dataset.filtersModalScrollY;
        window.scrollTo(0, scrollY);
      }
    }
    return () => {
      const raw = document.body.dataset.filtersModalScrollY;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      if (raw != null && raw !== '') {
        const scrollY = parseInt(raw, 10);
        delete document.body.dataset.filtersModalScrollY;
        window.scrollTo(0, scrollY);
      }
    };
  }, [isModalOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const currentTouch = e.touches[0].clientY;
    const diff = currentTouch - touchStart;
    if (diff > 0) {
      setIsDraggingModal(true);
      setModalTranslateY(diff);
      setTouchEnd(currentTouch);
    } else {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchStart === null) {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      return;
    }
    const distance = touchEnd !== null ? touchEnd - touchStart : 0;
    if (distance <= 0) {
      setIsDraggingModal(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    const modalHeight = modalRef.current ? modalRef.current.offsetHeight : 300;
    const closeThreshold = modalHeight * 0.35;
    if (distance > closeThreshold) {
      closeModal();
    }
    setIsDraggingModal(false);
    setModalTranslateY(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const getBadgeText = () => {
    if (selectedRating === null) return null;
    const typeLabel = t(`filters.ratingTypes.${RATING_TYPE_KEYS[effectiveRatingType]}`);
    return `${typeLabel}: ${selectedRating}`;
  };

  return (
    <>
      <button
        className={`filters-btn ${selectedRating !== null ? 'filters-btn--active' : ''}`}
        onClick={() => setIsModalOpen(true)}
        type="button"
      >
        <svg className="filters-btn-icon filters-btn-icon--fill" viewBox="0 0 24 24" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {t('detail.rating')}
        {selectedRating !== null && (
          <span className="filters-btn-badge">{getBadgeText()}</span>
        )}
      </button>

      {isModalOpen && createPortal(
        <div
          className="filters-modal-overlay"
          onClick={handleOverlayClick}
        >
          <div
            ref={modalRef}
            className={`filters-modal-reyting ${isDraggingModal ? 'filters-modal-reyting--dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `translateY(${modalTranslateY}px)` }}
          >
            <div
              className="filters-modal-reyting-drag-area"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="filters-modal-reyting-drag-handle" />
              <div className="filters-modal-reyting-header">
                <h3 className="filters-modal-reyting-title">{t('detail.rating')}</h3>
                <button className="filters-modal-reyting-close" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className="filters-modal-reyting-body">
              <div className="filters-modal-reyting-type-row">
                {Object.entries(RATING_TYPE_KEYS)
                  .filter(([field]) => !(hideVlFilter && field === 'rating'))
                  .map(([field, key]) => (
                  <button
                    key={field}
                    className={`filters-modal-reyting-type-btn ${effectiveRatingType === field ? 'filters-modal-reyting-type-btn--active' : ''}`}
                    onClick={() => handleRatingTypeClick(field)}
                  >
                    <img src={RATING_TYPE_LOGOS[field]} alt={t(`filters.ratingTypes.${key}`)} className="filters-modal-reyting-type-img" />
                  </button>
                ))}
              </div>
              <button
                className={`filters-modal-reyting-option ${selectedRating === null ? 'filters-modal-reyting-option--active' : ''}`}
                onClick={handleClearRating}
              >
                {t('categories.all')} ({movies.length})
              </button>
              {uniqueRatings.map((rating) => (
                <button
                  key={rating}
                  className={`filters-modal-reyting-option ${selectedRating === rating ? 'filters-modal-reyting-option--active' : ''}`}
                  onClick={() => handleRatingSelect(rating)}
                >
                  {rating} ({getRatingCount(rating)})
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FilterReyting;
