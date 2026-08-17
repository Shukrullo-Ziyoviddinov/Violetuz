










import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_SAFE = 8;
const KB_MIN = 36;
const OVERLAY_CLOSE_BLOCK_MS = 700;
const BLUR_GRACE_MS = 260;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (h) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, h * TOP_CLOSED_RATIO)));

const closedHeightFor = (h) => Math.max(240, h - closedTopGap(h));

/**
 * Modal + klaviatura — YAGONA manba: window.visualViewport.
 * bottom = layout viewport bilan visual viewport pastki chetlari farqi.
 * Shu bitta formula klaviatura VA brauzer navbar (URL bar) tushib-
 * chiqishini birga to'g'ri hisoblaydi — shuning uchun ular endi bir-
 * biriga zid ishlamaydi. Footer modal ichida flex-shrink:0 bilan turadi,
 * shuning uchun modal balandligi to'g'ri bo'lsa footer avtomatik joyida.
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const focusedRef = useRef(false);
  const closedHRef = useRef(0);
  const rafRef = useRef(0);
  const blurTimerRef = useRef(0);
  const blockOverlayRef = useRef(0);

  const measure = useCallback(() => {
    const inner = window.innerHeight;
    const vv = window.visualViewport;

    if (!focusedRef.current) {
      /* Fokus yo'q — sheet doim yopiq o'lchamda, closedH esa joriy layout
         balandligiga moslab yangilanadi (navbar o'zgarishi yopiq holatni
         buzmasligi uchun). */
      const closedH = closedHeightFor(inner);
      closedHRef.current = closedH;
      setKeyboardOpen(false);
      setSheetBottom(0);
      setSheetHeight(closedH);
      return;
    }

    const closedH = closedHRef.current || closedHeightFor(inner);

    if (!vv) {
      setKeyboardOpen(false);
      setSheetBottom(0);
      setSheetHeight(closedH);
      return;
    }

    const bottom = Math.max(0, Math.round(inner - (vv.offsetTop + vv.height)));
    const isKeyboard = bottom >= KB_MIN;

    if (!isKeyboard) {
      /* Klaviatura hali chiqmagan yoki allaqachon yopilgan (blur bo'lgan
         bo'lsa ham) — real geometriya bo'yicha yopiq holatga qaytamiz. */
      setKeyboardOpen(false);
      setSheetBottom(0);
      setSheetHeight(closedH);
      return;
    }

    /* Klaviatura ochiq: qancha bo'sh joy bo'lsa (navbar yig'ilgani hisobiga
       ham) balandlik shuncha o'sib/kamayib turadi — qattiq closedH bilan
       cheklanmaydi, shuning uchun bo'sh joy ko'p bo'lsa balandlik oshadi. */
    const height = Math.min(inner - TOP_SAFE, Math.max(200, inner - bottom - TOP_SAFE));
    setKeyboardOpen(true);
    setSheetBottom(bottom);
    setSheetHeight(height);
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      measure();
    });
  }, [measure]);

  useLayoutEffect(() => {
    if (!active) {
      focusedRef.current = false;
      window.clearTimeout(blurTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return;
    }
    focusedRef.current = false;
    measure();
  }, [active, measure]);

  useEffect(() => {
    if (!active || !isCommentsSheetViewport()) return undefined;
    const vk = navigator.virtualKeyboard;
    if (!vk?.addEventListener) return undefined;
    try {
      vk.overlaysContent = true;
    } catch {
      /* ignore */
    }
    vk.addEventListener('geometrychange', schedule);
    return () => vk.removeEventListener('geometrychange', schedule);
  }, [active, schedule]);

  useEffect(() => {
    if (!active) return undefined;
    if (!isCommentsSheetViewport()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }

    scrollYRef.current = window.scrollY || 0;
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
      if (t instanceof Element && bodyScrollSelector && t.closest(bodyScrollSelector)) return;
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
    if (vv) {
      vv.addEventListener('resize', schedule);
      vv.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', schedule);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (vv) {
        vv.removeEventListener('resize', schedule);
        vv.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
    };
  }, [active, schedule]);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    window.clearTimeout(blurTimerRef.current);
    focusedRef.current = true;
    blockOverlayRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    schedule();
  }, [schedule]);

  const onModalInputBlur = useCallback(() => {
    window.clearTimeout(blurTimerRef.current);
    /* Qisqa "grace" — reply tugmasi bosilib boshqa inputga fokus
       o'tayotganda sheet keraksiz yopilib-ochilib ketmasligi uchun. */
    blurTimerRef.current = window.setTimeout(() => {
      focusedRef.current = false;
      schedule();
    }, BLUR_GRACE_MS);
  }, [schedule]);

  const canCloseFromOverlay = useCallback(
    () => Date.now() >= blockOverlayRef.current,
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