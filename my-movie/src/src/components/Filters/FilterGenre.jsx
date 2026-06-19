import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './FilterGenre.css';

const GENRE_ORDER = [
  "Drama", "Romantika", "Sarguzasht", "Qo'rqinchli", "Jangari", "Anime",
  "Boevik", "Komediya", "Detektiv", "Oilaviy", "Fantastika", "Melodrama"
];

const FilterGenre = ({ movies = [], selectedGenres = [], onGenreSelect }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalTranslateY, setModalTranslateY] = useState(0);
  const modalRef = useRef(null);

  const allGenresInMovies = [...new Set(movies.flatMap(m => (m.filterGenre || [])))];
  const uniqueGenres = GENRE_ORDER.filter(g => allGenresInMovies.includes(g))
    .concat(allGenresInMovies.filter(g => !GENRE_ORDER.includes(g)));

  const getGenreCount = (genre) => {
    return movies.filter(m => (m.filterGenre || []).includes(genre)).length;
  };

  const closeModal = () => setIsModalOpen(false);

  const handleGenreToggle = (genre) => {
    const isSelected = selectedGenres.includes(genre);
    if (isSelected) {
      onGenreSelect(selectedGenres.filter(g => g !== genre));
    } else {
      onGenreSelect([...selectedGenres, genre]);
    }
    closeModal();
  };

  const handleClearGenres = () => {
    onGenreSelect([]);
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

  return (
    <>
      <button
        className={`filters-btn ${selectedGenres.length > 0 ? 'filters-btn--active' : ''}`}
        onClick={() => setIsModalOpen(true)}
        type="button"
      >
        <svg className="filters-btn-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        {t('filters.genre', 'Janr')}
        {selectedGenres.length > 0 && (
          <span className="filters-btn-badge">
            {selectedGenres.map(g => t(`filters.genres.${g}`, g)).join(', ')}
          </span>
        )}
      </button>

      {isModalOpen && createPortal(
        <div
          className="filters-modal-overlay"
          onClick={handleOverlayClick}
        >
          <div
            ref={modalRef}
            className={`filters-modal-genre ${isDraggingModal ? 'filters-modal-genre--dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `translateY(${modalTranslateY}px)` }}
          >
            <div
              className="filters-modal-genre-drag-area"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="filters-modal-genre-drag-handle" />
              <div className="filters-modal-genre-header">
                <h3 className="filters-modal-genre-title">{t('filters.genre', 'Janr')}</h3>
                <button className="filters-modal-genre-close" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className="filters-modal-genre-body">
              <button
                className={`filters-modal-genre-option ${selectedGenres.length === 0 ? 'filters-modal-genre-option--active' : ''}`}
                onClick={handleClearGenres}
              >
                {t('categories.all')} ({movies.length})
              </button>
              {uniqueGenres.map((genre) => (
                <button
                  key={genre}
                  className={`filters-modal-genre-option ${selectedGenres.includes(genre) ? 'filters-modal-genre-option--active' : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {t(`filters.genres.${genre}`, genre)} ({getGenreCount(genre)})
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

export default FilterGenre;
