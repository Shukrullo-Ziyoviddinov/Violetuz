import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PullToRefreshLoader from './PullToRefreshLoader';
import './PullToRefresh.css';

const THRESHOLD = 80;
const MOBILE_MAX_WIDTH = 768;
const MAX_DROP_RATIO = 0.22;

const DISABLED_ROUTES = ['/shorts', '/music/shorts'];

const MODAL_SELECTOR = [
  '.movie-detail-comments-modal',
  '.shorts-modal-content',
  '.shorts-music-modal',
  '.filters-modal-overlay',
  '.global-modal-dialog',
  '.message-modal--open',
  '.message-search-modal--open',
  '.music-detail-lyrics-modal',
  '.video-modal--sheet',
  '.video-modal--desktop',
  '.share-modal-content',
  '.navbar-mobile-search-overlay',
  '.watch-modal-overlay',
  '.trailer-modal-overlay',
  '.comentaria-history-modal',
].join(', ');

const getMaxDrop = () =>
  typeof window !== 'undefined' ? window.innerHeight * MAX_DROP_RATIO : 280;

const isMobileViewport = () =>
  window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;

const shouldIgnoreTarget = (target) => {
  if (!target || !(target instanceof Element)) return true;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;
  if (target.closest(MODAL_SELECTOR)) return true;
  return false;
};

const isScrollAtTop = (target) => {
  if (window.scrollY > 1) return false;

  let el = target instanceof Element ? target : null;
  while (el && el !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(el);
    const isScrollContainer =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      el.scrollHeight > el.clientHeight + 1;

    if (isScrollContainer && el.scrollTop > 1) return false;
    el = el.parentElement;
  }

  return true;
};

const PullToRefresh = ({ children }) => {
  const location = useLocation();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [maxDrop, setMaxDrop] = useState(getMaxDrop);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);

  const isDisabled = DISABLED_ROUTES.includes(location.pathname);

  const resetPull = useCallback(() => {
    pullingRef.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  }, []);

  const triggerRefresh = useCallback(() => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setIsRefreshing(true);
    pullDistanceRef.current = maxDrop;
    setPullDistance(maxDrop);

    window.setTimeout(() => {
      setIsHiding(true);
      window.setTimeout(() => {
        window.location.reload();
      }, 380);
    }, 700);
  }, [maxDrop]);

  useEffect(() => {
    const onResize = () => setMaxDrop(getMaxDrop());
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    resetPull();
    refreshingRef.current = false;
    setIsRefreshing(false);
    setIsHiding(false);
  }, [location.pathname, resetPull]);

  useEffect(() => {
    if (isDisabled) return undefined;

    const onTouchStart = (e) => {
      if (!isMobileViewport() || refreshingRef.current) return;
      if (shouldIgnoreTarget(e.target)) return;
      if (!isScrollAtTop(e.target)) return;

      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || refreshingRef.current) return;

      if (!isScrollAtTop(e.target)) {
        resetPull();
        return;
      }

      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      e.preventDefault();
      const damped = Math.min(delta * 0.55, maxDrop);
      pullDistanceRef.current = damped;
      setPullDistance(damped);
    };

    const onTouchEnd = () => {
      if (!pullingRef.current || refreshingRef.current) return;

      pullingRef.current = false;

      if (pullDistanceRef.current >= THRESHOLD) {
        triggerRefresh();
        return;
      }

      resetPull();
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isDisabled, maxDrop, resetPull, triggerRefresh]);

  const visible = pullDistance > 0 || isRefreshing || isHiding;
  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const dropY = isRefreshing || isHiding ? maxDrop : Math.min(pullDistance, maxDrop);
  const isLoading = isRefreshing && !isHiding;
  const isPulling = visible && !isRefreshing && !isHiding;
  const isMusicTheme = location.pathname.startsWith('/music');
  const theme = isMusicTheme ? 'music' : 'movie';

  const indicatorClass = [
    'pull-to-refresh-indicator',
    visible && 'pull-to-refresh-indicator--visible',
    isRefreshing && 'pull-to-refresh-indicator--refreshing',
    isHiding && 'pull-to-refresh-indicator--hiding',
    !isRefreshing && !isHiding && pullDistance > 0 && 'pull-to-refresh-indicator--pulling',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={indicatorClass}
        style={{
          '--ptr-drop': `${dropY}px`,
          '--ptr-max-drop': `${maxDrop}px`,
          '--ptr-progress': progress,
        }}
        aria-hidden="true"
      >
        <div
          className={`pull-to-refresh-indicator-inner pull-to-refresh-indicator-inner--${theme}${isLoading ? ' pull-to-refresh-indicator-inner--loading' : ''}`}
        >
          <PullToRefreshLoader
            theme={theme}
            progress={progress}
            isLoading={isLoading}
            isPulling={isPulling}
          />
        </div>
      </div>
      {children}
    </>
  );
};

export default PullToRefresh;
