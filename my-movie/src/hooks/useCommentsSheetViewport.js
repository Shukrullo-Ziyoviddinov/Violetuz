













import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SHEET_MQ = '(max-width: 768px)';

const TOP_CLOSED_RATIO = 0.16;
const TOP_CLOSED_MIN = 100;
const TOP_CLOSED_MAX = 168;
const TOP_SAFE = 8;
const KB_MIN = 36;
const OVERLAY_CLOSE_BLOCK_MS = 700;
const BLUR_GRACE_MS = 150;

export const isCommentsSheetViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(SHEET_MQ).matches;

const closedTopGap = (h) =>
  Math.round(Math.min(TOP_CLOSED_MAX, Math.max(TOP_CLOSED_MIN, h * TOP_CLOSED_RATIO)));

const closedHeightFor = (h) => Math.max(240, h - closedTopGap(h));

/**
 * Modal + klaviatura — HAR FREYMDA kuzatiladi (requestAnimationFrame loop),
 * shunchaki resize/scroll hodisalariga tayanib emas. Bu shart, chunki:
 *  - iOS Safari: faqat window.visualViewport qisqaradi, window.innerHeight
 *    o'zgarmaydi.
 *  - Android Chrome (standart holat): window.innerHeight ning o'zi ham
 *    klaviatura bilan birga qisqaradi, shu payt visualViewport deyarli
 *    innerHeight'ga teng bo'lib qoladi.
 * Ikkala holatni ham ("layout shrink" va "visual shrink") birga o'lchab,
 * kattasini klaviatura balandligi sifatida olamiz — shu bilan ikkala
 * brauzer turi ham to'g'ri ishlaydi va bir-biriga zid kelmaydi.
 * Freym-ma-freym o'lchash klaviatura animatsiyasi bilan modalni bir xil
 * tezlikda "yopishtirib" olib boradi — CSS transition kerak emas va
 * hatto zarar qiladi (kechikish/silkinish beradi).
 */
export function useCommentsSheetViewport(active, bodyScrollSelector) {
  const [sheetBottom, setSheetBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollYRef = useRef(0);
  const focusedRef = useRef(false);
  const baselineHRef = useRef(0);
  const loopRef = useRef(0);
  const blurTimerRef = useRef(0);
  const blockOverlayRef = useRef(0);

  /** Bitta o'lchov: state'larni yangilaydi, joriy klaviatura balandligini qaytaradi. */
  const measure = useCallback(() => {
    const inner = window.innerHeight;
    const vv = window.visualViewport;
    const baseline = baselineHRef.current || inner;

    const layoutShrink = Math.max(0, baseline - inner);
    const visualBottom = vv
      ? Math.max(0, Math.round(inner - (vv.offsetTop + vv.height)))
      : 0;
    const kbAmount = Math.max(layoutShrink, visualBottom);
    const isKeyboard = focusedRef.current && kbAmount >= KB_MIN;

    if (!isKeyboard) {
      setKeyboardOpen(false);
      setSheetBottom(0);
      setSheetHeight(closedHeightFor(inner));
      return kbAmount;
    }

    /* bottom faqat visual-viewport siljishi (iOS) — Android'da layout
       o'zi qisqargani uchun position:fixed elementlar allaqachon
       klaviatura ustida turadi, bottom=0 bo'lishi to'g'ri. */
    const bottom = visualBottom;
    const height = Math.min(
      inner - TOP_SAFE,
      Math.max(200, inner - bottom - TOP_SAFE)
    );
    setKeyboardOpen(true);
    setSheetBottom(bottom);
    setSheetHeight(height);
    return kbAmount;
  }, []);

  const loop = useCallback(() => {
    const kbAmount = measure();
    if (focusedRef.current || kbAmount >= KB_MIN) {
      loopRef.current = requestAnimationFrame(loop);
    } else {
      loopRef.current = 0;
    }
  }, [measure]);

  const startLoop = useCallback(() => {
    if (loopRef.current) return;
    loopRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopLoop = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    loopRef.current = 0;
  };

  useLayoutEffect(() => {
    if (!active) {
      focusedRef.current = false;
      stopLoop();
      window.clearTimeout(blurTimerRef.current);
      setSheetBottom(0);
      setSheetHeight(0);
      setKeyboardOpen(false);
      return undefined;
    }
    focusedRef.current = false;
    baselineHRef.current = window.innerHeight;
    setKeyboardOpen(false);
    setSheetBottom(0);
    setSheetHeight(closedHeightFor(window.innerHeight));
    return () => {
      stopLoop();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !isCommentsSheetViewport()) return undefined;
    const vk = navigator.virtualKeyboard;
    if (!vk?.addEventListener) return undefined;
    try {
      vk.overlaysContent = true;
    } catch {
      /* ignore */
    }
    const onGeom = () => startLoop();
    vk.addEventListener('geometrychange', onGeom);
    return () => vk.removeEventListener('geometrychange', onGeom);
  }, [active, startLoop]);

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
    const onEvt = () => startLoop();
    if (vv) {
      vv.addEventListener('resize', onEvt);
      vv.addEventListener('scroll', onEvt);
    }
    window.addEventListener('resize', onEvt);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', onEvt);
        vv.removeEventListener('scroll', onEvt);
      }
      window.removeEventListener('resize', onEvt);
    };
  }, [active, startLoop]);

  const onModalInputFocus = useCallback(() => {
    if (!isCommentsSheetViewport()) return;
    window.clearTimeout(blurTimerRef.current);
    focusedRef.current = true;
    blockOverlayRef.current = Date.now() + OVERLAY_CLOSE_BLOCK_MS;
    startLoop();
  }, [startLoop]);

  const onModalInputBlur = useCallback(() => {
    window.clearTimeout(blurTimerRef.current);
    /* Qisqa "grace" — reply tugmasi bosilib boshqa inputga fokus
       o'tayotganda sheet keraksiz yopilib-ochilib ketmasligi uchun.
       Grace tugagach loop davom etadi va klaviatura yopilish
       animatsiyasini ham freym-ma-freym kuzatib, silliq pastga
       qaytaradi. */
    blurTimerRef.current = window.setTimeout(() => {
      focusedRef.current = false;
      startLoop();
    }, BLUR_GRACE_MS);
  }, [startLoop]);

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