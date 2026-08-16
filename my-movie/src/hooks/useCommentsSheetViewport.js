import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura YOPIQ — yuqorida ko‘proq joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura OCHIQ — top kichik → modal balandroq */
const TOP_OPEN_RATIO = 0.028;
const TOP_OPEN_MIN = 16;
const TOP_OPEN_MAX = 36;

const KB_DETECT_PX = 70;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

export const resolveSheetTop = (
  screenH = typeof window !== 'undefined' ? window.innerHeight : 700,
  keyboardOpen = false
) => {
  if (keyboardOpen) {
    return Math.round(
      Math.min(TOP_OPEN_MAX, Math.max(TOP_OPEN_MIN, screenH * TOP_OPEN_RATIO))
    );
  }
  return Math.round(
    Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, screenH * TOP_CLOSED_RATIO))
  );
};

/**
 * Klaviatura aniqlash:
 * 1) visualViewport qisqarishi (resizes-content)
 * 2) layout − vv inset (overlays-content)
 * Input focus → zaxira signal.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(() => resolveSheetTop());
  const [kbInset, setKbInset] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const lastInsetRef = useRef(0);
  const settleTimerRef = useRef(0);
  const baselineVvHRef = useRef(0);
  const baselineInnerHRef = useRef(0);
  const inputFocusRef = useRef(false);

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      lastInsetRef.current = 0;
      inputFocusRef.current = false;
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
      return;
    }
    const vv = window.visualViewport;
    baselineInnerHRef.current = window.innerHeight;
    baselineVvHRef.current = vv ? vv.height : window.innerHeight;
    setSheetTop(resolveSheetTop(window.innerHeight, false));
  }, [active]);

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
    if (!vv || !isCommentsSheetViewport()) {
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
      return undefined;
    }

    let raf = 0;

    const readMetrics = () => {
      const innerH = window.innerHeight;
      const vvH = vv.height;
      const rawInset = Math.max(0, Math.round(innerH - vvH - vv.offsetTop));
      const vvShrink = Math.max(0, Math.round(baselineVvHRef.current - vvH));
      const innerShrink = Math.max(0, Math.round(baselineInnerHRef.current - innerH));
      /* resizes-content: inset~0, lekin vv/inner qisqaradi */
      const keyboard =
        rawInset > KB_DETECT_PX ||
        vvShrink > KB_DETECT_PX ||
        (inputFocusRef.current && (vvShrink > 40 || innerShrink > 40 || rawInset > 40));
      return { innerH, vvH, rawInset, vvShrink, innerShrink, keyboard };
    };

    const closeKeyboard = () => {
      window.clearTimeout(settleTimerRef.current);
      keyboardRef.current = false;
      lastInsetRef.current = 0;
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
    };

    const openKeyboardExpand = (innerH, inset) => {
      keyboardRef.current = true;
      setKeyboardOpen(true);
      setSheetTop(resolveSheetTop(innerH, true));
      lastInsetRef.current = inset;
      setKbInset(inset);
    };

    const apply = () => {
      raf = 0;
      const { innerH, rawInset, keyboard } = readMetrics();
      const wasKeyboard = keyboardRef.current;

      /* Yopilish: focus yo‘q va qisqarish yo‘q */
      if (wasKeyboard && !keyboard) {
        closeKeyboard();
        return;
      }

      if (!keyboard) return;

      /* overlays: bottom = inset; resizes-content: inset~0, faqat top kengayadi */
      const bottomInset = rawInset > KB_DETECT_PX ? rawInset : 0;

      if (!wasKeyboard) {
        openKeyboardExpand(innerH, bottomInset);
        /* settle — aniqroq inset */
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(() => {
          const m = readMetrics();
          if (!m.keyboard) {
            closeKeyboard();
            return;
          }
          const inset = m.rawInset > KB_DETECT_PX ? m.rawInset : 0;
          lastInsetRef.current = inset;
          setKbInset(inset);
          setSheetTop(resolveSheetTop(window.innerHeight, true));
          setKeyboardOpen(true);
          keyboardRef.current = true;
        }, 100);
        return;
      }

      if (Math.abs(lastInsetRef.current - bottomInset) > 40) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(() => {
          lastInsetRef.current = bottomInset;
          setKbInset(bottomInset);
          setSheetTop(resolveSheetTop(window.innerHeight, true));
        }, 80);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    apply();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.clearTimeout(settleTimerRef.current);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [active]);

  const keepScrollLocked = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    if (document.body.style.position === 'fixed') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    } else {
      window.scrollTo(0, scrollYRef.current);
    }
  }, []);

  /** Input focus — klaviatura signal (zaxira) */
  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    keepScrollLocked();
    /* Optimistik: top ni darhol ochiq holatga — balandlik oshsin */
    setSheetTop(resolveSheetTop(window.innerHeight, true));
    setKeyboardOpen(true);
    keyboardRef.current = true;
    window.requestAnimationFrame(() => {
      keepScrollLocked();
      const vv = window.visualViewport;
      if (!vv) return;
      const rawInset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const vvShrink = Math.max(0, Math.round(baselineVvHRef.current - vv.height));
      const inset = rawInset > KB_DETECT_PX ? rawInset : 0;
      if (rawInset > 40 || vvShrink > 40) {
        lastInsetRef.current = inset;
        setKbInset(inset);
      }
    });
    window.setTimeout(() => {
      const vv = window.visualViewport;
      if (!vv || !inputFocusRef.current) return;
      const rawInset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const vvShrink = Math.max(0, Math.round(baselineVvHRef.current - vv.height));
      const inset = rawInset > KB_DETECT_PX ? rawInset : 0;
      setSheetTop(resolveSheetTop(window.innerHeight, true));
      setKeyboardOpen(true);
      keyboardRef.current = true;
      if (rawInset > 40 || vvShrink > 40) {
        lastInsetRef.current = inset;
        setKbInset(inset);
      }
    }, 120);
  }, [keepScrollLocked]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    window.setTimeout(() => {
      if (inputFocusRef.current) return;
      const vv = window.visualViewport;
      if (!vv) {
        keyboardRef.current = false;
        lastInsetRef.current = 0;
        setKbInset(0);
        setKeyboardOpen(false);
        setSheetTop(resolveSheetTop(window.innerHeight, false));
        return;
      }
      const rawInset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const vvShrink = Math.max(0, Math.round(baselineVvHRef.current - vv.height));
      if (rawInset < 32 && vvShrink < 32) {
        keyboardRef.current = false;
        lastInsetRef.current = 0;
        setKbInset(0);
        setKeyboardOpen(false);
        setSheetTop(resolveSheetTop(window.innerHeight, false));
      }
    }, 150);
  }, []);

  return {
    sheetTop,
    kbInset,
    keyboardOpen,
    keepScrollLocked,
    onModalInputFocus,
    onModalInputBlur,
  };
}
