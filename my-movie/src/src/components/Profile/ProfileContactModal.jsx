import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT_DATA } from '../../data/socialLinks';
import './ProfileSheetModal.css';

const ProfileContactModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);

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
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div className="profile-sheet-modal-overlay" onClick={onClose} />
      <div
        className={`profile-sheet-modal ${dragY > 0 ? 'profile-sheet-modal-dragging' : ''}`}
        style={{ '--drag-y': `${dragY}px` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="profile-sheet-modal-drag-handle" />
        <div className="profile-sheet-modal-header">
          <h3 className="profile-sheet-modal-title">{t('profile.contactUs')}</h3>
          <button
            className="profile-sheet-modal-close profile-sheet-modal-close-desktop"
            onClick={onClose}
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>
        <div className="profile-sheet-modal-content">
          <a
            href={CONTACT_DATA.telegram.link}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-sheet-modal-item profile-sheet-modal-link"
          >
            <img
              src={CONTACT_DATA.telegram.icon}
              alt="Telegram"
              className="profile-sheet-modal-icon"
            />
            <span>{CONTACT_DATA.telegram.label}</span>
          </a>
          <div className="profile-sheet-modal-item profile-sheet-modal-email">
            <svg className="profile-sheet-modal-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <a href={`mailto:${CONTACT_DATA.email.address}`} className="profile-sheet-modal-email-link">
              {CONTACT_DATA.email.address}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileContactModal;
