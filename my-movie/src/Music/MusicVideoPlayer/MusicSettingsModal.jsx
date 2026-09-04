import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import '../../components/MovieDetail/WatchSettingsModal.css';

const MOBILE_MQ = '(max-width: 768px)';

const MusicSettingsModal = ({
  isOpen,
  onClose,
  anchorRef,
  playbackSpeed,
  onSpeedChange,
  speedOptions = [1, 1.5, 2],
}) => {
  const { t } = useTranslation();
  const [view, setView] = useState('main'); // main | speed
  const [animDir, setAnimDir] = useState('forward');
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
  );
  const [desktopPos, setDesktopPos] = useState({ bottom: 80, right: 24 });
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || isMobile || !anchorRef?.current) return;

    const updatePos = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setDesktopPos({
        bottom: Math.max(12, window.innerHeight - rect.top + 10),
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen, isMobile, anchorRef]);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setView('main');
      setAnimDir('forward');
      setRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (rendered) {
      setVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setRendered(false);
        setView('main');
        setDragY(0);
        closeTimerRef.current = null;
      }, 280);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (view !== 'main') goBack();
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, view, onClose]);

  const goTo = (next) => {
    setAnimDir('forward');
    setView(next);
  };

  const goBack = () => {
    setAnimDir('back');
    setView('main');
  };

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    if (dragY > 80) onClose();
    setDragY(0);
  };

  if (!rendered) return null;

  const title = view === 'speed' ? t('player.speed') : t('player.settings');

  const modal = (
    <>
      <div
        className={`watch-settings-modal-backdrop ${visible ? 'show' : ''} ${isMobile ? 'is-mobile' : 'is-desktop'}`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className={`watch-settings-modal ${visible ? 'show' : ''} ${dragY > 0 ? 'dragging' : ''} ${isMobile ? 'is-mobile' : 'is-desktop'}`}
        style={
          isMobile
            ? { '--drag-y': `${dragY}px` }
            : {
                bottom: desktopPos.bottom,
                right: desktopPos.right,
              }
        }
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          handleTouchMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleTouchEnd(e);
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t('player.settings')}
      >
        <div className="watch-settings-modal-handle" />
        <div className="watch-settings-modal-header">
          {view !== 'main' ? (
            <button
              type="button"
              className="watch-settings-modal-back"
              onClick={goBack}
              aria-label={t('player.back')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          ) : (
            <span className="watch-settings-modal-back-spacer" />
          )}
          <h3 className="watch-settings-modal-title">{title}</h3>
          <button
            type="button"
            className="watch-settings-modal-close"
            onClick={onClose}
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>

        <div className="watch-settings-modal-body">
          <div
            key={view}
            className={`watch-settings-modal-panel watch-settings-modal-panel--${animDir}`}
          >
            {view === 'main' && (
              <div className="watch-settings-modal-list">
                <button
                  type="button"
                  className="watch-settings-modal-row"
                  onClick={() => goTo('speed')}
                >
                  <span>{t('player.speed')}</span>
                  <span className="watch-settings-modal-row-value">
                    {playbackSpeed}x
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              </div>
            )}

            {view === 'speed' && (
              <div className="watch-settings-modal-list">
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`watch-settings-modal-option ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => {
                      onSpeedChange(speed);
                      goBack();
                    }}
                  >
                    {speed}x
                    {playbackSpeed === speed && <span className="watch-settings-modal-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};

export default MusicSettingsModal;
