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

const KB_DETECT_PX = 60;

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

/** Klaviatura balandligi — bir necha usuldan eng ishonchlisi */
const measureKeyboardBottom = (vv, baselineVvH, baselineInnerH) => {
  const innerH = window.innerHeight;
  const vvH = vv.height;
  const rawInset = Math.max(0, Math.round(innerH - vvH - vv.offsetTop));
  const vvShrink = Math.max(0, Math.round(baselineVvH - vvH));
  const fromBaselineInner = Math.max(0, Math.round(baselineInnerH - vvH - vv.offsetTop));
  return Math.max(rawInset, vvShrink, fromBaselineInner);
};

/**
 * Input klaviatura ustida (bottom = kb height).
 * Yopilganda top/bottom silliq eski holatga.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(() => resolveSheetTop());
  const [kbInset, setKbInset] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const lastInsetRef = useRef(0);
  const settleTimerRef = useRef(0);
  const pollTimerRef = useRef(0);
  const baselineVvHRef = useRef(0);
  const baselineInnerHRef = useRef(0);
  const inputFocusRef = useRef(false);

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      lastInsetRef.current = 0;
      inputFocusRef.current = false;
      window.clearTimeout(settleTimerRef.current);
      window.clearTimeout(pollTimerRef.current);
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
      return;
    }
    const vv = window.visualViewport;
    baselineInnerHRef.current = window.innerHeight;
    baselineVvHRef.current = vv ? vv.height : window.innerHeight;
    setSheetTop(resolveSheetTop(window.innerHeight, false));
    setKbInset(0);
    setKeyboardOpen(false);
    keyboardRef.current = false;
    lastInsetRef.current = 0;
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

    const closeKeyboard = () => {
      window.clearTimeout(settleTimerRef.current);
      window.clearTimeout(pollTimerRef.current);
      keyboardRef.current = false;
      lastInsetRef.current = 0;
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
    };

    const applyOpen = (bottom) => {
      keyboardRef.current = true;
      lastInsetRef.current = bottom;
      setKeyboardOpen(true);
      setSheetTop(resolveSheetTop(window.innerHeight, true));
      setKbInset(bottom);
    };

    const apply = () => {
      raf = 0;
      const bottom = measureKeyboardBottom(
        vv,
        baselineVvHRef.current,
        baselineInnerHRef.current
      );
      const keyboard =
        bottom > KB_DETECT_PX ||
        (inputFocusRef.current && bottom > 40);
      const wasKeyboard = keyboardRef.current;

      if (wasKeyboard && !keyboard && !inputFocusRef.current) {
        closeKeyboard();
        return;
      }

      if (!keyboard) return;

      if (!wasKeyboard) {
        applyOpen(bottom);
        return;
      }

      /* Ochiq: bottom ni yangilab input klaviatura ustida qolsin */
      if (Math.abs(lastInsetRef.current - bottom) >= 8) {
        lastInsetRef.current = bottom;
        setKbInset(bottom);
        setSheetTop(resolveSheetTop(window.innerHeight, true));
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
      window.clearTimeout(pollTimerRef.current);
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

  const pollKeyboardBottom = useCallback((attempt = 0) => {
    const vv = window.visualViewport;
    if (!vv || !inputFocusRef.current) return;
    const bottom = measureKeyboardBottom(
      vv,
      baselineVvHRef.current,
      baselineInnerHRef.current
    );
    if (bottom > KB_DETECT_PX) {
      lastInsetRef.current = bottom;
      setKbInset(bottom);
      setSheetTop(resolveSheetTop(window.innerHeight, true));
      setKeyboardOpen(true);
      keyboardRef.current = true;
      return;
    }
    if (attempt < 20) {
      pollTimerRef.current = window.setTimeout(() => pollKeyboardBottom(attempt + 1), 50);
    }
  }, []);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    inputFocusRef.current = true;
    keepScrollLocked();

    /* Darhol yuqoriga kengaytirish */
    setSheetTop(resolveSheetTop(window.innerHeight, true));
    setKeyboardOpen(true);
    keyboardRef.current = true;

    window.clearTimeout(pollTimerRef.current);
    window.requestAnimationFrame(() => {
      keepScrollLocked();
      pollKeyboardBottom(0);
    });
  }, [keepScrollLocked, pollKeyboardBottom]);

  const onModalInputBlur = useCallback(() => {
    inputFocusRef.current = false;
    window.clearTimeout(pollTimerRef.current);
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
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
      const bottom = measureKeyboardBottom(
        vv,
        baselineVvHRef.current,
        baselineInnerHRef.current
      );
      if (bottom < 40) {
        keyboardRef.current = false;
        lastInsetRef.current = 0;
        setKbInset(0);
        setKeyboardOpen(false);
        setSheetTop(resolveSheetTop(window.innerHeight, false));
      }
    }, 180);
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
