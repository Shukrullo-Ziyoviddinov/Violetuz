import { useCallback, useEffect, useRef, useState } from 'react';

const SOFT_TIMEOUT_MS = 12000;

/** Kesh hit bo‘lsa ham skeleton kamida 1–2 frame ko‘rinsin (refresh miltillashini oldini oladi) */
function afterPaint(cb) {
  let innerId = 0;
  const outerId = window.requestAnimationFrame(() => {
    innerId = window.requestAnimationFrame(cb);
  });
  return () => {
    window.cancelAnimationFrame(outerId);
    window.cancelAnimationFrame(innerId);
  };
}

/**
 * <img> load holati — brauzer keshida onLoad kelmasa ham complete tekshiradi.
 * @param {string} src
 * @returns {{ ready: boolean, failed: boolean, showSkeleton: boolean, imgRef: function, onLoad: function, onError: function }}
 */
export function useImageReady(src) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  const srcRef = useRef(src);
  const genRef = useRef(0);
  srcRef.current = src;

  const markReady = useCallback(() => {
    setReady(true);
    setFailed(false);
  }, []);

  const markFailed = useCallback(() => {
    setFailed(true);
    setReady(true);
  }, []);

  useEffect(() => {
    genRef.current += 1;
    setReady(false);
    setFailed(false);
    if (!src) {
      setFailed(true);
      setReady(true);
    }
  }, [src]);

  const readElementState = useCallback((el) => {
    if (!el || !srcRef.current) return null;
    if (!el.complete) return null;
    return el.naturalWidth > 0 ? 'ok' : 'fail';
  }, []);

  const setImgRef = useCallback((el) => {
    imgRef.current = el;
  }, []);

  const reveal = useCallback((ok, gen) => {
    return afterPaint(() => {
      if (genRef.current !== gen) return;
      if (ok) markReady();
      else markFailed();
    });
  }, [markReady, markFailed]);

  useEffect(() => {
    if (!src || ready || failed) return undefined;

    const gen = genRef.current;
    let cancelled = false;
    let cancelPaint = null;

    const finish = (ok) => {
      if (cancelled || genRef.current !== gen) return;
      cancelPaint?.();
      cancelPaint = reveal(ok, gen);
    };

    const fromEl = readElementState(imgRef.current);
    if (fromEl) {
      finish(fromEl === 'ok');
      return () => {
        cancelled = true;
        cancelPaint?.();
      };
    }

    const pre = new Image();
    pre.onload = () => finish(true);
    pre.onerror = () => finish(false);
    pre.src = src;
    if (pre.complete) {
      finish(pre.naturalWidth > 0);
    }

    const timeoutId = window.setTimeout(() => {
      if (cancelled || genRef.current !== gen) return;
      const state = readElementState(imgRef.current);
      if (state) {
        finish(state === 'ok');
        return;
      }
      finish(true);
    }, SOFT_TIMEOUT_MS);

    return () => {
      cancelled = true;
      cancelPaint?.();
      pre.onload = null;
      pre.onerror = null;
      window.clearTimeout(timeoutId);
    };
  }, [src, ready, failed, readElementState, reveal]);

  const onLoad = useCallback(() => {
    const gen = genRef.current;
    reveal(true, gen);
  }, [reveal]);

  const onError = useCallback(() => {
    const gen = genRef.current;
    reveal(false, gen);
  }, [reveal]);

  const showSkeleton = Boolean(src) && !ready && !failed;

  return {
    ready,
    failed,
    showSkeleton,
    imgRef: setImgRef,
    onLoad,
    onError,
  };
}

/**
 * Bir nechta src uchun ready map (rating logolari).
 */
export function useImagesReadyMap(entries) {
  const key = entries.map((e) => `${e.key}:${e.src}`).join('|');
  const [readyMap, setReadyMap] = useState({});

  useEffect(() => {
    setReadyMap({});
    if (!entries.length) return undefined;

    const cleanups = entries.map(({ key: k, src }) => {
      if (!src) {
        setReadyMap((p) => ({ ...p, [k]: true }));
        return () => {};
      }
      const pre = new Image();
      const done = () => setReadyMap((p) => (p[k] ? p : { ...p, [k]: true }));
      pre.onload = done;
      pre.onerror = done;
      pre.src = src;
      if (pre.complete) {
        return afterPaint(done);
      }
      const t = window.setTimeout(done, SOFT_TIMEOUT_MS);
      return () => {
        pre.onload = null;
        pre.onerror = null;
        window.clearTimeout(t);
      };
    });

    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const allReady =
    entries.length === 0 || entries.every((e) => readyMap[e.key]);

  return { readyMap, allReady, markReady: (k) => setReadyMap((p) => (p[k] ? p : { ...p, [k]: true })) };
}
