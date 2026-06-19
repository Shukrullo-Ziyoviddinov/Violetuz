import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getShareUrl } from '../../config/api';
import './ShareButton.css';

const MOBILE_BREAKPOINT = 768;
const DRAG_THRESHOLD = 8;

const ShareButton = ({ movie, dropdownInPortal = false, portalTarget = null }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modalTranslateY, setModalTranslateY] = useState(0);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMovieTitle = () => {
    if (movie?.title && typeof movie.title === 'object') {
      return movie.title[contentLang] || movie.title.uz || movie.title.ru;
    }
    return movie?.title || '';
  };

  const shareUrl = getShareUrl(location.pathname);
  const shareText = getMovieTitle();

  const shareLinks = [
    {
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ];

  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    if (isOpen && dropdownInPortal && dropdownRef.current && !isMobileView) {
      const updatePosition = () => {
        if (!dropdownRef.current) return;
        const btnRect = dropdownRef.current.getBoundingClientRect();
        const DROPDOWN_WIDTH = 180;
        const GAP = 8;
        let left = btnRect.left;
        if (left + DROPDOWN_WIDTH > window.innerWidth - GAP) {
          left = window.innerWidth - DROPDOWN_WIDTH - GAP;
        }
        if (left < GAP) left = GAP;
        setDropdownStyle({
          position: 'fixed',
          top: btnRect.bottom + GAP,
          left,
          right: 'auto',
          zIndex: 9999,
        });
      };
      requestAnimationFrame(updatePosition);
    }
  }, [isOpen, dropdownInPortal, isMobileView]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isMobileView && dropdownRef.current && !dropdownInPortal) {
        const inWrapper = dropdownRef.current.contains(e.target);
        const inDropdown = e.target.closest('.share-button-dropdown');
        if (!inWrapper && !inDropdown) setIsOpen(false);
      }
    };
    if (isOpen && !isMobileView && !dropdownInPortal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobileView, dropdownInPortal]);

  useEffect(() => {
    if (isOpen && (isMobileView || (dropdownInPortal && !isMobileView))) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobileView, dropdownInPortal]);

  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    if (!isMobileView) return;
    const y = e.touches[0].clientY;
    setTouchStart(y);
    setTouchEnd(y);
    touchStartRef.current = y;
  };

  const handleTouchMove = useCallback((e) => {
    if (!isMobileView || touchStartRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > DRAG_THRESHOLD) {
      e.preventDefault();
      setIsDragging(true);
      setModalTranslateY(diff);
      setTouchEnd(currentY);
    } else {
      setIsDragging(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
      touchStartRef.current = null;
    }
  }, [isMobileView]);

  const handleTouchEnd = () => {
    if (!isMobileView || touchStartRef.current === null) return;
    const distance = touchEnd !== null ? touchEnd - touchStartRef.current : 0;
    if (distance <= DRAG_THRESHOLD) {
      setIsDragging(false);
      setModalTranslateY(0);
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    const modalHeight = modalRef.current ? modalRef.current.offsetHeight : 300;
    const closeThreshold = modalHeight * 0.35;
    if (distance > closeThreshold) {
      closeModal();
    }
    setIsDragging(false);
    setModalTranslateY(0);
    setTouchStart(null);
    setTouchEnd(null);
    touchStartRef.current = null;
  };

  // Touch handlers with passive: false to allow preventDefault (fixes console warning)
  useEffect(() => {
    const el = modalRef.current;
    if (!el || !isOpen || !isMobileView) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [isOpen, isMobileView, handleTouchMove]);

  const handleShare = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
    closeModal();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  if (!movie) return null;

  const renderContent = () => (
    <>
      <div className="share-modal-drag-zone">
        <div className="share-modal-drag-handle" />
        <div className="share-modal-header">
          <h3 className="share-modal-title">{t('share.share')}</h3>
        </div>
      </div>
      <div className="share-modal-body">
        {shareLinks.map((link) => (
          <button
            key={link.name}
            className="share-modal-item"
            onClick={() => handleShare(link.url)}
          >
            <span className="share-modal-icon">{link.icon}</span>
            <span>{link.name}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="share-button-wrapper" ref={dropdownRef}>
      <button
        className="share-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('share.share')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {isOpen && (
        <>
          {isMobileView ? createPortal(
            <div
              className="share-modal-overlay"
              onClick={handleOverlayClick}
            >
              <div
                ref={modalRef}
                className={`share-modal-content share-modal-content--mobile ${isDragging ? 'share-modal-content--dragging' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ transform: `translateY(${modalTranslateY}px)` }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {renderContent()}
              </div>
            </div>,
            document.body
          ) : dropdownInPortal ? createPortal(
            <div
              className="share-modal-overlay share-modal-overlay--desktop"
              onClick={handleOverlayClick}
            >
              <div
                className="share-modal-content share-modal-content--desktop"
                onClick={(e) => e.stopPropagation()}
              >
                {renderContent()}
              </div>
            </div>,
            document.body
          ) : (
            <div className="share-button-dropdown">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  className="share-button-dropdown-item"
                  onClick={() => handleShare(link.url)}
                >
                  <span className="share-button-icon">{link.icon}</span>
                  <span>{link.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShareButton;
