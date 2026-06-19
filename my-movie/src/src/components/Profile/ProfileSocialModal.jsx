import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SOCIAL_LINKS } from '../../data/socialLinks';
import './ProfileSheetModal.css';

const ProfileSocialModal = ({ onClose }) => {
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

  const socialItems = [
    { key: 'telegram', ...SOCIAL_LINKS.telegram },
    { key: 'instagram', ...SOCIAL_LINKS.instagram },
    { key: 'youtube', ...SOCIAL_LINKS.youtube },
    { key: 'tiktok', ...SOCIAL_LINKS.tiktok },
  ];

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
          <h3 className="profile-sheet-modal-title">{t('profile.socialNetworks')}</h3>
          <button
            className="profile-sheet-modal-close profile-sheet-modal-close-desktop"
            onClick={onClose}
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>
        <div className="profile-sheet-modal-content">
          {socialItems.map((item) => (
            <a
              key={item.key}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-sheet-modal-item profile-sheet-modal-link"
            >
              <img
                src={item.icon}
                alt={item.label}
                className="profile-sheet-modal-icon"
              />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProfileSocialModal;
