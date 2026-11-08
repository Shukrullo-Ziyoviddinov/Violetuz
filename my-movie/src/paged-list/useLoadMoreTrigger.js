import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Karusel oxirigacha qolgan masofa bitta kartadan kam bo‘lsa signal keladi.
 */
export const isCarouselNearEnd = (remaining, stride) => {
  const left = Number(remaining);
  const step = Number(stride);
  if (!(step > 0) || !Number.isFinite(left)) return false;
  return left < step;
};

/**
 * Bitta yuklash chaqiruvi. Vertikal — kesishma. Gorizontal — karusel signali.
 */
export function useLoadMoreTrigger({ enabled = true, onLoadMore } = {}) {
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const [node, setNode] = useState(null);

  const request = useCallback(() => {
    if (!enabled) return;
    onLoadMoreRef.current?.();
  }, [enabled]);

  const sentinelRef = useCallback((element) => {
    setNode((current) => (current === element ? current : element));
  }, []);

  useEffect(() => {
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) request();
    }, { rootMargin: '160px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, enabled, request]);

  const notifyNearEnd = useCallback(() => {
    request();
  }, [request]);

  return { sentinelRef, notifyNearEnd };
}
