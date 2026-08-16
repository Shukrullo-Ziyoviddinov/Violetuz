import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_OPEN_GAP = 10;
const KB_MIN = 40;
const CLOSE_LOCK_MS = 500;
const OVERLAY_CLOSE_BLOCK_MS = 750;
const OPEN_RETRY_MS = [60, 140, 240, 360, 500, 700, 950];

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

/**
 * Faqat bottom + height (top ishlatilmaydi — stretch bug yo‘q).
 * Ochiq: bottom=klaviatura, height=visualViewport → footer kb ustida.
 * Yopiq: bottom=0, height=modal ochilgandagi saqlangan balandlik.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const inputFocusRef = useRef(false);
  const baselineHRef = useRef(0);
  const closedHeightRef = useRef(0);
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
    const vv = window.visualViewport;

    const vk = typeof navigator !== 'undefined' ? navigator.virtualKeyboard : null;
    const vkH = vk?.boundingRect?.height ? Math.round(vk.boundingRect.height) : 0;
    if (vkH >= KB_MIN) return vkH;

    if (!vv) return 0;
    return Math.max(0, Math.round(innerH - vv.offsetTop - vv.height));
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
      height = Math.max(200, Math.round(vv.height - TOP_OPEN_GAP));
    } else if (inputFocusRef.current) {
      /* Hali animatsiya — overestimate, footer kb ichiga kirmasin */
      bottom = Math.max(kb, Math.round(Math.max(baseH, innerH) * 0.45));
      height = Math.max(200, Math.round(Math.max(baseH, innerH) - bottom - TOP_OPEN_GAP));
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
    const onGeo = () => syncLayout();
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
      /* Majburiy yopiq + qayta ochilishni bloklash */
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
