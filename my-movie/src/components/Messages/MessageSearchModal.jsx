import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './MessageSearchModal.css';

const MODAL_ANIMATION_MS = 360;

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const InputSearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const MessageSearchModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  const [slideReady, setSlideReady] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  const requestClose = useCallback(() => {
    if (isExiting) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsExiting(true);
    closeTimerRef.current = setTimeout(() => {
      setIsExiting(false);
      onClose?.();
    }, MODAL_ANIMATION_MS);
  }, [isExiting, onClose]);

  useLayoutEffect(() => {
    if (!open) {
      setSlideReady(false);
      setIsExiting(false);
      return;
    }
    setIsExiting(false);
    setSlideReady(false);
    setPanelKey((k) => k + 1);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => setSlideReady(true), 20);
    return () => clearTimeout(t);
  }, [open, panelKey]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, requestClose]);

  useEffect(() => {
    if (slideReady && !isExiting && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [slideReady, isExiting]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!open) return null;

  const overlayClass = `message-search-modal-overlay${
    slideReady && !isExiting ? ' message-search-modal-overlay--open' : ''
  }${isExiting ? ' message-search-modal-overlay--closing' : ''}`;
  const panelClass = `message-search-modal${
    slideReady && !isExiting ? ' message-search-modal--open' : ''
  }${isExiting ? ' message-search-modal--closing' : ''}`;

  return createPortal(
    <>
      <div className={overlayClass} onClick={requestClose} role="presentation" />
      <div
        key={panelKey}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label="Поиск пользователей"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="message-search-modal-top">
          <button type="button" className="message-search-modal-back" onClick={requestClose} aria-label="Назад">
            <BackIcon />
          </button>
          <div className="message-search-modal-field">
            <InputSearchIcon />
            <input
              ref={inputRef}
              type="search"
              className="message-search-modal-input"
              placeholder={t('feed.searchUsersPlaceholder')}
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
        </div>
        <div className="message-search-modal-body" aria-hidden />
      </div>
    </>,
    document.body
  );
};

export default MessageSearchModal;
