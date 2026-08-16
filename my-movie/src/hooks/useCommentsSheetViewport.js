import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';
/** Modal tepasi — ekrandan pastga, doim bir xil (sakramaydi) */
const SHEET_TOP_RATIO = 0.16;
const SHEET_TOP_MIN = 100;
const SHEET_TOP_MAX = 168;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

export const resolveSheetTop = (screenH = typeof window !== 'undefined' ? window.innerHeight : 700) =>
  Math.round(Math.min(SHEET_TOP_MAX, Math.max(SHEET_TOP_MIN, screenH * SHEET_TOP_RATIO)));

/**
 * Top fixed (yuqori chekka qimirlamaydi).
 * Faqat bottom = klaviatura balandligi — body qisqarib scroll ochiladi.
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
      return;
    }
    setSheetTop(resolveSheetTop(window.innerHeight));
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
      return undefined;
    }

    let raf = 0;

    const commitInset = (nextInset, keyboard) => {
      lastInsetRef.current = nextInset;
      keyboardRef.current = keyboard;
      setKbInset(nextInset);
      setKeyboardOpen(keyboard);
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

      /* Yopilish: bir marta → CSS bottom silliq 0 ga */
      if (!keyboard) {
        if (lastInsetRef.current !== 0 || wasKeyboard) {
          commitInset(0, false);
        }
        return;
      }

      /* Ochilish: klaviatura joylashsin, keyin BIR marta bottom qo‘yiladi */
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

      /* Allaqachon ochiq: faqat katta farqda yangilash (orientatsiya) */
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
