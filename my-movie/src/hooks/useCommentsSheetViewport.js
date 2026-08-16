import { useEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';
/** Modal tepasida doim qoladigan bo‘sh joy (ekran balandligiga nisbatan) */
const SHEET_TOP_GAP_RATIO = 0.14;
const SHEET_TOP_GAP_MIN = 96;
const SHEET_TOP_GAP_MAX = 160;
/** Klaviaturasiz modal max balandlik */
const SHEET_MAX_RATIO = 0.78;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const resolveTopGap = (vvH) =>
  Math.round(
    Math.min(SHEET_TOP_GAP_MAX, Math.max(SHEET_TOP_GAP_MIN, vvH * SHEET_TOP_GAP_RATIO))
  );

/**
 * Komment bottom-sheet: body scroll lock + visualViewport ga pin.
 * Yuqorida doim bo‘sh joy; klaviatura ochilganda sakrashsiz.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetTop, setSheetTop] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollYRef = useRef(0);
  const metricsRef = useRef({ top: 0, height: 0, keyboard: false });
  const keyboardRef = useRef(false);

  /* Body fixed lock — focus paytida brauzer sahifani surmasin */
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
      const scroller = bodyScrollSelector
        ? t.closest(bodyScrollSelector)
        : null;
      if (scroller) return;
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

  /* Modalni visualViewport ichiga pin — yuqorida topGap */
  useEffect(() => {
    if (!active) {
      metricsRef.current = { top: 0, height: 0, keyboard: false };
      keyboardRef.current = false;
      setSheetTop(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return undefined;
    }

    const vv = window.visualViewport;
    if (!vv || !isCommentsSheetViewport()) return undefined;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const vvH = Math.max(1, Math.round(vv.height));
      /* offsetTop ni ignore qilamiz — body fixed + offsetTop tebranishi sakrash berardi */
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));

      /* Hysteresis: klaviatura on/off tebranmasin */
      let keyboard = keyboardRef.current;
      if (!keyboard && inset > 80) keyboard = true;
      if (keyboard && inset < 40) keyboard = false;
      keyboardRef.current = keyboard;

      const topGap = resolveTopGap(vvH);
      const maxH = Math.max(260, vvH - topGap);
      const height = keyboard
        ? maxH
        : Math.min(maxH, Math.round(vvH * SHEET_MAX_RATIO));
      /* Har doim visual viewport pastiga yopishtirilgan → yuqorida topGap */
      const top = Math.max(0, Math.round(vv.offsetTop) + (vvH - height));

      const prev = metricsRef.current;
      if (
        Math.abs(prev.top - top) < 10 &&
        Math.abs(prev.height - height) < 10 &&
        prev.keyboard === keyboard
      ) {
        return;
      }
      metricsRef.current = { top, height, keyboard };
      setSheetTop(top);
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
    sheetTop,
    sheetHeight,
    keyboardOpen,
    keepScrollLocked,
  };
}
