import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_SAFE_GAP = 10;
const KB_MIN = 30;
const CLOSE_LOCK_MS = 450;
const OVERLAY_CLOSE_BLOCK_MS = 700;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

/**
 * Yopiq: bottom=0, top=auto, height=saqlangan.
 * Ochiq: visualViewport ga pin (top + height, bottom=auto).
 *   → navbar tushganda offsetTop/height yangilanadi:
 *     modal yuqorisi chrome ostida, footer kb ustida qoladi.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(null);
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const inputFocusRef = useRef(false);
  const baselineHRef = useRef(0);
  const closedHeightRef = useRef(0);
  const blurTimerRef = useRef(0);
  const closeLockUntilRef = useRef(0);
  const blockOverlayCloseUntilRef = useRef(0);
  const rafRef = useRef(0);
  const retryTimersRef = useRef([]);

  const clearRetries = () => {
    retryTimersRef.current.forEach((id) => window.clearTimeout(id));
    retryTimersRef.current = [];
  };

  const applyClosed = useCallback(() => {
    const h =
      closedHeightRef.current ||
      Math.max(
        240,
        (baselineHRef.current || window.innerHeight) -
          closedTopGap(baselineHRef.current || window.innerHeight)
      );
    setKeyboardOpen(false);
    setSheetTop(null);
    setSheetBottom(0);
    setSheetHeight(h);
  }, []);

  /** Modalni aynan visualViewport ichiga joylash */
  const pinToVisualViewport = useCallback((vv) => {
    const top = Math.max(0, Math.round(vv.offsetTop + TOP_SAFE_GAP));
    const height = Math.max(200, Math.round(vv.height - TOP_SAFE_GAP));
    setKeyboardOpen(true);
    setSheetTop(top);
    setSheetBottom(0);
    setSheetHeight(height);
  }, []);

  const applyFromViewport = useCallback(() => {
    if (Date.now() < closeLockUntilRef.current && !inputFocusRef.current) {
      applyClosed();
      return;
    }

    const focused = inputFocusRef.current;
    const vv = window.visualViewport;
    const innerH = window.innerHeight;
    const closedH = closedHeightRef.current || Math.round(innerH * 0.84);
    const baseH = baselineHRef.current || innerH;

    const vk = typeof navigator !== 'undefined' ? navigator.virtualKeyboard : null;
    const vkH = vk?.boundingRect?.height ? Math.round(vk.boundingRect.height) : 0;

    const layoutKb = vv
      ? Math.max(0, Math.round(innerH - vv.offsetTop - vv.height))
      : 0;
    const kbVisible =
      vkH >= KB_MIN ||
      layoutKb >= KB_MIN ||
      (vv && vv.height < baseH - KB_MIN);

    /* Kb yopilmoqda — VV bilan pastga kuzatish */
    if (!focused && kbVisible && vv) {
      pinToVisualViewport(vv);
      return;
    }

    if (!focused) {
      applyClosed();
      return;
    }

    if (!kbVisible) {
      setKeyboardOpen(false);
      setSheetTop(null);
      setSheetBottom(0);
      setSheetHeight(closedH);
      return;
    }

    /* Asosiy: VV pin — chrome tushsa ham top/footer to‘g‘ri */
    if (vv) {
      pinToVisualViewport(vv);
      return;
    }

    /* Faqat VirtualKeyboard */
    if (vkH >= KB_MIN) {
      setKeyboardOpen(true);
      setSheetTop(null);
      setSheetBottom(vkH);
      setSheetHeight(Math.max(200, Math.round(innerH - vkH - TOP_SAFE_GAP)));
    }
  }, [applyClosed, pinToVisualViewport]);

  const scheduleSync = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      applyFromViewport();
    });
  }, [applyFromViewport]);

  useLayoutEffect(() => {
    if (!active) {
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      clearRetries();
      closeLockUntilRef.current = 0;
      blockOverlayCloseUntilRef.current = 0;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setSheetTop(null);
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    const h = window.innerHeight;
    baselineHRef.current = h;
    closedHeightRef.current = Math.max(240, h - closedTopGap(h));
    applyClosed();
  }, [active, applyClosed]);

  useEffect(() => {
    if (!active || !isCommentsSheetViewport()) return undefined;
    const vk = navigator.virtualKeyboard;
    if (!vk || typeof vk.addEventListener !== 'function') return undefined;
    try {
      vk.overlaysContent = true;
    } catch {
      /* ignore */
    }
    vk.addEventListener('geometrychange', scheduleSync);
    return () => vk.removeEventListener('geometrychange', scheduleSync);
  }, [active, scheduleSync]);

  useEffect(() => {
    if (!active) return undefined;

    if (!isCommentsSheetViewport()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const y = scrollYRef.current;
    const body = document.body;
    const html = document.documentElement;

    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    const onTouchMove = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) {
        e.preventDefault();
        return;
      }
      if (bodyScrollSelector && t.closest(bodyScrollSelector)) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      html.style.overflow = '';
      html.style.overscrollBehavior = '';
      window.scrollTo(0, y);
    };
  }, [active, bodyScrollSelector]);

  useEffect(() => {
    if (!active || !isCommentsSheetViewport()) return undefined;

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', scheduleSync);
      vv.addEventListener('scroll', scheduleSync);
    }
    window.addEventListener('resize', scheduleSync);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (vv) {
        vv.removeEventListener('resize', scheduleSync);
        vv.removeEventListener('scroll', scheduleSync);
      }
      window.removeEventListener('resize', scheduleSync);
    };
  }, [active, scheduleSync]);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    window.clearTimeout(blurTimerRef.current);
    clearRetries();
    closeLockUntilRef.current = 0;
    blockOverlayCloseUntilRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    applyFromViewport();
    /* Chrome + kb animatsiyasi — uzoqroq kuzatish */
    [40, 100, 180, 280, 400, 550, 750, 1000].forEach((ms) => {
      retryTimersRef.current.push(
        window.setTimeout(() => {
          if (inputFocusRef.current) applyFromViewport();
        }, ms)
      );
    });
  }, [applyFromViewport]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    clearRetries();
    window.clearTimeout(blurTimerRef.current);
    applyFromViewport();
    blurTimerRef.current = window.setTimeout(() => {
      if (inputFocusRef.current) return;
      closeLockUntilRef.current = Date.now() + CLOSE_LOCK_MS;
      applyClosed();
    }, 400);
  }, [applyClosed, applyFromViewport]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayCloseUntilRef.current,
    []
  );

  return {
    sheetTop,
    sheetBottom,
    sheetHeight,
    keyboardOpen,
    onModalInputFocus,
    onModalInputBlur,
    canCloseFromOverlay,
  };
}
