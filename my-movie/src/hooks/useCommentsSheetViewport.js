import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura yopiq — yuqorida joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura ochiq — kichik yuqori gap */
const TOP_OPEN_MIN = 12;
const TOP_OPEN_MAX = 28;

const KB_PX = 50;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

const openTopGap = () => TOP_OPEN_MIN;

/**
 * Modal layout:
 * - yopiq: top=gap, bottom=0, height=screen-gap  (pastda bo‘shliq yo‘q)
 * - ochiq: top=kichik gap, bottom=klaviatura balandligi → footer klaviatura USTIDA
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(0);
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const inputFocusRef = useRef(false);
  const baselineVvHRef = useRef(0);
  const baselineInnerHRef = useRef(0);
  const blurTimerRef = useRef(0);
  const syncTimersRef = useRef([]);

  const clearSyncTimers = () => {
    syncTimersRef.current.forEach((id) => window.clearTimeout(id));
    syncTimersRef.current = [];
  };

  const applyClosed = useCallback(() => {
    const innerH = window.innerHeight;
    const top = closedTopGap(baselineInnerHRef.current || innerH);
    keyboardRef.current = false;
    setKeyboardOpen(false);
    setSheetTop(top);
    setSheetBottom(0);
    setSheetHeight(Math.max(240, innerH - top));
  }, []);

  const applyOpen = useCallback(() => {
    const vv = window.visualViewport;
    const innerH = window.innerHeight;
    const vvH = vv ? vv.height : innerH;
    const vvTop = vv ? vv.offsetTop : 0;

    /* Layout pastdagi klaviatura zonasi */
    const belowVv = Math.max(0, Math.round(innerH - vvTop - vvH));
    const vvShrink = Math.max(0, Math.round(baselineVvHRef.current - vvH));
    const innerShrink = Math.max(0, Math.round(baselineInnerHRef.current - vvH));
    const bottom = Math.max(belowVv, vvShrink, innerShrink);

    const top = openTopGap();
    keyboardRef.current = true;
    setKeyboardOpen(true);
    setSheetTop(top);
    setSheetBottom(Math.max(bottom, 0));
    /* height auto: top↔bottom orasini to‘ldiradi — footer bottom da = kb ustida */
    setSheetHeight(0);
  }, []);

  const syncLayout = useCallback(
    (mode) => {
      const vv = window.visualViewport;
      const innerH = window.innerHeight;
      const vvH = vv ? vv.height : innerH;
      const vvTop = vv ? vv.offsetTop : 0;
      const belowVv = Math.max(0, Math.round(innerH - vvTop - vvH));
      const vvShrink = Math.max(0, Math.round(baselineVvHRef.current - vvH));
      const kb = Math.max(belowVv, vvShrink);

      if (mode === 'open' || mode === true) {
        applyOpen();
        return;
      }
      if (mode === 'close' || mode === false) {
        applyClosed();
        return;
      }

      /* auto */
      const wantOpen =
        inputFocusRef.current ||
        kb > KB_PX ||
        (keyboardRef.current && kb > 30);

      if (wantOpen) applyOpen();
      else applyClosed();
    },
    [applyClosed, applyOpen]
  );

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      clearSyncTimers();
      setSheetTop(0);
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    const vv = window.visualViewport;
    baselineInnerHRef.current = window.innerHeight;
    baselineVvHRef.current = vv ? vv.height : window.innerHeight;
    applyClosed();
  }, [active, applyClosed]);

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
        syncLayout('auto');
      });
    };

    syncLayout('auto');
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [active, syncLayout]);

  const keepScrollLocked = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    if (document.body.style.position === 'fixed') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }
  }, []);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    window.clearTimeout(blurTimerRef.current);
    clearSyncTimers();
    keepScrollLocked();

    /* Darhol ochiq layout; keyin klaviatura balandligini bir necha marta o‘lchash */
    syncLayout('open');
    [50, 100, 180, 280, 400].forEach((ms) => {
      const id = window.setTimeout(() => {
        if (!inputFocusRef.current) return;
        syncLayout('open');
        keepScrollLocked();
      }, ms);
      syncTimersRef.current.push(id);
    });
  }, [keepScrollLocked, syncLayout]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    clearSyncTimers();
    window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => {
      if (inputFocusRef.current) return;
      /* Majburiy yopiq holat — avvalgi balandlik */
      syncLayout('close');
    }, 160);
  }, [syncLayout]);

  return {
    sheetTop,
    sheetBottom,
    sheetHeight,
    keyboardOpen,
    keepScrollLocked,
    onModalInputFocus,
    onModalInputBlur,
  };
}
