import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfileLanguageModal.css';

const ProfileLanguageModal = ({ onClose, onLanguageChange, currentLanguage }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);

  const languages = [
    { code: 'uz', image: '/img/uzb-by.jpg', label: 'UZ' },
    { code: 'ru', image: '/img/rubay.png', label: 'RU' },
  ];

  const handleSave = () => {
    if (selectedLang !== currentLanguage) {
      onLanguageChange(selectedLang);
    }
    onClose();
  };

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth > 768) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    setDragY(0);
  };

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div className="profile-lang-modal-overlay" onClick={onClose} />
      <div
        ref={modalRef}
        className={`profile-lang-modal ${dragY > 0 ? 'profile-lang-modal-dragging' : ''}`}
        style={{ '--drag-y': `${dragY}px` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="profile-lang-modal-drag-handle" />
        <div className="profile-lang-modal-header">
          <h3 className="profile-lang-modal-title">{t('profile.appLanguage')}</h3>
          <button
            className="profile-lang-modal-close profile-lang-modal-close-desktop"
            onClick={onClose}
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>
        <div className="profile-lang-modal-content">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`profile-lang-modal-item ${selectedLang === lang.code ? 'active' : ''}`}
              onClick={() => setSelectedLang(lang.code)}
            >
              <img
                src={lang.image}
                alt={lang.label}
                className="profile-lang-modal-flag"
              />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
        <div className="profile-lang-modal-footer">
          <button className="profile-lang-modal-save" onClick={handleSave}>
            {t('profile.save')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileLanguageModal;
