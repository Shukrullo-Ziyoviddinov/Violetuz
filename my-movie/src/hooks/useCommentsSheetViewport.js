import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const KB_MIN = 36;
const OVERLAY_CLOSE_BLOCK_MS = 700;
const FOOTER_FALLBACK_H = 140;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (h) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, h * TOP_CLOSED_RATIO)));

/**
 * Modal joyida.
 * Footer: visualViewport PASTIGA pin (top = vvBottom - footerH).
 * → kb/navbar o‘zgarsa ham input VV pastida = klaviatura ustida, bushliqsiz.
 * → yopilganda VV bilan birga pastga tushadi.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetHeight, setSheetHeight] = useState(0);
  const [footerTop, setFooterTop] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [footerSpacer, setFooterSpacer] = useState(FOOTER_FALLBACK_H);

  const scrollYRef = useRef(0);
  const focusedRef = useRef(false);
  const floatingRef = useRef(false);
  const baselineHRef = useRef(0);
  const footerHRef = useRef(FOOTER_FALLBACK_H);
  const blurTimerRef = useRef(0);
  const blockOverlayRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef([]);
  const footerElRef = useRef(null);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const readFooterHeight = useCallback(() => {
    const el = footerElRef.current;
    if (el) {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 40) {
        footerHRef.current = h;
        setFooterSpacer(h);
        return h;
      }
    }
    return footerHRef.current || FOOTER_FALLBACK_H;
  }, []);

  /** VV pastki cheti (layout koordinatasida) */
  const visualBottom = useCallback(() => {
    const vv = window.visualViewport;
    if (!vv) return window.innerHeight;
    return vv.offsetTop + vv.height;
  }, []);

  const kbLikelyOpen = useCallback(() => {
    const vv = window.visualViewport;
    const inner = window.innerHeight;
    const base = baselineHRef.current || inner;
    const vkH = Math.round(navigator.virtualKeyboard?.boundingRect?.height || 0);
    if (vkH >= KB_MIN) return true;
    if (!vv) return false;
    const gap = inner - vv.offsetTop - vv.height;
    if (gap >= KB_MIN) return true;
    if (base - vv.height >= KB_MIN) return true;
    return false;
  }, []);

  const dockFooter = useCallback(() => {
    floatingRef.current = false;
    setKeyboardOpen(false);
    setFooterTop(null);
  }, []);

  /** Footerni VV pastiga mahkamlash */
  const pinFooterToVv = useCallback(() => {
    const vvBottom = visualBottom();
    const fh = readFooterHeight();
    const top = Math.max(0, Math.round(vvBottom - fh));
    floatingRef.current = true;
    setKeyboardOpen(true);
    setFooterTop(top);
  }, [readFooterHeight, visualBottom]);

  const sync = useCallback(() => {
    if (focusedRef.current) {
      pinFooterToVv();
      return;
    }
    /* Blur: kb hali bor — VV bilan pastga; yo‘q — dock */
    if (floatingRef.current && kbLikelyOpen()) {
      pinFooterToVv();
      return;
    }
    if (floatingRef.current && !kbLikelyOpen()) {
      dockFooter();
    }
  }, [dockFooter, kbLikelyOpen, pinFooterToVv]);

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
      floatingRef.current = false;
      clearTimers();
      window.clearTimeout(blurTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setSheetHeight(0);
      setFooterTop(null);
      setKeyboardOpen(false);
      return;
    }
    const h = window.innerHeight;
    baselineHRef.current = h;
    setSheetHeight(Math.max(240, h - closedTopGap(h)));
    dockFooter();
  }, [active, dockFooter]);

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
    pinFooterToVv();
    [30, 80, 150, 250, 400, 600, 850].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) pinFooterToVv();
        }, ms)
      );
    });
  }, [pinFooterToVv]);

  const onModalInputBlur = useCallback(() => {
    focusedRef.current = false;
    clearTimers();
    window.clearTimeout(blurTimerRef.current);
    /* Kb animatsiyasi bilan pastga — VV sync */
    sync();
    [50, 120, 200, 320, 450, 600].forEach((ms) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (focusedRef.current) return;
          sync();
        }, ms)
      );
    });
    blurTimerRef.current = window.setTimeout(() => {
      if (!focusedRef.current) dockFooter();
    }, 750);
  }, [dockFooter, sync]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayRef.current,
    []
  );

  const setFooterRef = useCallback((node) => {
    footerElRef.current = node;
  }, []);

  return {
    sheetBottom: 0,
    sheetHeight,
    /** null = oddiy flow; number = fixed top (px) */
    footerTop,
    keyboardOpen,
    footerSpacer,
    setFooterRef,
    onModalInputFocus,
    onModalInputBlur,
    canCloseFromOverlay,
  };
}
