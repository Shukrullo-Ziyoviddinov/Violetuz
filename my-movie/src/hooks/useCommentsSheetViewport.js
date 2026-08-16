import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_OPEN_GAP = 10;
const KB_MIN = 40;
const CLOSE_LOCK_MS = 500;
const OVERLAY_CLOSE_BLOCK_MS = 750;
const OPEN_RETRY_MS = [60, 140, 240, 360, 500, 700, 950, 1200];

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

/**
 * Modal ochiq: sahifa scroll qulflanadi (brauzer navbar “tushishi” kamayadi).
 * Klaviatura: bottom + height; chrome yashirin ochilgan bo‘lsa baseline bilan kompensatsiya.
 * Navbar ni majburan yashirish mumkin emas — scroll jump oldini olamiz + footer ni himoya qilamiz.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const inputFocusRef = useRef(false);
  const baselineHRef = useRef(0);
  const baselineVvHRef = useRef(0);
  const closedHeightRef = useRef(0);
  /** Modal ochilganda navbar yashirin (katta viewport) edi */
  const chromeCollapsedRef = useRef(false);
  const blurTimerRef = useRef(0);
  const syncTimersRef = useRef([]);
  const closeLockUntilRef = useRef(0);
  const blockOverlayCloseUntilRef = useRef(0);

  const clearSyncTimers = () => {
    syncTimersRef.current.forEach((id) => window.clearTimeout(id));
    syncTimersRef.current = [];
  };

  const readKeyboardBottom = useCallback(() => {
    const innerH = window.innerHeight;
    const baseH = baselineHRef.current || innerH;
    const vv = window.visualViewport;

    const vk = typeof navigator !== 'undefined' ? navigator.virtualKeyboard : null;
    const vkH = vk?.boundingRect?.height ? Math.round(vk.boundingRect.height) : 0;
    if (vkH >= KB_MIN) return vkH;

    if (!vv) return 0;

    const fromLayout = Math.max(0, Math.round(innerH - vv.offsetTop - vv.height));
    /*
     * Navbar yashirin ochilgan, keyin kb da tushganda innerH kichiklashadi /
     * o‘lchov past baholanadi. Baseline (katta) bo‘yicha pastki inset —
     * footer kb ostiga tushmasin.
     */
    const fromBaseline = Math.max(0, Math.round(baseH - vv.height));

    if (chromeCollapsedRef.current && inputFocusRef.current) {
      return Math.max(fromLayout, fromBaseline);
    }
    return fromLayout;
  }, []);

  const applyClosed = useCallback(() => {
    const h =
      closedHeightRef.current ||
      Math.max(
        240,
        (baselineHRef.current || window.innerHeight) -
          closedTopGap(baselineHRef.current || window.innerHeight)
      );
    setKeyboardOpen(false);
    setSheetBottom(0);
    setSheetHeight(h);
  }, []);

  const applyOpen = useCallback(() => {
    if (Date.now() < closeLockUntilRef.current) return false;

    const vv = window.visualViewport;
    const innerH = window.innerHeight;
    const baseH = baselineHRef.current || innerH;
    const kb = readKeyboardBottom();

    let bottom = kb;
    let height;

    if (vv && (kb >= KB_MIN || vv.height < baseH - KB_MIN || vv.height < innerH - KB_MIN)) {
      bottom = Math.max(kb, Math.round(innerH - vv.offsetTop - vv.height));
      if (chromeCollapsedRef.current) {
        bottom = Math.max(bottom, Math.round(baseH - vv.height));
      }
      height = Math.max(200, Math.round(vv.height - TOP_OPEN_GAP));
    } else if (inputFocusRef.current) {
      const refH = chromeCollapsedRef.current ? Math.max(baseH, innerH) : Math.max(baseH, innerH);
      bottom = Math.max(kb, Math.round(refH * 0.45));
      height = Math.max(200, Math.round(refH - bottom - TOP_OPEN_GAP));
    } else {
      return false;
    }

    if (bottom < KB_MIN && !inputFocusRef.current) return false;

    setKeyboardOpen(true);
    setSheetBottom(Math.max(0, bottom));
    setSheetHeight(height);
    return true;
  }, [readKeyboardBottom]);

  const syncLayout = useCallback(() => {
    if (Date.now() < closeLockUntilRef.current) {
      applyClosed();
      return;
    }
    if (inputFocusRef.current) {
      applyOpen();
      return;
    }
    applyClosed();
  }, [applyClosed, applyOpen]);

  useLayoutEffect(() => {
    if (!active) {
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      clearSyncTimers();
      closeLockUntilRef.current = 0;
      blockOverlayCloseUntilRef.current = 0;
      chromeCollapsedRef.current = false;
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    const h = window.innerHeight;
    const vv = window.visualViewport;
    const vvH = vv ? vv.height : h;
    baselineHRef.current = h;
    baselineVvHRef.current = vvH;
    closedHeightRef.current = Math.max(240, h - closedTopGap(h));
    /*
     * Navbar yashirin: viewport katta (inner ≈ vv, yoki screen ga yaqin).
     * Aniq API yo‘q — heuristika.
     */
    const screenH = typeof window.screen?.height === 'number' ? window.screen.height : h;
    chromeCollapsedRef.current =
      h >= screenH * 0.85 || (vv && Math.abs(h - vvH) < 30 && h > 500);
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
    const onGeo = () => syncLayout();
    vk.addEventListener('geometrychange', onGeo);
    return () => vk.removeEventListener('geometrychange', onGeo);
  }, [active, syncLayout]);

  /* Sahifa scroll lock — navbar scroll orqali “tushishini” kamaytiradi */
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

    const prev = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      htmlHeight: html.style.height,
    };

    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    html.style.height = '100%';

    const preventScroll = (e) => {
      const t = e.target;
      if (t instanceof Element && bodyScrollSelector && t.closest(bodyScrollSelector)) {
        return;
      }
      e.preventDefault();
    };

    const freezeWindowScroll = () => {
      /* scrollTo(0,0) navbar ni ochishi mumkin — qilmaymiz */
      if (window.scrollY !== 0 && body.style.position === 'fixed') {
        /* fixed body da odatda 0; o‘zgarsa qayta mahkamlash */
        body.style.top = `-${scrollYRef.current}px`;
      }
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('scroll', freezeWindowScroll, { passive: true });

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
      window.removeEventListener('scroll', freezeWindowScroll);
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.overflow = prev.bodyOverflow;
      body.style.touchAction = prev.bodyTouchAction;
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      html.style.height = prev.htmlHeight;
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
        syncLayout();
      });
    };

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
    closeLockUntilRef.current = 0;
    blockOverlayCloseUntilRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;

    /* Focus scroll jump — navbar ochilishiga sabab; qaytarib scroll qilmaymiz */
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
      closeLockUntilRef.current = Date.now() + CLOSE_LOCK_MS;
      applyClosed();
    }, 120);
  }, [applyClosed]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayCloseUntilRef.current,
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
