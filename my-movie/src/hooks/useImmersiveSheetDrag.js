import { useCallback, useEffect, useRef, useState } from 'react';

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

/**
 * Triller sahifasidagi immersive sheet drag:
 * - scroll tepada pastga tortish → video fullscreen
 * - immersive da video ustida yuqoriga tortish → oddiy holat
 */
const useImmersiveSheetDrag = ({
  mobileMax = 900,
  resetKey,
  collapseIgnoreSelector = [
    '.trailer-modal-control-btn',
    '.trailer-modal-progress-container',
    '.trailer-modal-icon-btn',
    '.trailer-modal-speed-menu',
    '.music-vp-control-btn',
    '.music-vp-progress-container',
    '.music-vp-icon-btn',
    '.music-vp-speed-menu',
    'input',
  ].join(','),
} = {}) => {
  const scrollRef = useRef(null);
  const pinRef = useRef(null);
  const sheetDragRef = useRef(emptySheetDrag());
  const isImmersiveRef = useRef(false);
  const sheetSettlingRef = useRef(null);
  const settleTimerRef = useRef(null);

  const [isImmersive, setIsImmersive] = useState(false);
  const [sheetDragProgress, setSheetDragProgress] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [sheetGesture, setSheetGesture] = useState(null);
  const [sheetSettling, setSheetSettling] = useState(null);
  const [sheetSnap, setSheetSnap] = useState(false);

  const isMobileViewport = useCallback(
    () => typeof window !== 'undefined' && window.innerWidth <= mobileMax,
    [mobileMax]
  );

  const getSheetThreshold = () =>
    (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.35;

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
        isImmersiveRef.current = true;
        setIsImmersive(true);
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
        isImmersiveRef.current = false;
        setIsImmersive(false);
        setSheetSettling(null);
        setSheetGesture(null);
        setSheetProgress(0);
      });
    }, SHEET_SETTLE_MS);
  };

  const collapseImmersive = useCallback(
    ({ instant = false } = {}) => {
      if (
        !instant &&
        isMobileViewport() &&
        isImmersiveRef.current &&
        !sheetSettlingRef.current
      ) {
        animateCommitCollapse();
        return;
      }
      clearSettleTimer();
      isImmersiveRef.current = false;
      setIsImmersive(false);
      resetSheetVisual();
    },
    [isMobileViewport]
  );

  const expandImmersive = useCallback(
    ({ instant = false } = {}) => {
      if (
        !instant &&
        isMobileViewport() &&
        !isImmersiveRef.current &&
        !sheetSettlingRef.current
      ) {
        animateCommitExpand();
        return;
      }
      clearSettleTimer();
      isImmersiveRef.current = true;
      setIsImmersive(true);
      resetSheetVisual();
    },
    [isMobileViewport]
  );

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

  const handleSheetTouchStart = (e) => {
    if (!isMobileViewport() || isImmersiveRef.current || sheetSettlingRef.current) return;
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
      isImmersiveRef.current ||
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
      expandImmersive();
    } else {
      setSheetGesture(null);
      requestAnimationFrame(() => setSheetProgress(0));
    }
  };

  const isCollapseIgnoreTarget = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(collapseIgnoreSelector));
  };

  const handleCollapseTouchStart = (e) => {
    if (!isMobileViewport() || !isImmersiveRef.current || sheetSettlingRef.current) return;
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
      !isImmersiveRef.current ||
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
      collapseImmersive();
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

  const handleExpandToggle = useCallback(
    (e) => {
      e?.stopPropagation?.();
      if (isImmersiveRef.current || isImmersive) collapseImmersive();
      else expandImmersive();
    },
    [collapseImmersive, expandImmersive, isImmersive]
  );

  useEffect(() => {
    isImmersiveRef.current = isImmersive;
  }, [isImmersive]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    collapseImmersive({ instant: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

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
  }, [resetKey]);

  const rootClassNames = [
    isImmersive ? 'is-immersive' : '',
    isSheetDragging ? 'is-sheet-dragging' : '',
    sheetGesture === 'collapse' || sheetSettling === 'collapse' ? 'is-collapsing' : '',
    sheetSettling === 'expand' ? 'is-expanding' : '',
    sheetSnap ? 'is-sheet-snap' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const sheetStyle = isMobileViewport()
    ? { '--video-detail-sheet-progress': sheetDragProgress }
    : undefined;

  return {
    scrollRef,
    pinRef,
    isImmersive,
    sheetDragProgress,
    isSheetDragging,
    sheetGesture,
    sheetSettling,
    sheetSnap,
    rootClassNames,
    sheetStyle,
    handleExpandToggle,
    expandImmersive,
    collapseImmersive,
    isMobileViewport,
    scrollTouchHandlers: {
      onTouchStart: handleSheetTouchStart,
      onTouchEnd: handleSheetTouchEnd,
      onTouchCancel: handleSheetTouchEnd,
    },
    pinTouchHandlers: {
      onTouchStart: handleCollapseTouchStart,
      onTouchEnd: handleCollapseTouchEnd,
      onTouchCancel: handleCollapseTouchEnd,
    },
  };
};

export default useImmersiveSheetDrag;
