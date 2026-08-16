import { useEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';
/** Klaviatura ochiq/yopiq — ekran yuqorisida qoladigan bo‘sh joy */
const SHEET_TOP_GAP_RATIO = 0.12;
const SHEET_TOP_GAP_MIN = 110;
const SHEET_TOP_GAP_MAX = 180;
/** Klaviaturasiz modal balandligi */
const SHEET_MAX_RATIO = 0.78;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const resolveTopGap = (screenH) =>
  Math.round(
    Math.min(SHEET_TOP_GAP_MAX, Math.max(SHEET_TOP_GAP_MIN, screenH * SHEET_TOP_GAP_RATIO))
  );

/**
 * Bottom-sheet: body lock + klaviatura uchun bottom/height.
 * Klaviatura ochilganda modal silliq yuqoriga; yopilganda pastga.
 * Yuqorida doim topGap bo‘sh joy.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [kbInset, setKbInset] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollYRef = useRef(0);
  const metricsRef = useRef({ inset: 0, height: 0, keyboard: false });
  const keyboardRef = useRef(false);

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
    if (!active) {
      metricsRef.current = { inset: 0, height: 0, keyboard: false };
      keyboardRef.current = false;
      setKbInset(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return undefined;
    }

    const vv = window.visualViewport;
    if (!vv || !isCommentsSheetViewport()) {
      const h = Math.round(window.innerHeight * SHEET_MAX_RATIO);
      setSheetHeight(h);
      setKbInset(0);
      setKeyboardOpen(false);
      return undefined;
    }

    let raf = 0;
    const apply = () => {
      raf = 0;
      const screenH = window.innerHeight;
      const vvH = Math.max(1, Math.round(vv.height));
      const rawInset = Math.max(0, Math.round(screenH - vv.height - vv.offsetTop));

      let keyboard = keyboardRef.current;
      if (!keyboard && rawInset > 80) keyboard = true;
      if (keyboard && rawInset < 36) keyboard = false;
      keyboardRef.current = keyboard;

      const topGap = resolveTopGap(screenH);
      /* Ko‘rinadigan zona (klaviatura usti) ichida yuqorida topGap qoldiramiz */
      const visibleH = keyboard ? vvH : screenH;
      const maxH = Math.max(260, visibleH - topGap);
      const height = keyboard
        ? maxH
        : Math.min(maxH, Math.round(screenH * SHEET_MAX_RATIO));
      const inset = keyboard ? rawInset : 0;

      const prev = metricsRef.current;
      if (
        Math.abs(prev.inset - inset) < 8 &&
        Math.abs(prev.height - height) < 8 &&
        prev.keyboard === keyboard
      ) {
        return;
      }
      metricsRef.current = { inset, height, keyboard };
      setKbInset(inset);
      setSheetHeight(height);
      setKeyboardOpen(keyboard);
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
    kbInset,
    sheetHeight,
    keyboardOpen,
    keepScrollLocked,
  };
}
