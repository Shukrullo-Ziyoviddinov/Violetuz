import { useCallback, useEffect, useRef, useState } from 'react';

const SOFT_TIMEOUT_MS = 12000;

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
    setReady(false);
    setFailed(false);
    if (!src) {
      setFailed(true);
      setReady(true);
    }
  }, [src]);

  const syncFromElement = useCallback(
    (el) => {
      if (!el || !srcRef.current) return false;
      if (!el.complete) return false;
      if (el.naturalWidth > 0) {
        markReady();
        return true;
      }
      markFailed();
      return true;
    },
    [markReady, markFailed]
  );

  const setImgRef = useCallback(
    (el) => {
      imgRef.current = el;
      syncFromElement(el);
    },
    [syncFromElement]
  );

  useEffect(() => {
    if (!src || ready || failed) return undefined;

    // DOM img (agar ref allaqachon o‘rnatilgan bo‘lsa)
    if (syncFromElement(imgRef.current)) return undefined;

    // Preload — kesh / erta load
    const pre = new Image();
    const onDone = () => {
      if (pre.naturalWidth > 0) markReady();
      else markFailed();
    };
    pre.onload = onDone;
    pre.onerror = () => markFailed();
    pre.src = src;
    if (pre.complete) onDone();

    const timeoutId = window.setTimeout(() => {
      if (syncFromElement(imgRef.current)) return;
      // Soft unblock — abadiy skeleton bo‘lmasin
      markReady();
    }, SOFT_TIMEOUT_MS);

    return () => {
      pre.onload = null;
      pre.onerror = null;
      window.clearTimeout(timeoutId);
    };
  }, [src, ready, failed, markReady, markFailed, syncFromElement]);

  const showSkeleton = Boolean(src) && !ready && !failed;

  return {
    ready,
    failed,
    showSkeleton,
    imgRef: setImgRef,
    onLoad: markReady,
    onError: markFailed,
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
      if (pre.complete) done();
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
