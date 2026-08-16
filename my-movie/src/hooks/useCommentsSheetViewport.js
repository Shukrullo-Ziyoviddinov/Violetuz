import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const KB_MIN = 48;
const OVERLAY_CLOSE_BLOCK_MS = 700;
/** Footer taxminiy balandligi (spacer) */
const FOOTER_FALLBACK_H = 140;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (h) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, h * TOP_CLOSED_RATIO)));

/**
 * YANGI YO‘L — modal klaviaturaga tegmaydi.
 * Modal: ochilgandagi joyida qoladi (bottom=0, height=fixed).
 * Footer: kb ochiqda position:fixed + bottom=kbInset → input kb USTIDA.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [footerSpacer, setFooterSpacer] = useState(FOOTER_FALLBACK_H);

  const scrollYRef = useRef(0);
  const focusedRef = useRef(false);
  const baselineHRef = useRef(0);
  const blurTimerRef = useRef(0);
  const blockOverlayRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef([]);
  const footerElRef = useRef(null);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const measureInset = useCallback(() => {
    const inner = window.innerHeight;
    const base = baselineHRef.current || inner;
    const vv = window.visualViewport;
    const vkH = Math.round(navigator.virtualKeyboard?.boundingRect?.height || 0);

    let fromVv = 0;
    if (vv) {
      fromVv = Math.max(0, Math.round(inner - vv.offsetTop - vv.height));
    }
    const fromBase = vv ? Math.max(0, Math.round(base - vv.height)) : 0;
    const layoutShrunk = base - inner >= KB_MIN;

    /* Layout resize: inset 0 (footer fixed bottom:0 allaqachon kb ustida) */
    if (layoutShrunk && fromVv < KB_MIN && vkH < KB_MIN) {
      return 0;
    }

    return Math.max(vkH, fromVv, fromBase >= KB_MIN ? fromBase : 0);
  }, []);

  const applyKbClosed = useCallback(() => {
    focusedRef.current = false;
    setKeyboardOpen(false);
    setKeyboardInset(0);
  }, []);

  const applyKbOpen = useCallback(() => {
    let inset = measureInset();
    if (inset < KB_MIN && focusedRef.current) {
      inset = Math.round((baselineHRef.current || window.innerHeight) * 0.4);
    }
    if (inset < KB_MIN && !focusedRef.current) {
      applyKbClosed();
      return;
    }
    setKeyboardOpen(true);
    setKeyboardInset(Math.max(0, inset));

    const el = footerElRef.current;
    if (el) {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 40) setFooterSpacer(h);
    }
  }, [applyKbClosed, measureInset]);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (focusedRef.current) applyKbOpen();
      else applyKbClosed();
    });
  }, [applyKbClosed, applyKbOpen]);

  useLayoutEffect(() => {
    if (!active) {
      focusedRef.current = false;
      clearTimers();
      window.clearTimeout(blurTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setSheetHeight(0);
      setKeyboardInset(0);
      setKeyboardOpen(false);
      return;
    }
    const h = window.innerHeight;
    baselineHRef.current = h;
    setSheetHeight(Math.max(240, h - closedTopGap(h)));
    applyKbClosed();
  }, [active, applyKbClosed]);

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
    window.clearTimeout(blurTimerRef.current);
    clearTimers();
    blockOverlayRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    applyKbOpen();
    [40, 100, 180, 300, 450, 650, 900].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) applyKbOpen();
        }, ms)
      );
    });
  }, [applyKbOpen]);

  const onModalInputBlur = useCallback(() => {
    focusedRef.current = false;
    clearTimers();
    window.clearTimeout(blurTimerRef.current);
    applyKbClosed();
    blurTimerRef.current = window.setTimeout(() => {
      if (!focusedRef.current) applyKbClosed();
    }, 80);
  }, [applyKbClosed]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayRef.current,
    []
  );

  const setFooterRef = useCallback((node) => {
    footerElRef.current = node;
  }, []);

  return {
    /** Modal pastga yopishgan — kb da o‘zgarmaydi */
    sheetBottom: 0,
    sheetHeight,
    keyboardInset,
    keyboardOpen,
    footerSpacer,
    setFooterRef,
    onModalInputFocus,
    onModalInputBlur,
    canCloseFromOverlay,
  };
}
