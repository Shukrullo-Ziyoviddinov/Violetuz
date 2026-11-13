import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useModalHardwareBack } from '../../useModalHardwareBack';
import NotificationsFilter from './NotificationsFilter';
import NotificationsEmpty from './NotificationsEmpty';
import './Notifications.css';

const MOBILE_QUERY = '(max-width: 768px)';

const useMobileNotifications = () => {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return mobile;
};

export const NotificationsModal = ({ onClose }) => {
  const { t } = useTranslation();
  const mobile = useMobileNotifications();
  const title = t('navbar.notifications', 'Bildirishnomalar');
  const [activeFilter, setActiveFilter] = useState('all');
  const [slideReady, setSlideReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const mobileRef = useRef(mobile);
  onCloseRef.current = onClose;
  mobileRef.current = mobile;

  const finishClose = () => {
    closingRef.current = false;
    onCloseRef.current?.();
  };

  const beginSlideClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setExiting(true);
  };

  const { releaseHistory } = useModalHardwareBack({
    historyKey: 'notificationsModal',
    isOpen: true,
    onCloseFromHardware: () => {
      if (!mobileRef.current) {
        onCloseRef.current?.();
        return;
      }
      beginSlideClose();
    },
  });

  const requestClose = () => {
    if (closingRef.current) return;
    if (!mobileRef.current) {
      releaseHistory();
      onCloseRef.current?.();
      return;
    }
    beginSlideClose();
    releaseHistory();
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const id = window.setTimeout(() => setSlideReady(true), 20);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!exiting) return undefined;
    const id = window.setTimeout(finishClose, 320);
    return () => window.clearTimeout(id);
  }, [exiting]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') requestCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const modalClass = [
    'notifications-modal',
    slideReady && !exiting ? 'notifications-modal--open' : '',
    exiting ? 'notifications-modal--closing' : '',
  ].filter(Boolean).join(' ');

  return createPortal(
    <div className="notifications-overlay" onClick={requestClose} role="presentation">
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="notifications-modal-header">
          {mobile ? (
            <button type="button" className="ib" aria-label="Orqaga" onClick={requestClose}>
              ‹
            </button>
          ) : null}
          <b className="notifications-modal-title">{title}</b>
          {mobile ? null : (
            <button
              type="button"
              className="notifications-modal-close"
              aria-label="Yopish"
              onClick={requestClose}
            >
              ×
            </button>
          )}
        </header>
        <NotificationsFilter active={activeFilter} onChange={setActiveFilter} />
        <div className="notifications-modal-body">
          <NotificationsEmpty filterId={activeFilter} />
        </div>
      </div>
    </div>,
    document.body
  );
};

const NotificationsBell = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="navbar-mobile-action-btn navbar-mobile-bell-btn"
        aria-label={t('navbar.notifications', 'Bildirishnomalar')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <i className="fa-solid fa-bell" aria-hidden="true" />
      </button>
      {open ? <NotificationsModal onClose={() => setOpen(false)} /> : null}
    </>
  );
};

export default NotificationsBell;
