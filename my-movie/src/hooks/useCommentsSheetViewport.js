import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura YOPIQ — yuqorida ko‘proq joy (oddiy bottom-sheet) */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura OCHIQ — yuqori joy kamroq → modal balandroq, lekin tepaga yopishmaydi */
const TOP_OPEN_RATIO = 0.055;
const TOP_OPEN_MIN = 36;
const TOP_OPEN_MAX = 64;

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
 * Klaviatura yopiq: oddiy balandlik (yuqorida joy).
 * Klaviatura ochiq: top biroz kamayadi → modal balandroq, tepaga kirmaydi.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(() => resolveSheetTop());
  const [kbInset, setKbInset] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollYRef = useRef(0);
  const keyboardRef = useRef(false);
  const lastInsetRef = useRef(0);
  const settleTimerRef = useRef(0);

  useLayoutEffect(() => {
    if (!active) {
      keyboardRef.current = false;
      lastInsetRef.current = 0;
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
      return;
    }
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

    const commitInset = (nextInset, keyboard) => {
      lastInsetRef.current = nextInset;
      keyboardRef.current = keyboard;
      setKbInset(nextInset);
      setKeyboardOpen(keyboard);
      setSheetTop(resolveSheetTop(window.innerHeight, keyboard));
    };

    const apply = () => {
      raf = 0;
      const h = window.innerHeight;
      const rawInset = Math.max(0, Math.round(h - vv.height - vv.offsetTop));

      const wasKeyboard = keyboardRef.current;
      let keyboard = wasKeyboard;
      if (!keyboard && rawInset > 80) keyboard = true;
      if (keyboard && rawInset < 32) keyboard = false;

      window.clearTimeout(settleTimerRef.current);

      if (!keyboard) {
        if (lastInsetRef.current !== 0 || wasKeyboard) {
          commitInset(0, false);
        }
        return;
      }

      if (!wasKeyboard) {
        settleTimerRef.current = window.setTimeout(() => {
          const settled = Math.max(
            0,
            Math.round(window.innerHeight - vv.height - vv.offsetTop)
          );
          commitInset(settled > 80 ? settled : rawInset, true);
        }, 90);
        return;
      }

      if (Math.abs(lastInsetRef.current - rawInset) > 48) {
        settleTimerRef.current = window.setTimeout(() => {
          commitInset(rawInset, true);
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

  const keepScrollLocked = () => {
    if (!isCommentsSheetViewport()) return;
    if (document.body.style.position === 'fixed') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    } else {
      window.scrollTo(0, scrollYRef.current);
    }
  };

  return {
    sheetTop,
    kbInset,
    keyboardOpen,
    keepScrollLocked,
  };
}
