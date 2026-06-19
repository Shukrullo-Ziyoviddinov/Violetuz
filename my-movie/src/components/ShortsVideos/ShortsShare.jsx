import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getShareUrl } from '../../config/api';
import './ShortsShare.css';

const MOBILE_BREAKPOINT = 768;
const DRAG_THRESHOLD = 8;

const ShortsShare = ({ shortItem, onOpenChange }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const [isShortsShareOpen, setIsShortsShareOpen] = useState(false);
  const [isShortsMobileView, setIsShortsMobileView] = useState(false);
  const [isShortsDragging, setIsShortsDragging] = useState(false);
  const [shortsModalTranslateY, setShortsModalTranslateY] = useState(0);
  const shortsDropdownRef = useRef(null);
  const shortsModalRef = useRef(null);

  useEffect(() => {
    const check = () => setIsShortsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getShortsTitle = () => {
    if (!shortItem) return '';
    if (shortItem.title && typeof shortItem.title === 'object') {
      return shortItem.title[contentLang] || shortItem.title.uz || shortItem.title.ru;
    }
    return shortItem.title || '';
  };

  const shortsSharePath = shortItem ? `/shorts?shortId=${shortItem.id}` : '/shorts';
  const shortsShareUrl = getShareUrl(shortsSharePath);
  const shortsShareText = getShortsTitle();

  const shortsShareLinks = [
    {
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(shortsShareUrl)}&text=${encodeURIComponent(shortsShareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(shortsShareText + ' ' + shortsShareUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortsShareUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shortsShareUrl)}&text=${encodeURIComponent(shortsShareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ];

  const closeShortsShareModal = () => {
    setIsShortsShareOpen(false);
    onOpenChange?.(false);
  };


  useEffect(() => {
    if (isShortsShareOpen && isShortsMobileView) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isShortsShareOpen, isShortsMobileView]);

  const shortsTouchStartRef = useRef(null);

  const shortsTouchEndRef = useRef(null);

  const handleShortsTouchStart = (e) => {
    if (!isShortsMobileView) return;
    const y = e.touches[0].clientY;
    shortsTouchStartRef.current = y;
    shortsTouchEndRef.current = y;
  };

  const handleShortsTouchMove = useCallback((e) => {
    if (!isShortsMobileView || shortsTouchStartRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - shortsTouchStartRef.current;
    if (diff > DRAG_THRESHOLD) {
      e.preventDefault();
      setIsShortsDragging(true);
      setShortsModalTranslateY(diff);
      shortsTouchEndRef.current = currentY;
    } else {
      setIsShortsDragging(false);
      setShortsModalTranslateY(0);
      shortsTouchStartRef.current = null;
    }
  }, [isShortsMobileView]);

  const handleShortsTouchEnd = (e) => {
    if (!isShortsMobileView || shortsTouchStartRef.current === null) return;
    const endY = e.changedTouches?.[0]?.clientY ?? shortsTouchEndRef.current;
    const distance = endY - shortsTouchStartRef.current;
    if (distance <= DRAG_THRESHOLD) {
      setIsShortsDragging(false);
      setShortsModalTranslateY(0);
      shortsTouchStartRef.current = null;
      return;
    }
    const modalHeight = shortsModalRef.current ? shortsModalRef.current.offsetHeight : 300;
    const closeThreshold = modalHeight * 0.35;
    if (distance > closeThreshold) {
      closeShortsShareModal();
    }
    setIsShortsDragging(false);
    setShortsModalTranslateY(0);
    shortsTouchStartRef.current = null;
  };

  useEffect(() => {
    const el = shortsModalRef.current;
    if (!el || !isShortsShareOpen || !isShortsMobileView) return;
    el.addEventListener('touchmove', handleShortsTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleShortsTouchMove);
  }, [isShortsShareOpen, isShortsMobileView, handleShortsTouchMove]);

  const handleShortsShare = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
    closeShortsShareModal();
  };

  const handleShortsOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeShortsShareModal();
  };

  const openShortsShareModal = () => {
    setIsShortsShareOpen(true);
    onOpenChange?.(true);
  };

  if (!shortItem) return null;

  const renderShortsShareContent = () => (
    <>
      <div className="shorts-share-drag-zone">
        <div className="shorts-share-drag-handle" />
        <div className="shorts-share-header">
          <h3 className="shorts-share-title">{t('share.share')}</h3>
        </div>
      </div>
      <div className="shorts-share-body">
        {shortsShareLinks.map((link) => (
          <button
            key={link.name}
            className="shorts-share-item"
            onClick={() => handleShortsShare(link.url)}
          >
            <span className="shorts-share-icon">{link.icon}</span>
            <span>{link.name}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="shorts-share-wrapper" ref={shortsDropdownRef}>
      <button
        type="button"
        className="shorts-share-trigger-btn"
        onClick={(e) => { e.stopPropagation(); openShortsShareModal(); }}
        aria-label={t('share.share')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>

      {isShortsShareOpen && createPortal(
        <div
          className={`shorts-share-overlay ${isShortsMobileView ? 'shorts-share-overlay-mobile' : 'shorts-share-overlay-desktop'}`}
          onClick={handleShortsOverlayClick}
        >
          <div
            ref={shortsModalRef}
            className={`shorts-share-modal-content ${isShortsMobileView ? 'shorts-share-modal-mobile' : 'shorts-share-modal-desktop'} ${isShortsDragging ? 'shorts-share-modal-dragging' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={isShortsMobileView ? { transform: `translateY(${shortsModalTranslateY}px)` } : undefined}
            onTouchStart={handleShortsTouchStart}
            onTouchEnd={handleShortsTouchEnd}
          >
            {renderShortsShareContent()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ShortsShare;
