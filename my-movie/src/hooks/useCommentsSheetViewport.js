import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

/** Klaviatura YOPIQ — yuqorida ko‘proq joy */
const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;

/** Klaviatura OCHIQ — top pastga (kichik) → modal aniq balandroq */
const TOP_OPEN_RATIO = 0.03;
const TOP_OPEN_MIN = 20;
const TOP_OPEN_MAX = 40;

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
 * Klaviatura ochilganda: avval top kamayadi (modal yuqoriga kengayadi),
 * keyin bottom = klaviatura. Yopiq holat balandligi o‘zgarmaydi.
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

    const closeKeyboard = () => {
      window.clearTimeout(settleTimerRef.current);
      keyboardRef.current = false;
      lastInsetRef.current = 0;
      setKbInset(0);
      setKeyboardOpen(false);
      setSheetTop(resolveSheetTop(window.innerHeight, false));
    };

    const openKeyboardExpand = (h) => {
      /* Darhol yuqoriga kengaytirish — balandlik oshishi shu */
      keyboardRef.current = true;
      setKeyboardOpen(true);
      setSheetTop(resolveSheetTop(h, true));
    };

    const apply = () => {
      raf = 0;
      const h = window.innerHeight;
      const rawInset = Math.max(0, Math.round(h - vv.height - vv.offsetTop));
      const wasKeyboard = keyboardRef.current;

      window.clearTimeout(settleTimerRef.current);

      /* Yopilish */
      if (wasKeyboard && rawInset < 32) {
        closeKeyboard();
        return;
      }
      if (!wasKeyboard && rawInset < 80) {
        return;
      }

      /* Birinchi marta ochilish */
      if (!wasKeyboard && rawInset > 80) {
        openKeyboardExpand(h);
        settleTimerRef.current = window.setTimeout(() => {
          const settled = Math.max(
            0,
            Math.round(window.innerHeight - vv.height - vv.offsetTop)
          );
          const inset = settled > 80 ? settled : rawInset;
          lastInsetRef.current = inset;
          setKbInset(inset);
          /* top ochiq holatda qolsin */
          setSheetTop(resolveSheetTop(window.innerHeight, true));
        }, 90);
        return;
      }

      /* Allaqachon ochiq — inset katta o‘zgarsa */
      if (wasKeyboard && Math.abs(lastInsetRef.current - rawInset) > 48) {
        settleTimerRef.current = window.setTimeout(() => {
          lastInsetRef.current = rawInset;
          setKbInset(rawInset);
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
