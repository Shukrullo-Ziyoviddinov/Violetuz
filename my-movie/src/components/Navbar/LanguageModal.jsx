import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageModal.css';

const LanguageModal = ({ onClose, onLanguageChange, currentLanguage }) => {
  const { t } = useTranslation();

  const languages = [
    { code: 'uz', image: '/img/uzb-by.jpg', name: t('language.uzbek') },
    { code: 'ru', image: '/img/rubay.png', name: t('language.russian') }
  ];

  return (
    <>
      <div className="language-modal-overlay" onClick={onClose}></div>
      <div className="language-modal-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="language-modal-flags">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-modal-flag-item ${currentLanguage === lang.code ? 'active' : ''}`}
              onClick={() => {
                onLanguageChange(lang.code);
                onClose();
              }}
            >
              <img
                src={lang.image}
                alt={lang.name}
                className="language-modal-flag-image"
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default LanguageModal;
