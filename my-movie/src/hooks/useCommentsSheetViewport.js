import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_SAFE = 10;
const KB_MIN = 80;
const OVERLAY_CLOSE_BLOCK_MS = 700;
const CLOSE_FORCE_MS = 900;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (h) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, h * TOP_CLOSED_RATIO)));

/**
 * Modal visualViewport ichida:
 * - footer = VV pasti = klaviatura usti
 * - yuqori = VV tepasi (navbar ichiga kirmaydi)
 * Yopilganda inset 0 bo‘lguncha kuzatiladi, keyin dock.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const focusedRef = useRef(false);
  const closingRef = useRef(false);
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

  const closedHeight = () =>
    closedHRef.current ||
    Math.max(
      240,
      (baselineHRef.current || window.innerHeight) -
        closedTopGap(baselineHRef.current || window.innerHeight)
    );

  const readVv = useCallback(() => {
    const inner = window.innerHeight;
    const vv = window.visualViewport;
    const vkH = Math.round(navigator.virtualKeyboard?.boundingRect?.height || 0);
    if (!vv) {
      return { inset: vkH, visH: inner };
    }
    const visH = Math.round(vv.height);
    const inset = Math.max(0, Math.round(inner - vv.offsetTop - visH), vkH);
    return { inset, visH };
  }, []);

  const applyClosed = useCallback(() => {
    closingRef.current = false;
    setKeyboardOpen(false);
    setSheetBottom(0);
    setSheetHeight(closedHeight());
  }, []);

  /** Modalni ko‘rinadigan zonaga mahkamlash (navbar + kb ichiga kirmasın) */
  const pinToVisible = useCallback(() => {
    const { inset, visH } = readVv();
    const closedH = closedHeight();
    const maxH = Math.max(200, visH - TOP_SAFE);
    const height = Math.min(closedH, maxH);

    setKeyboardOpen(true);
    setSheetBottom(inset);
    setSheetHeight(height);
  }, [readVv]);

  const sync = useCallback(() => {
    const { inset } = readVv();

    if (focusedRef.current) {
      closingRef.current = false;
      if (inset >= KB_MIN) pinToVisible();
      return;
    }

    if (closingRef.current) {
      if (inset >= KB_MIN) {
        pinToVisible();
        return;
      }
      applyClosed();
      return;
    }

    applyClosed();
  }, [applyClosed, pinToVisible, readVv]);

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
      closingRef.current = false;
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
    closingRef.current = false;
    window.clearTimeout(blurTimerRef.current);
    clearTimers();
    blockOverlayRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    sync();
    [40, 100, 180, 280, 400, 560, 800].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) sync();
        }, ms)
      );
    });
  }, [sync]);

  const onModalInputBlur = useCallback(() => {
    focusedRef.current = false;
    closingRef.current = true;
    clearTimers();
    window.clearTimeout(blurTimerRef.current);
    sync();
    [40, 100, 180, 280, 400, 560, 720].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) return;
          sync();
        }, ms)
      );
    });
    blurTimerRef.current = window.setTimeout(() => {
      if (focusedRef.current) return;
      /* Faqat kb allaqachon kichik bo‘lsa dock; aks holda pin qoladi */
      const { inset } = readVv();
      if (inset < KB_MIN) applyClosed();
    }, CLOSE_FORCE_MS);
  }, [applyClosed, readVv, sync]);

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
