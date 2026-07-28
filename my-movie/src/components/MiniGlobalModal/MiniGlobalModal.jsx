import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './MiniGlobalModal.css';

const ANIMATION_MS = 240;

const MiniGlobalModal = ({ isOpen, onClose, title = '', children }) => {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setClosing(false);
      setMounted(false);
    }, ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!mounted) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !closing) onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mounted, closing, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`mini-global-modal-overlay${closing ? ' mini-global-modal-overlay--closing' : ''}`}
      onClick={() => {
        if (!closing) onClose?.();
      }}
      role="presentation"
    >
      <div
        className={`mini-global-modal${closing ? ' mini-global-modal--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h3 className="mini-global-modal-title">{title}</h3> : null}
        <div className="mini-global-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default MiniGlobalModal;
