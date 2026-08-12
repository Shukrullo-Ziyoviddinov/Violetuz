import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { fetchAllTrillers } from '../../api/trillersApi';
import VideoPlayerControls from '../VideoPlayerControls/VideoPlayerControls';
import TrillerSideCard from './TrillerSideCard';
import MediaGenreFilter from './MediaGenreFilter';
import TrillerMetaRow from './TrillerMetaRow';
import TrillerDescription from './TrillerDescription';
import MovieComments from '../MovieDetail/MovieComments';
import './Triller.css';

const MOBILE_MAX = 900;
const SHEET_ACTIVATE_PX = 18;
const SHEET_FLING_VELOCITY = 0.72;
const SHEET_FLING_MIN_RATIO = 0.18;
const SHEET_SETTLE_MS = 420;

const emptySheetDrag = () => ({
  active: false,
  mode: null,
  startY: 0,
  startX: 0,
  canDrag: false,
  locked: false,
  rawDy: 0,
  lastY: 0,
  lastT: 0,
  velocity: 0,
});

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX;

const getSheetThreshold = () =>
  (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.35;

const Triller = ({ activeId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const scrollRef = useRef(null);
  const pinRef = useRef(null);
  const mobileTitleRef = useRef(null);
  const filterPinnedRef = useRef(false);
  const sheetDragRef = useRef(emptySheetDrag());
  const isImmersiveVideoRef = useRef(false);
  const sheetSettlingRef = useRef(null);
  const settleTimerRef = useRef(null);

  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [isImmersiveVideo, setIsImmersiveVideo] = useState(false);
  const [sheetDragProgress, setSheetDragProgress] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [sheetGesture, setSheetGesture] = useState(null);
  const [sheetSettling, setSheetSettling] = useState(null);
  const [sheetSnap, setSheetSnap] = useState(false);

  const { data: list = [], isPending, isError } = useQuery({
    queryKey: ['trillers', 'with-description'],
    queryFn: fetchAllTrillers,
  });

  const activeTriller = useMemo(() => {
    if (!list.length) return null;
    const found = list.find((item) => String(item.id) === String(activeId));
    return found || list[0];
  }, [list, activeId]);

  const sideTrillers = useMemo(() => {
    if (!activeTriller) return list;
    return list.filter((item) => item.id !== activeTriller.id);
  }, [list, activeTriller]);

  const genreOptions = useMemo(() => {
    const map = new Map();
    for (const item of list) {
      const genre = item?.trillerGenre;
      if (!genre || typeof genre !== 'object') continue;
      const id = String(genre.uz || genre.ru || '').trim();
      if (!id || map.has(id)) continue;
      map.set(id, {
        id,
        label: getLocalizedField(genre, contentLang) || id,
      });
    }
    return Array.from(map.values());
  }, [list, contentLang]);

  const filteredSideTrillers = useMemo(() => {
    if (selectedGenre === 'all') return sideTrillers;
    return sideTrillers.filter(
      (item) => String(item?.trillerGenre?.uz || '').trim() === selectedGenre
    );
  }, [sideTrillers, selectedGenre]);

  const videoSrc = getLocalizedField(activeTriller?.video, contentLang);
  const title = getLocalizedField(activeTriller?.title, contentLang);
  const poster = getLocalizedField(activeTriller?.videoImg, contentLang);
  const forYouTitle = t('triller.forYou', 'Sizga yoqadi');
  const commentsMovieId =
    activeTriller?.id != null ? `triller:${String(activeTriller.id)}` : '';

  const setSheetProgress = (progress) => {
    setSheetDragProgress(Math.max(0, Math.min(1, progress)));
  };

  const clearSettleTimer = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const resetSheetVisual = () => {
    setSheetProgress(0);
    setIsSheetDragging(false);
    setSheetGesture(null);
    setSheetSettling(null);
    sheetSettlingRef.current = null;
    sheetDragRef.current = emptySheetDrag();
  };

  const snapThenClearMotion = (apply) => {
    setSheetSnap(true);
    apply();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetSnap(false));
    });
  };

  const animateCommitExpand = () => {
    if (sheetSettlingRef.current === 'expand') return;
    clearSettleTimer();
    setIsSheetDragging(false);
    setSheetGesture('expand');
    setSheetSettling('expand');
    sheetSettlingRef.current = 'expand';
    requestAnimationFrame(() => setSheetProgress(1));
    settleTimerRef.current = setTimeout(() => {
      sheetSettlingRef.current = null;
      snapThenClearMotion(() => {
        isImmersiveVideoRef.current = true;
        setIsImmersiveVideo(true);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetProgress(0);
      });
    }, SHEET_SETTLE_MS);
  };

  const animateCommitCollapse = () => {
    if (sheetSettlingRef.current === 'collapse') return;
    clearSettleTimer();
    setIsSheetDragging(false);
    setSheetGesture('collapse');
    setSheetSettling('collapse');
    sheetSettlingRef.current = 'collapse';
    requestAnimationFrame(() => setSheetProgress(1));
    settleTimerRef.current = setTimeout(() => {
      sheetSettlingRef.current = null;
      snapThenClearMotion(() => {
        isImmersiveVideoRef.current = false;
        setIsImmersiveVideo(false);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetProgress(0);
      });
    }, SHEET_SETTLE_MS);
  };

  const collapseImmersiveVideo = ({ instant = false } = {}) => {
    if (!instant && isMobileViewport() && isImmersiveVideoRef.current && !sheetSettlingRef.current) {
      animateCommitCollapse();
      return;
    }
    clearSettleTimer();
    isImmersiveVideoRef.current = false;
    setIsImmersiveVideo(false);
    resetSheetVisual();
  };

  const expandImmersiveVideo = ({ instant = false } = {}) => {
    if (!instant && isMobileViewport() && !isImmersiveVideoRef.current && !sheetSettlingRef.current) {
      animateCommitExpand();
      return;
    }
    clearSettleTimer();
    isImmersiveVideoRef.current = true;
    setIsImmersiveVideo(true);
    resetSheetVisual();
  };

  const updateSheetVelocity = (clientY) => {
    const now = performance.now();
    const prev = sheetDragRef.current;
    const dt = Math.max(now - (prev.lastT || now), 1);
    const vy = (clientY - (prev.lastY || clientY)) / dt;
    sheetDragRef.current.lastY = clientY;
    sheetDragRef.current.lastT = now;
    sheetDragRef.current.velocity = prev.velocity * 0.65 + vy * 0.35;
  };

  const shouldCommitSheet = (rawAbs, velocitySigned, direction) => {
    const threshold = getSheetThreshold();
    if (rawAbs >= threshold) return true;
    const flingOk =
      direction === 'expand'
        ? velocitySigned >= SHEET_FLING_VELOCITY
        : velocitySigned <= -SHEET_FLING_VELOCITY;
    return flingOk && rawAbs >= threshold * SHEET_FLING_MIN_RATIO;
  };

  /* Expand: scroll-area tepada, pastga tortish */
  const handleSheetTouchStart = (e) => {
    if (!isMobileViewport() || isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl || scrollEl.scrollTop > 2) return;
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    sheetDragRef.current = {
      active: true,
      mode: 'expand',
      startY: touch.clientY,
      startX: touch.clientX,
      canDrag: true,
      locked: false,
      rawDy: 0,
      lastY: touch.clientY,
      lastT: now,
      velocity: 0,
    };
  };

  const handleSheetTouchMove = (e) => {
    const drag = sheetDragRef.current;
    if (
      !drag.active ||
      drag.mode !== 'expand' ||
      !drag.canDrag ||
      isImmersiveVideoRef.current ||
      sheetSettlingRef.current
    ) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    const rawDy = touch.clientY - drag.startY;
    const dx = Math.abs(touch.clientX - drag.startX);

    if (rawDy < -SHEET_ACTIVATE_PX && !drag.locked) {
      sheetDragRef.current.canDrag = false;
      resetSheetVisual();
      return;
    }

    if (rawDy <= 0) return;

    if (!drag.locked) {
      if (rawDy < SHEET_ACTIVATE_PX || rawDy < dx * 1.15) return;
      sheetDragRef.current.locked = true;
      setSheetGesture('expand');
      setIsSheetDragging(true);
    }

    if (e.cancelable) e.preventDefault();
    updateSheetVelocity(touch.clientY);
    sheetDragRef.current.rawDy = rawDy;
    const threshold = getSheetThreshold();
    setSheetProgress(Math.min(rawDy / (threshold * 1.25), 1));
  };

  const handleSheetTouchEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'expand') return;
    const rawDy = drag.rawDy;
    const velocity = drag.velocity;
    const wasLocked = drag.locked;
    sheetDragRef.current = emptySheetDrag();
    setIsSheetDragging(false);

    if (wasLocked && shouldCommitSheet(rawDy, velocity, 'expand')) {
      expandImmersiveVideo();
    } else {
      setSheetGesture(null);
      requestAnimationFrame(() => setSheetProgress(0));
    }
  };

  const isCollapseIgnoreTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest('.trailer-modal-control-btn') ||
        target.closest('.trailer-modal-progress-container') ||
        target.closest('.trailer-modal-icon-btn') ||
        target.closest('input') ||
        target.closest('.trailer-modal-speed-menu')
    );
  };

  /* Collapse: video pin ichida yuqoriga */
  const handleCollapseTouchStart = (e) => {
    if (!isMobileViewport() || !isImmersiveVideoRef.current || sheetSettlingRef.current) return;
    if (isCollapseIgnoreTarget(e.target)) return;
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    sheetDragRef.current = {
      active: true,
      mode: 'collapse',
      startY: touch.clientY,
      startX: touch.clientX,
      canDrag: true,
      locked: false,
      rawDy: 0,
      lastY: touch.clientY,
      lastT: now,
      velocity: 0,
    };
  };

  const handleCollapseTouchMove = (e) => {
    const drag = sheetDragRef.current;
    if (
      !drag.active ||
      drag.mode !== 'collapse' ||
      !drag.canDrag ||
      !isImmersiveVideoRef.current ||
      sheetSettlingRef.current
    ) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    const rawDy = touch.clientY - drag.startY;
    const upDy = -rawDy;
    const dx = Math.abs(touch.clientX - drag.startX);

    if (rawDy > SHEET_ACTIVATE_PX && !drag.locked) {
      sheetDragRef.current.canDrag = false;
      resetSheetVisual();
      return;
    }

    if (upDy <= 0) return;

    if (!drag.locked) {
      if (upDy < SHEET_ACTIVATE_PX || upDy < dx * 1.15) return;
      sheetDragRef.current.locked = true;
      setSheetGesture('collapse');
      setIsSheetDragging(true);
    }

    if (e.cancelable) e.preventDefault();
    updateSheetVelocity(touch.clientY);
    sheetDragRef.current.rawDy = rawDy;
    const threshold = getSheetThreshold();
    setSheetProgress(Math.min(upDy / (threshold * 1.25), 1));
  };

  const handleCollapseTouchEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag.active || drag.mode !== 'collapse') return;
    const upDy = Math.max(-drag.rawDy, 0);
    const velocity = drag.velocity;
    const wasLocked = drag.locked;
    const threshold = getSheetThreshold();
    const progressSnapshot = Math.min(upDy / (threshold * 1.25), 1);
    sheetDragRef.current = emptySheetDrag();
    setIsSheetDragging(false);

    if (wasLocked && shouldCommitSheet(upDy, velocity, 'collapse')) {
      collapseImmersiveVideo();
    } else if (wasLocked && progressSnapshot > 0.02) {
      requestAnimationFrame(() => {
        setSheetProgress(0);
        requestAnimationFrame(() => setSheetGesture(null));
      });
    } else {
      setSheetGesture(null);
      setSheetProgress(0);
    }
  };

  const handleExpandToggle = (e) => {
    e?.stopPropagation?.();
    if (isImmersiveVideoRef.current || isImmersiveVideo) collapseImmersiveVideo();
    else expandImmersiveVideo();
  };

  useEffect(() => {
    setSelectedGenre('all');
    setShowGenreFilter(false);
    filterPinnedRef.current = false;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    collapseImmersiveVideo({ instant: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTriller?.id]);

  useEffect(() => {
    isImmersiveVideoRef.current = isImmersiveVideo;
  }, [isImmersiveVideo]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    []
  );

  const sheetHandlersRef = useRef({
    onExpandMove: handleSheetTouchMove,
    onCollapseMove: handleCollapseTouchMove,
  });
  sheetHandlersRef.current.onExpandMove = handleSheetTouchMove;
  sheetHandlersRef.current.onCollapseMove = handleCollapseTouchMove;

  /* touchmove: preventDefault uchun non-passive */
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const pinEl = pinRef.current;
    if (!scrollEl && !pinEl) return undefined;

    const onScrollMove = (e) => sheetHandlersRef.current.onExpandMove(e);
    const onPinMove = (e) => sheetHandlersRef.current.onCollapseMove(e);

    scrollEl?.addEventListener('touchmove', onScrollMove, { passive: false });
    pinEl?.addEventListener('touchmove', onPinMove, { passive: false });
    return () => {
      scrollEl?.removeEventListener('touchmove', onScrollMove);
      pinEl?.removeEventListener('touchmove', onPinMove);
    };
  }, [activeTriller?.id, isPending, isError]);
  const handleScrollAreaScroll = () => {
    if (isImmersiveVideoRef.current) return;
    const root = scrollRef.current;
    const titleEl = mobileTitleRef.current;
    if (!root || !titleEl) return;

    const threshold = Math.max(titleEl.offsetHeight - 2, 0);
    const top = root.scrollTop;

    if (top >= threshold) {
      if (!filterPinnedRef.current) {
        filterPinnedRef.current = true;
        setShowGenreFilter(true);
      }
      return;
    }

    if (top <= 8) {
      if (filterPinnedRef.current) {
        filterPinnedRef.current = false;
        setShowGenreFilter(false);
      }
    }
  };

  useLayoutEffect(() => {
    if (!filterPinnedRef.current || isImmersiveVideo) return;
    const root = scrollRef.current;
    const titleEl = mobileTitleRef.current;
    if (!root || !titleEl) return;

    const threshold = Math.max(titleEl.offsetHeight, 0);
    root.scrollTop = threshold;
    setShowGenreFilter(true);
  }, [selectedGenre, isImmersiveVideo]);

  const handleGenreSelect = (id) => {
    filterPinnedRef.current = true;
    setShowGenreFilter(true);
    setSelectedGenre(id);
  };

  const handleSelect = (item) => {
    if (!item?.id) return;
    navigate(`/triller/${item.id}`, { replace: true });
  };

  if (isPending) {
    return (
      <div className="triller triller--empty">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (isError || !activeTriller) {
    return (
      <div className="triller triller--empty">
        <p>Triller topilmadi</p>
      </div>
    );
  }

  const trillerClassName = [
    'triller',
    isImmersiveVideo ? 'triller--immersive' : '',
    isSheetDragging ? 'triller--sheet-dragging' : '',
    sheetGesture === 'collapse' || sheetSettling === 'collapse' ? 'triller--collapsing' : '',
    sheetSettling === 'expand' ? 'triller--expanding' : '',
    sheetSnap ? 'triller--snap' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const trillerStyle = isMobileViewport()
    ? { '--triller-sheet-progress': sheetDragProgress }
    : undefined;

  return (
    <div className={trillerClassName} style={trillerStyle}>
      <div className="triller-main">
        <div className="triller-primary">
          <div
            className="triller-pin"
            ref={pinRef}
            onTouchStart={handleCollapseTouchStart}
            onTouchEnd={handleCollapseTouchEnd}
            onTouchCancel={handleCollapseTouchEnd}
          >
            <div className="triller-player-frame">
              <VideoPlayerControls
                src={videoSrc ? encodeURI(videoSrc) : ''}
                poster={poster || undefined}
                resetKey={activeTriller.id}
                videoClassName="trailer-modal-video"
                objectFit={isImmersiveVideo ? 'contain' : 'cover'}
                onExpandToggle={isMobileViewport() ? handleExpandToggle : undefined}
                expanded={isImmersiveVideo}
              />
            </div>
          </div>
          <div className="triller-primary-info">
            {title ? (
              <h1 className="triller-player-title triller-player-title--desktop">{title}</h1>
            ) : null}
            <TrillerMetaRow
              className="triller-meta-row--desktop"
              trillerId={activeTriller.id}
              like={activeTriller.like}
              dislike={activeTriller.dislike}
              reytingImdb={activeTriller.reytingImdb}
              reytingKinopoisk={activeTriller.reytingKinopoisk}
              title={title}
              image={poster}
            />
            <TrillerDescription
              className="triller-description--desktop"
              description={activeTriller.description}
            />
            {commentsMovieId ? (
              <div className="triller-comments triller-comments--desktop">
                <MovieComments
                  key={`triller-comments-desktop-${activeTriller.id}`}
                  movieId={commentsMovieId}
                  previewLimit={4}
                  mobileSheetUi
                />
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={`triller-scroll-area${showGenreFilter ? ' is-filter-pinned' : ''}`}
          ref={scrollRef}
          onScroll={handleScrollAreaScroll}
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          onTouchCancel={handleSheetTouchEnd}
        >
          <div ref={mobileTitleRef} className="triller-scroll-head">
            {title ? (
              <h1 className="triller-player-title triller-player-title--mobile">{title}</h1>
            ) : null}

            <TrillerMetaRow
              className="triller-meta-row--mobile"
              trillerId={activeTriller.id}
              like={activeTriller.like}
              dislike={activeTriller.dislike}
              reytingImdb={activeTriller.reytingImdb}
              reytingKinopoisk={activeTriller.reytingKinopoisk}
              title={title}
              image={poster}
            />
            <TrillerDescription
              className="triller-description--mobile"
              description={activeTriller.description}
            />
            {commentsMovieId ? (
              <div className="triller-comments triller-comments--mobile">
                <MovieComments
                  key={`triller-comments-mobile-${activeTriller.id}`}
                  movieId={commentsMovieId}
                  previewLimit={1}
                  mobileSheetUi
                />
              </div>
            ) : null}
          </div>

          <div className={`triller-sticky-bar${showGenreFilter ? ' is-filter' : ''}`}>
            <h2 className="triller-side-title triller-side-title--pin triller-sticky-title">
              {forYouTitle}
            </h2>
            <div className="triller-sticky-filter" aria-hidden={!showGenreFilter}>
              <MediaGenreFilter
                genres={genreOptions}
                selectedId={selectedGenre}
                onSelect={handleGenreSelect}
              />
            </div>
          </div>

          <aside className="triller-side">
            <h2 className="triller-side-title triller-side-title--side">{forYouTitle}</h2>
            <div className="triller-side-list">
              {filteredSideTrillers.map((item) => (
                <TrillerSideCard key={item.id} triller={item} onSelect={handleSelect} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Triller;
