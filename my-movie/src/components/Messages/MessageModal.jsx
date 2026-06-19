import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import MessageHeader from './MessageHeader';
import MessageSearchModal from './MessageSearchModal';
import './MessageModal.css';

const MODAL_ANIMATION_MS = 360;

const MessageModal = ({ open, onClose, messages = [] }) => {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [slideReady, setSlideReady] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const closeTimerRef = useRef(null);
  const hasMessages = Array.isArray(messages) && messages.length > 0;

  const requestClose = useCallback(() => {
    if (isExiting) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setSearchOpen(false);
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
      if (e.key !== 'Escape') return;
      if (!searchOpen) {
        requestClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, searchOpen, requestClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!open) return null;

  const overlayClass = `message-modal-overlay${
    slideReady && !isExiting ? ' message-modal-overlay--open' : ''
  }${isExiting ? ' message-modal-overlay--closing' : ''}`;
  const panelClass = `message-modal${slideReady && !isExiting ? ' message-modal--open' : ''}${
    isExiting ? ' message-modal--closing' : ''
  }`;

  return createPortal(
    <>
      <div className={overlayClass} onClick={requestClose} role="presentation" />
      <div
        key={panelKey}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageHeader onClose={requestClose} onOpenSearch={() => setSearchOpen(true)} />
        <div className="message-modal-body">
          {!hasMessages && (
            <div className="message-modal-empty">
              <img
                className="message-modal-empty-image"
                src="/img/messagiImg_preview_rev_1.png"
                alt=""
                aria-hidden="true"
              />
              <p className="message-modal-empty-text">{t('feed.messagesEmptyDescription')}</p>
              <div className="message-modal-empty-action">
                <button type="button" className="message-modal-empty-button" onClick={() => setSearchOpen(true)}>
                  <i className="fa-solid fa-message message-modal-empty-button-icon" aria-hidden="true" />
                  <span>{t('feed.sendMessage')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <MessageSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>,
    document.body
  );
};

export default MessageModal;
