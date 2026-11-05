import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ChannelMoreDropdown.css';

export default function ChannelMoreDropdown() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const resize = () => { if (window.innerWidth > 768) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="navbar-channel-more"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="navbar-mobile-action-btn navbar-channel-more-btn"
        aria-label={t('navbar.more', 'Yana')}
        aria-expanded={open}
        aria-controls="navbar-channel-more-dropdown"
        onClick={() => setOpen((previous) => !previous)}
      >
        <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
      </button>
      <div
        id="navbar-channel-more-dropdown"
        className={`navbar-channel-more-dropdown${open ? ' is-open' : ''}`}
        inert={!open}
      >
        <button type="button" className="navbar-channel-more-item">
          <i className="fa-solid fa-share-nodes" aria-hidden="true" />
          <span>{t('channel.share', 'Ulashish')}</span>
        </button>
        <button type="button" className="navbar-channel-more-item navbar-channel-more-item--delete">
          <i className="fa-solid fa-trash-can" aria-hidden="true" />
          <span>{t('channel.delete', "O'chirish")}</span>
        </button>
      </div>
    </div>
  );
}
