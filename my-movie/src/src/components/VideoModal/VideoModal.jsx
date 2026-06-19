import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MusicVideoPlayer from '../../Music/MusicVideoPlayer/MusicVideoPlayer';
import LikeButton from '../../Music/LikeButton/LikeButton';
import ShareButton from '../../components/ShareButton/ShareButton';
import '../../pages/ActorsPage.css';
import './VideoModal.css';
import { primeVideoDraphyThumb } from '../../utils/primeVideoDraphyThumb';

const MOBILE_MAX = 759;
const DRAG_CLOSE_PX = 96;
/** Sheet yopilish animatsiyasi — CSS transition bilan mos */
const SHEET_EXIT_MS = 310;

const getIsMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;

const VideoModal = ({
  isOpen,
  onClose,
  src,
  title = '',
  poster,
  videoId,
  videoLike,
  videoDislike,
  relatedVideos = [],
  onSelectVideo,
  relatedVideosLabel = 'Boshqa videolar',
}) => {
  const videoRef = useRef(null);
  const dragStartY = useRef(0);
  const exitTimerRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const [isMobile, setIsMobile] = useState(getIsMobileViewport);
  /** Mobil sheet: pastdan chiqish — birinchi freym 100%, keyin active */
  const [sheetEntered, setSheetEntered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Modal ochiq: sahifa scroll yo‘q; yopilganda avvalgi scroll tiklanadi (mobil barqaror) */
  useEffect(() => {
    if (!isOpen || !src) return;

    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!isOpen || !src) {
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
      return;
    }
    if (v) {
      v.play().catch(() => {});
    }
  }, [isOpen, src]);

  useEffect(() => {
    if (!isOpen) setDragY(0);
  }, [isOpen]);

  useEffect(() => {
    if (isExiting) setDragY(0);
  }, [isExiting]);

  useLayoutEffect(() => {
    if (!isOpen || !src || !isMobile) {
      setSheetEntered(false);
      setIsExiting(false);
      return;
    }
    setSheetEntered(false);
    setIsExiting(false);
    /* Bitta rAF: boshlang‘ich transform chiziladi, keyingi freymda surilish boshlanadi (ikki rAF “qotib” turadi) */
    const id = requestAnimationFrame(() => {
      setSheetEntered(true);
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, src, isMobile]);

  useEffect(() => () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    if (getIsMobileViewport()) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setIsExiting(true);
      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        setIsExiting(false);
        onClose?.();
      }, SHEET_EXIT_MS);
    } else {
      onClose?.();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const onDragTouchStart = (e) => {
    if (!isMobile) return;
    dragStartY.current = e.touches[0].clientY;
  };

  const onDragTouchMove = (e) => {
    if (!isMobile) return;
    const y = e.touches[0].clientY;
    const diff = y - dragStartY.current;
    if (diff > 0) setDragY(diff);
  };

  const onDragTouchEnd = () => {
    if (!isMobile) return;
    if (dragY > DRAG_CLOSE_PX) {
      handleClose();
    }
    setDragY(0);
  };

  if (!isOpen || !src) return null;

  /** Inline transform faqat tortishda — aks holda CSS sheet animatsiyasi ishlaydi */
  const sheetStyle =
    isMobile && dragY > 0 ? { transform: `translate3d(0, ${dragY}px, 0)` } : undefined;
  const showRelatedList = relatedVideos.length > 1 && onSelectVideo;

  const isSameRelatedItem = (item) => {
    if (item?.id != null && videoId != null) {
      return String(item.id) === String(videoId);
    }
    return item?.src === src;
  };

  const showFooter = Boolean(title) || videoId != null;
  const footerBlock =
    showFooter ? (
      <div className="video-modal-footer">
        {title ? <h2 className="video-modal-title">{title}</h2> : null}
        {videoId != null && (
          <div className="video-modal-footer-actions">
            <LikeButton
              key={String(videoId)}
              contentId={String(videoId)}
              initialLikeCount={Number(videoLike) || 0}
              initialDislikeCount={Number(videoDislike) || 0}
              className="video-modal-like-btn"
            />
            <ShareButton movie={{ title: title || '' }} dropdownInPortal />
          </div>
        )}
      </div>
    ) : null;

  const relatedBlock = showRelatedList ? (
      <div className={`video-modal-related${isMobile ? '' : ' video-modal-related--desktop-scroll'}`}>
        <h3 className="actors-page-media-heading video-modal-related-heading">{relatedVideosLabel}</h3>
        <div className="actors-page-media-row actors-page-media-row--split video-modal-related-row">
          <div className="actors-page-video-draphy-block video-modal-related-draphy-block">
            <div className="actors-page-video-draphy-list">
              {relatedVideos.map((item, idx) => {
                const isActive = isSameRelatedItem(item);
                return (
                <div
                  key={item.id != null ? `rv-${item.id}` : `${item.src}-${idx}`}
                  role="button"
                  tabIndex={0}
                  aria-current={isActive ? 'true' : undefined}
                  className={`actors-page-video-draphy-item actors-page-video-draphy-item--modal-trigger${
                    isActive ? ' video-modal-related-item--active' : ''
                  }`}
                  onClick={() => onSelectVideo(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectVideo(item);
                    }
                  }}
                >
                  <div className="actors-page-video-draphy-video-wrap">
                    <video
                      className="actors-page-video-draphy-video"
                      src={item.src}
                      muted
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => primeVideoDraphyThumb(e.currentTarget)}
                    />
                  </div>
                  <div className="actors-page-video-draphy-info">
                    {item.title ? (
                      <div className="actors-page-video-draphy-title">{item.title}</div>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return createPortal(
    <>
      <div
        className={`video-modal-overlay${isExiting ? ' video-modal-overlay--closing' : ''}`}
        onClick={handleClose}
        role="presentation"
      />
      <div
        className={`video-modal ${isMobile ? 'video-modal--sheet' : 'video-modal--desktop'}${
          isMobile && sheetEntered && !isExiting ? ' video-modal--sheet-active' : ''
        }${isMobile && isExiting ? ' video-modal--sheet-exiting' : ''}${
          isMobile && dragY > 0 ? ' video-modal--dragging' : ''
        }`}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Video'}
      >
        {isMobile ? (
          <header
            className="video-modal-sheet-header"
            onTouchStart={onDragTouchStart}
            onTouchMove={onDragTouchMove}
            onTouchEnd={onDragTouchEnd}
          >
            <div className="video-modal-drag-handle" aria-hidden />
            <div className="video-modal-toolbar video-modal-toolbar--sheet">
              <button
                type="button"
                className="video-modal-close"
                onClick={handleClose}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </header>
        ) : (
          <div className="video-modal-toolbar">
            <button
              type="button"
              className="video-modal-close"
              onClick={handleClose}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        {isMobile ? (
          <>
            <div className="video-modal-content-wrap">
              <div className="video-modal-primary">
                <div className="video-modal-body">
                  <div
                    key={videoId != null ? `play-${videoId}` : src}
                    className="video-modal-music-shell video-modal-music-shell--sheet"
                  >
                    <MusicVideoPlayer ref={videoRef} src={src} poster={poster} autoPlay />
                  </div>
                </div>
                {footerBlock}
              </div>
            </div>
            {relatedBlock}
          </>
        ) : (
          <div className="video-modal-content-wrap video-modal-content-wrap--desktop">
            <div className="video-modal-primary">
              <div className="video-modal-body">
                <div
                  key={videoId != null ? `play-${videoId}` : src}
                  className="video-modal-music-shell video-modal-music-shell--desktop"
                >
                  <MusicVideoPlayer ref={videoRef} src={src} poster={poster} autoPlay />
                </div>
              </div>
              {footerBlock}
            </div>
            {relatedBlock}
          </div>
        )}
      </div>
    </>,
    document.body
  );
};

export default VideoModal;
