import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';
const GAP_RATIO = 0.16;
const GAP_MIN = 100;
const GAP_MAX = 168;
const GAP_KEYBOARD = 8;
const KB_DELTA = 80;
const OVERLAY_CLOSE_BLOCK_MS = 700;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const restGap = (visibleH) =>
  Math.round(Math.min(GAP_MAX, Math.max(GAP_MIN, visibleH * GAP_RATIO)));

/**
 * Komment sheet — faqat visualViewport.
 * Footer har doim ko‘rinadigan zonaning pastida (klaviatura ustida).
 * Yuqori har doim navbar ostida. bottom hisobi yo‘q.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const restVisHRef = useRef(0);
  const blockOverlayRef = useRef(0);
  const rafRef = useRef(0);

  const layout = useCallback(() => {
    const vv = window.visualViewport;
    const visTop = vv ? Math.round(vv.offsetTop) : 0;
    const visH = vv ? Math.round(vv.height) : window.innerHeight;

    if (!restVisHRef.current) restVisHRef.current = visH;

    const kbOpen = restVisHRef.current - visH >= KB_DELTA;
    const gap = kbOpen ? GAP_KEYBOARD : restGap(visH);

    setKeyboardOpen(kbOpen);
    setSheetTop(visTop + gap);
    setSheetHeight(Math.max(180, visH - gap));
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      layout();
    });
  }, [layout]);

  useLayoutEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      restVisHRef.current = 0;
      setSheetTop(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    const vv = window.visualViewport;
    restVisHRef.current = vv ? Math.round(vv.height) : window.innerHeight;
    layout();
  }, [active, layout]);

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
    const vk = navigator.virtualKeyboard;
    try {
      if (vk) vk.overlaysContent = true;
    } catch {
      /* ignore */
    }

    if (vv) {
      vv.addEventListener('resize', schedule);
      vv.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', schedule);
    vk?.addEventListener?.('geometrychange', schedule);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (vv) {
        vv.removeEventListener('resize', schedule);
        vv.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
      vk?.removeEventListener?.('geometrychange', schedule);
    };
  }, [active, schedule]);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    blockOverlayRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    layout();
  }, [layout]);

  const onModalInputBlur = useCallback(() => {
    layout();
  }, [layout]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayRef.current,
    []
  );

  return {
    sheetTop,
    sheetHeight,
    keyboardOpen,
    onModalInputFocus,
    onModalInputBlur,
    canCloseFromOverlay,
  };
}
