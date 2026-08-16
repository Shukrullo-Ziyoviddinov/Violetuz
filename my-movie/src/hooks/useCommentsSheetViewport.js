import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura yopiq — yuqorida qoldiriladigan joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura ochiq — visible zonada yuqori gap */
const TOP_OPEN_GAP = 8;

/** Klaviatura deb hisoblash chegarasi */
const KB_MIN = 40;

/** Focus paytida o‘lchov kelguncha taxminiy klaviatura (ekran %) */
const KB_ESTIMATE_RATIO = 0.42;

const CLOSE_SUPPRESS_MS = 280;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (screenH) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO)));

/**
 * Bottom-sheet + klaviatura:
 * - yopiq: bottom=0, height=baseline-gap (pastda bo‘shliq yo‘q)
 * - ochiq: bottom=klaviatura, height=ko‘rinadigan zona (footer klaviatura USTIDA)
 * - yopilganda: ochilishdagi baseline ga qaytadi
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
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

  /** Klaviatura balandligi + ko‘rinadigan balandlik (overlay / resize / VK API) */
  const measure = useCallback(() => {
    const baseH = baselineHRef.current || window.innerHeight;
    const innerH = window.innerHeight;
    const vv = window.visualViewport;

    /* Chrome Android VirtualKeyboard API — eng aniq */
    const vk = typeof navigator !== 'undefined' ? navigator.virtualKeyboard : null;
    const vkH = vk?.boundingRect?.height ? Math.round(vk.boundingRect.height) : 0;
    if (vkH >= KB_MIN) {
      return {
        bottom: vkH,
        visibleH: Math.max(200, innerH - vkH),
        open: true,
      };
    }

    if (vv) {
      const overlayKb = Math.max(0, Math.round(innerH - vv.height - vv.offsetTop));
      const layoutShrink = Math.max(0, Math.round(baseH - innerH));
      const vvShrink = Math.max(0, Math.round(baseH - vv.height));

      /* Overlay: layout o‘zgarmaydi, VV kichiklashadi */
      if (overlayKb >= KB_MIN) {
        return {
          bottom: overlayKb,
          visibleH: Math.max(200, Math.round(vv.height)),
          open: true,
        };
      }

      /* Layout resize: innerHeight allaqachon klaviaturasiz */
      if (layoutShrink >= KB_MIN) {
        return {
          bottom: 0,
          visibleH: Math.max(200, innerH),
          open: true,
        };
      }

      /* VV kichik, lekin overlayKb kichik (offsetTop chalkash) */
      if (vvShrink >= KB_MIN && inputFocusRef.current) {
        const bottom = Math.max(overlayKb, Math.round(innerH - vv.height));
        return {
          bottom: Math.max(0, bottom),
          visibleH: Math.max(200, Math.round(vv.height)),
          open: true,
        };
      }
    } else {
      const layoutShrink = Math.max(0, Math.round(baseH - innerH));
      if (layoutShrink >= KB_MIN) {
        return {
          bottom: 0,
          visibleH: Math.max(200, innerH),
          open: true,
        };
      }
    }

    /* Focus bor, o‘lchov hali yo‘q — taxminiy ko‘tarish (input klaviatura ostida qolmasin) */
    if (inputFocusRef.current) {
      const est = Math.round(baseH * KB_ESTIMATE_RATIO);
      return {
        bottom: est,
        visibleH: Math.max(200, baseH - est),
        open: true,
        estimated: true,
      };
    }

    return {
      bottom: 0,
      visibleH: baseH,
      open: false,
    };
  }, []);

  const applyClosed = useCallback(() => {
    const baseH = baselineHRef.current || window.innerHeight;
    const gap = closedTopGap(baseH);
    keyboardRef.current = false;
    setKeyboardOpen(false);
    setSheetBottom(0);
    setSheetHeight(Math.max(240, baseH - gap));
  }, []);

  const applyOpen = useCallback(() => {
    const m = measure();
    if (!m.open) return false;

    const height = Math.max(200, Math.round(m.visibleH - TOP_OPEN_GAP));
    keyboardRef.current = true;
    setKeyboardOpen(true);
    setSheetBottom(Math.max(0, Math.round(m.bottom)));
    setSheetHeight(height);
    return true;
  }, [measure]);

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

      const now = Date.now();
      if (now < suppressOpenUntilRef.current) {
        if (!inputFocusRef.current) applyClosed();
        return;
      }

      if (inputFocusRef.current || keyboardRef.current) {
        const m = measure();
        if (m.open) applyOpen();
        else if (!inputFocusRef.current) applyClosed();
      } else {
        applyClosed();
      }
    },
    [applyClosed, applyOpen, measure]
  );

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      inputFocusRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      clearSyncTimers();
      suppressOpenUntilRef.current = 0;
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    baselineHRef.current = window.innerHeight;
    applyClosed();
  }, [active, applyClosed]);

  /* VirtualKeyboard overlaysContent */
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
    return () => {
      vk.removeEventListener('geometrychange', onGeo);
    };
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
    if (!active) return undefined;
    if (!isCommentsSheetViewport()) return undefined;

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

    /* Darhol ko‘tarish (taxminiy yoki real), keyin aniqlash */
    applyOpen();
    [40, 100, 180, 280, 400, 560].forEach((ms) => {
      const id = window.setTimeout(() => {
        if (!inputFocusRef.current) return;
        applyOpen();
      }, ms);
      syncTimersRef.current.push(id);
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
    }, 100);
  }, [applyClosed]);

  return {
    sheetBottom,
    sheetHeight,
    keyboardOpen,
    onModalInputFocus,
    onModalInputBlur,
  };
}
