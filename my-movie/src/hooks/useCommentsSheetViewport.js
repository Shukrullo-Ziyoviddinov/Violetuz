import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura yopiq — yuqorida joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura ochiq — kichik yuqori gap (visual viewport ichida) */
const TOP_OPEN_GAP = 12;

const KB_PX = 80;
const CLOSE_SUPPRESS_MS = 320;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

/**
 * Modal layout (mobile sheet):
 * - yopiq: baseline top + height (pastda bo‘shliq yo‘q)
 * - ochiq: visualViewport ga pin — footer klaviatura USTIDA
 * - yopilganda: aynan ochilishdagi baseline ga qaytadi
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const inputFocusRef = useRef(false);
  const baselineHRef = useRef(0);
  const blurTimerRef = useRef(0);
  const syncTimersRef = useRef([]);
  const suppressOpenUntilRef = useRef(0);

  const clearSyncTimers = () => {
    syncTimersRef.current.forEach((id) => window.clearTimeout(id));
    syncTimersRef.current = [];
  };

  const measureKeyboard = useCallback(() => {
    const vv = window.visualViewport;
    const layoutH = window.innerHeight;
    if (!vv) return 0;
    /* Layout pastidagi klaviatura zonasi (overlays-content) */
    return Math.max(0, Math.round(layoutH - vv.height - vv.offsetTop));
  }, []);

  const applyClosed = useCallback(() => {
    const baseH = baselineHRef.current || window.innerHeight;
    const top = closedTopGap(baseH);
    keyboardRef.current = false;
    setKeyboardOpen(false);
    setSheetTop(top);
    setSheetHeight(Math.max(240, baseH - top));
  }, []);

  const applyOpen = useCallback(() => {
    const vv = window.visualViewport;
    const kb = measureKeyboard();
    if (!vv || kb < KB_PX) {
      /* Klaviatura hali chiqmagan — kutamiz, yopiq layoutni buzmaymiz */
      return false;
    }

    /* Visual viewport tepasiga pin: footer = VV past = klaviatura ustida */
    const top = Math.round(vv.offsetTop + TOP_OPEN_GAP);
    const height = Math.max(200, Math.round(vv.height - TOP_OPEN_GAP));

    keyboardRef.current = true;
    setKeyboardOpen(true);
    setSheetTop(top);
    setSheetHeight(height);
    return true;
  }, [measureKeyboard]);

  const syncLayout = useCallback(
    (mode) => {
      if (mode === 'close' || mode === false) {
        applyClosed();
        return;
      }

      if (mode === 'open' || mode === true) {
        applyOpen();
        return;
      }

      /* auto — faqat focus yoki aniq kb */
      const kb = measureKeyboard();
      const now = Date.now();
      const suppress = now < suppressOpenUntilRef.current;

      const wantOpen =
        !suppress &&
        (inputFocusRef.current || keyboardRef.current) &&
        kb >= KB_PX;

      if (wantOpen) applyOpen();
      else if (!inputFocusRef.current) applyClosed();
    },
    [applyClosed, applyOpen, measureKeyboard]
  );

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      clearSyncTimers();
      suppressOpenUntilRef.current = 0;
      setSheetTop(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    /* Ochilishdagi ekran balandligi — yopilganda shunga qaytamiz */
    baselineHRef.current = window.innerHeight;
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

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    window.clearTimeout(blurTimerRef.current);
    clearSyncTimers();
    suppressOpenUntilRef.current = 0;

    /* Klaviatura animatsiyasi davomida bir necha marta o‘lchash */
    const tryOpen = () => {
      if (!inputFocusRef.current) return;
      applyOpen();
    };
    tryOpen();
    [50, 120, 200, 320, 480].forEach((ms) => {
      const id = window.setTimeout(tryOpen, ms);
      syncTimersRef.current.push(id);
    });
  }, [applyOpen]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    clearSyncTimers();
    window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => {
      if (inputFocusRef.current) return;
      /* Yopiq baseline — avvalgi balandlik; auto-open qisqa vaqtga blok */
      suppressOpenUntilRef.current = Date.now() + CLOSE_SUPPRESS_MS;
      applyClosed();
    }, 120);
  }, [applyClosed]);

  return {
    sheetTop,
    sheetHeight,
    keyboardOpen,
    onModalInputFocus,
    onModalInputBlur,
  };
}
