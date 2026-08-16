import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura YOPIQ — yuqorida joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura OCHIQ — kichik gap, modal visualViewport ni to‘ldiradi */
const TOP_OPEN_MIN = 16;
const TOP_OPEN_MAX = 32;

const KB_DETECT_PX = 55;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

const openTopGap = (vvH) =>
  Math.round(Math.min(TOP_OPEN_MAX, Math.max(TOP_OPEN_MIN, vvH * 0.03)));

/**
 * Modal doim visualViewport ichida:
 * top + height → footer har doim klaviatura USTIDA.
 * bottom ishlatilmaydi (bo‘shliq/ostida qolish yo‘q).
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const inputFocusRef = useRef(false);
  const baselineVvHRef = useRef(0);
  const baselineInnerHRef = useRef(0);
  const blurTimerRef = useRef(0);
  const metricsRef = useRef({ top: 0, height: 0, keyboard: false });

  const commitLayout = useCallback((top, height, keyboard) => {
    const t = Math.max(0, Math.round(top));
    const h = Math.max(240, Math.round(height));
    const prev = metricsRef.current;
    if (
      Math.abs(prev.top - t) < 2 &&
      Math.abs(prev.height - h) < 2 &&
      prev.keyboard === keyboard
    ) {
      return;
    }
    metricsRef.current = { top: t, height: h, keyboard };
    setSheetTop(t);
    setSheetHeight(h);
    setKeyboardOpen(keyboard);
    keyboardRef.current = keyboard;
  }, []);

  const layoutFromViewport = useCallback(
    (forceKeyboard) => {
      const vv = window.visualViewport;
      const innerH = window.innerHeight;
      const vvH = vv ? vv.height : innerH;
      const vvTop = vv ? vv.offsetTop : 0;

      const shrink = Math.max(
        0,
        Math.round(baselineVvHRef.current - vvH),
        Math.round(baselineInnerHRef.current - vvH)
      );
      const rawInset = vv
        ? Math.max(0, Math.round(innerH - vvH - vv.offsetTop))
        : 0;
      const kbGuess = Math.max(shrink, rawInset);

      let keyboard = forceKeyboard === true || keyboardRef.current;
      if (forceKeyboard === false) keyboard = false;
      else if (kbGuess > KB_DETECT_PX || (inputFocusRef.current && kbGuess > 35)) {
        keyboard = true;
      } else if (!inputFocusRef.current && kbGuess < 30) {
        keyboard = false;
      }

      const gap = keyboard
        ? openTopGap(vvH)
        : closedTopGap(baselineInnerHRef.current || innerH);

      /* Visual viewport ichida pin — past = vv pastki cheti = klaviatura usti */
      const top = vvTop + gap;
      const height = Math.max(240, vvH - gap);
      commitLayout(top, height, keyboard);
    },
    [commitLayout]
  );

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      metricsRef.current = { top: 0, height: 0, keyboard: false };
      setSheetTop(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    const vv = window.visualViewport;
    baselineInnerHRef.current = window.innerHeight;
    baselineVvHRef.current = vv ? vv.height : window.innerHeight;
    keyboardRef.current = false;
    layoutFromViewport(false);
  }, [active, layoutFromViewport]);

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
    if (!active) return undefined;
    const vv = window.visualViewport;
    if (!vv || !isCommentsSheetViewport()) return undefined;

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        layoutFromViewport();
      });
    };

    layoutFromViewport();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [active, layoutFromViewport]);

  const keepScrollLocked = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    if (document.body.style.position === 'fixed') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    } else {
      window.scrollTo(0, scrollYRef.current);
    }
  }, []);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    window.clearTimeout(blurTimerRef.current);
    keepScrollLocked();
    layoutFromViewport(true);
    /* Klaviatura animatsiyasi tugaguncha qayta pin */
    window.setTimeout(() => layoutFromViewport(true), 50);
    window.setTimeout(() => layoutFromViewport(true), 150);
    window.setTimeout(() => layoutFromViewport(true), 300);
  }, [keepScrollLocked, layoutFromViewport]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => {
      if (inputFocusRef.current) return;
      layoutFromViewport(false);
    }, 200);
  }, [layoutFromViewport]);

  return {
    sheetTop,
    sheetHeight,
    keyboardOpen,
    keepScrollLocked,
    onModalInputFocus,
    onModalInputBlur,
  };
}
