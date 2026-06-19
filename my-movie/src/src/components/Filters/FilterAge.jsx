import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './FilterAge.css';

const FilterAge = ({ movies = [], selectedAge, onAgeSelect }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalTranslateY, setModalTranslateY] = useState(0);
  const modalRef = useRef(null);

  const uniqueAges = [...new Set(movies.map(m => m.ageRestriction).filter(Boolean))].sort((a, b) => a - b);

  const getAgeCount = (age) => {
    return movies.filter(m => m.ageRestriction === age).length;
  };

  const closeModal = () => setIsModalOpen(false);

  const handleAgeSelect = (age) => {
    onAgeSelect(age);
    closeModal();
  };

  const handleClearAge = () => {
    onAgeSelect(null);
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
        className={`filters-btn ${selectedAge !== null ? 'filters-btn--active' : ''}`}
        onClick={() => setIsModalOpen(true)}
        type="button"
      >
        <svg className="filters-btn-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {t('filters.age', 'Yosh')}
        {selectedAge !== null && (
          <span className="filters-btn-badge">
            {t(`filters.ages.${selectedAge}`, `${selectedAge}+`)}
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
            className={`filters-modal-age ${isDraggingModal ? 'filters-modal-age--dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `translateY(${modalTranslateY}px)` }}
          >
            <div
              className="filters-modal-age-drag-area"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="filters-modal-age-drag-handle" />
              <div className="filters-modal-age-header">
                <h3 className="filters-modal-age-title">{t('filters.age', 'Yosh')}</h3>
                <button className="filters-modal-age-close" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className="filters-modal-age-body">
              <button
                className={`filters-modal-age-option ${selectedAge === null ? 'filters-modal-age-option--active' : ''}`}
                onClick={handleClearAge}
              >
                {t('categories.all')} ({movies.length})
              </button>
              {uniqueAges.map((age) => (
                <button
                  key={age}
                  className={`filters-modal-age-option ${selectedAge === age ? 'filters-modal-age-option--active' : ''}`}
                  onClick={() => handleAgeSelect(age)}
                >
                  {t(`filters.ages.${age}`, `${age}+`)} ({getAgeCount(age)})
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

export default FilterAge;
