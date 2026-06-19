import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Toast.css';

const TOAST_TRANSLATIONS = {
  notRegistered: {
    uz: "Siz ro'yxatdan o'tmagansiz",
    ru: 'Вы не зарегистрированы',
    en: 'You are not registered',
  },
};

const Toast = ({ messageKey = 'notRegistered', message, onClose, duration = 4000 }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'uz').toLowerCase().split('-')[0];
  const displayMessage = message || TOAST_TRANSLATIONS[messageKey]?.[lang] || TOAST_TRANSLATIONS.notRegistered.uz;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast" role="alert">
      <span className="toast-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </span>
      <span className="toast-message">{displayMessage}</span>
    </div>
  );
};

export default Toast;
