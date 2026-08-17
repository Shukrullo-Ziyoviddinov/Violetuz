import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_SAFE = 8;
const KB_MIN = 36;
const OVERLAY_CLOSE_BLOCK_MS = 700;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (h) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, h * TOP_CLOSED_RATIO)));

/**
 * Modal + input klaviatura bilan BIRGA:
 * bottom = visualViewport pastidagi bo‘shliq (kb balandligi).
 * Footer modal ichida → alohida fixed yo‘q → input modal bilan sync.
 * Blur: inset 0 bo‘lguncha kuzatiladi → pastga birga tushadi.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const focusedRef = useRef(false);
  const trackingRef = useRef(false);
  const baselineHRef = useRef(0);
  const closedHRef = useRef(0);
  const blurTimerRef = useRef(0);
  const blockOverlayRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  /** Faqat VV — taxminsiz, bushliqsiz */
  const readInset = useCallback(() => {
    const vv = window.visualViewport;
    const inner = window.innerHeight;
    const vkH = Math.round(navigator.virtualKeyboard?.boundingRect?.height || 0);
    if (!vv) return vkH;
    const fromVv = Math.max(0, Math.round(inner - vv.offsetTop - vv.height));
    return Math.max(fromVv, vkH);
  }, []);

  const applyClosed = useCallback(() => {
    trackingRef.current = false;
    const h =
      closedHRef.current ||
      Math.max(
        240,
        (baselineHRef.current || window.innerHeight) -
          closedTopGap(baselineHRef.current || window.innerHeight)
      );
    setKeyboardOpen(false);
    setSheetBottom(0);
    setSheetHeight(h);
  }, []);

  const applyLift = useCallback(() => {
    const inset = readInset();
    const inner = window.innerHeight;
    const closedH = closedHRef.current || Math.round(inner * 0.84);
    const base = baselineHRef.current || inner;

    /* Layout resize (Android): inner allaqachon kichik */
    const layoutShrunk = base - inner >= KB_MIN;
    if (layoutShrunk && inset < KB_MIN) {
      trackingRef.current = true;
      setKeyboardOpen(true);
      setSheetBottom(0);
      setSheetHeight(Math.max(200, Math.min(closedH, inner - TOP_SAFE)));
      return;
    }

    if (inset < KB_MIN && !focusedRef.current) {
      applyClosed();
      return;
    }

    const bottom = inset >= KB_MIN ? inset : 0;
    if (bottom < KB_MIN && focusedRef.current) {
      /* Hali animatsiya — kutamiz, noto‘g‘ri taxmin qo‘ymaymiz */
      trackingRef.current = true;
      setKeyboardOpen(true);
      return;
    }

    const height = Math.max(200, Math.min(closedH, inner - bottom - TOP_SAFE));
    trackingRef.current = true;
    setKeyboardOpen(bottom >= KB_MIN);
    setSheetBottom(bottom);
    setSheetHeight(height);
  }, [applyClosed, readInset]);

  const sync = useCallback(() => {
    if (focusedRef.current || trackingRef.current) {
      applyLift();
      return;
    }
    applyClosed();
  }, [applyClosed, applyLift]);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      sync();
    });
  }, [sync]);

  useLayoutEffect(() => {
    if (!active) {
      focusedRef.current = false;
      trackingRef.current = false;
      clearTimers();
      window.clearTimeout(blurTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    const h = window.innerHeight;
    baselineHRef.current = h;
    closedHRef.current = Math.max(240, h - closedTopGap(h));
    applyClosed();
  }, [active, applyClosed]);

  useEffect(() => {
    if (!active || !isCommentsSheetViewport()) return undefined;
    const vk = navigator.virtualKeyboard;
    if (!vk?.addEventListener) return undefined;
    try {
      vk.overlaysContent = true;
    } catch {
      /* ignore */
    }
    vk.addEventListener('geometrychange', schedule);
    return () => vk.removeEventListener('geometrychange', schedule);
  }, [active, schedule]);

  useEffect(() => {
    if (!active) return undefined;
    if (!isCommentsSheetViewport()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }

    scrollYRef.current = window.scrollY || 0;
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
      if (t instanceof Element && bodyScrollSelector && t.closest(bodyScrollSelector)) return;
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
      vv.addEventListener('resize', schedule);
      vv.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', schedule);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (vv) {
        vv.removeEventListener('resize', schedule);
        vv.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
    };
  }, [active, schedule]);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    focusedRef.current = true;
    trackingRef.current = true;
    window.clearTimeout(blurTimerRef.current);
    clearTimers();
    blockOverlayRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    applyLift();
    [40, 100, 180, 280, 400, 560, 800].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) applyLift();
        }, ms)
      );
    });
  }, [applyLift]);

  const onModalInputBlur = useCallback(() => {
    focusedRef.current = false;
    clearTimers();
    window.clearTimeout(blurTimerRef.current);
    trackingRef.current = true;
    applyLift();
    [60, 140, 240, 360, 500, 700].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) return;
          applyLift();
        }, ms)
      );
    });
    blurTimerRef.current = window.setTimeout(() => {
      if (!focusedRef.current) applyClosed();
    }, 850);
  }, [applyClosed, applyLift]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayRef.current,
    []
  );

  return {
    sheetBottom,
    sheetHeight,
    keyboardOpen,
    onModalInputFocus,
    onModalInputBlur,
    canCloseFromOverlay,
  };
}
