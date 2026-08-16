import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura yopiq — yuqorida qoldiriladigan joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura ochiq — visualViewport ichida yuqori gap */
const TOP_OPEN_GAP = 10;

const KB_MIN = 36;
const CLOSE_SUPPRESS_MS = 400;
const OVERLAY_CLOSE_BLOCK_MS = 750;

/** Brauzer chrome + klaviatura animatsiyasi uchun qayta o‘lchash */
const OPEN_RETRY_MS = [40, 100, 180, 280, 400, 550, 750, 1000];

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

/**
 * Yopiq: bottom=0 + saqlangan height (modal ochilgandagi balandlik).
 * Ochiq: visualViewport ga pin (top+height) — brauzer navigatsiyasi
 * yashirinsa/chiqsa ham footer har doim klaviatura USTIDA.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState('auto');
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const inputFocusRef = useRef(false);
  const baselineHRef = useRef(0);
  const closedHeightRef = useRef(0);
  const blurTimerRef = useRef(0);
  const syncTimersRef = useRef([]);
  const suppressOpenUntilRef = useRef(0);
  const blockOverlayCloseUntilRef = useRef(0);

  const clearSyncTimers = () => {
    syncTimersRef.current.forEach((id) => window.clearTimeout(id));
    syncTimersRef.current = [];
  };

  const keyboardInset = useCallback(() => {
    const vv = window.visualViewport;
    const innerH = window.innerHeight;
    if (!vv) return 0;

    const vk = typeof navigator !== 'undefined' ? navigator.virtualKeyboard : null;
    const vkH = vk?.boundingRect?.height ? Math.round(vk.boundingRect.height) : 0;
    if (vkH >= KB_MIN) return vkH;

    return Math.max(0, Math.round(innerH - vv.offsetTop - vv.height));
  }, []);

  const applyClosed = useCallback(() => {
    const height =
      closedHeightRef.current ||
      Math.max(
        240,
        (baselineHRef.current || window.innerHeight) -
          closedTopGap(baselineHRef.current || window.innerHeight)
      );
    keyboardRef.current = false;
    setKeyboardOpen(false);
    setSheetTop('auto');
    setSheetBottom(0);
    setSheetHeight(height);
  }, []);

  /**
   * Modalni visualViewport to‘rtburchagiga mahkamlash.
   * Footer = VV pastki cheti = klaviatura usti (chrome holatidan mustaqil).
   */
  const applyOpen = useCallback(() => {
    const vv = window.visualViewport;
    const innerH = window.innerHeight;
    const baseH = baselineHRef.current || innerH;
    const inset = keyboardInset();

    const vk = typeof navigator !== 'undefined' ? navigator.virtualKeyboard : null;
    const vkH = vk?.boundingRect?.height ? Math.round(vk.boundingRect.height) : 0;

    let open = inset >= KB_MIN || vkH >= KB_MIN;
    if (!open && vv && inputFocusRef.current) {
      open = vv.height < baseH - KB_MIN || vv.height < innerH - KB_MIN;
    }

    if (!open && inputFocusRef.current) {
      /* Hali o‘lchanmagan — taxminiy, overestimate (footer kb ichiga kirmasin) */
      const est = Math.round(Math.max(baseH, innerH) * 0.48);
      keyboardRef.current = true;
      setKeyboardOpen(true);
      setSheetTop('auto');
      setSheetBottom(est);
      setSheetHeight(Math.max(200, Math.round(Math.max(baseH, innerH) - est - TOP_OPEN_GAP)));
      return true;
    }

    if (!open || !vv) return false;

    /* Pin to visual viewport — chrome yashirsa ham to‘g‘ri */
    const top = Math.round(vv.offsetTop + TOP_OPEN_GAP);
    const height = Math.max(200, Math.round(vv.height - TOP_OPEN_GAP));

    keyboardRef.current = true;
    setKeyboardOpen(true);
    setSheetTop(`${top}px`);
    setSheetBottom('auto');
    setSheetHeight(height);
    return true;
  }, [keyboardInset]);

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

      if (Date.now() < suppressOpenUntilRef.current) {
        if (!inputFocusRef.current) applyClosed();
        return;
      }

      if (inputFocusRef.current || keyboardRef.current) {
        const ok = applyOpen();
        if (!ok && !inputFocusRef.current) applyClosed();
      } else {
        applyClosed();
      }
    },
    [applyClosed, applyOpen]
  );

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      clearSyncTimers();
      suppressOpenUntilRef.current = 0;
      blockOverlayCloseUntilRef.current = 0;
      setSheetTop('auto');
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
    const onGeo = () => syncLayout('auto');
    vk.addEventListener('geometrychange', onGeo);
    return () => vk.removeEventListener('geometrychange', onGeo);
  }, [active, syncLayout]);

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
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        syncLayout('auto');
      });
    };

    syncLayout('auto');
    if (vv) {
      vv.addEventListener('resize', schedule);
      vv.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (vv) {
        vv.removeEventListener('resize', schedule);
        vv.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
    };
  }, [active, syncLayout]);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    window.clearTimeout(blurTimerRef.current);
    clearSyncTimers();
    suppressOpenUntilRef.current = 0;
    blockOverlayCloseUntilRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;

    const tryOpen = () => {
      if (!inputFocusRef.current) return;
      blockOverlayCloseUntilRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
      applyOpen();
    };

    OPEN_RETRY_MS.forEach((ms) => {
      syncTimersRef.current.push(window.setTimeout(tryOpen, ms));
    });
  }, [applyOpen]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    clearSyncTimers();
    window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => {
      if (inputFocusRef.current) return;
      suppressOpenUntilRef.current = Date.now() + CLOSE_SUPPRESS_MS;
      applyClosed();
    }, 160);
  }, [applyClosed]);

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
