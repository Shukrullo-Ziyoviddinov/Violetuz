import { useEffect, useState } from 'react';
import { measureVisibleCount, measureVisibleScreen } from './visibleCount';

/**
 * Konteyner va bitta karta o‘lchamidan ko‘rinadigan son.
 * Karta hali yo‘q bo‘lsa 0.
 */
export function useVisibleCount(containerRef, itemRef) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    let observer;
    let frame = 0;
    const measure = () => {
      if (!alive) return 0;
      const next = measureVisibleCount(containerRef?.current, itemRef?.current);
      setCount(next);
      return next;
    };
    const attach = () => {
      observer?.disconnect();
      if (typeof ResizeObserver === 'undefined') return;
      observer = new ResizeObserver(() => measure());
      if (containerRef?.current) observer.observe(containerRef.current);
      if (itemRef?.current) observer.observe(itemRef.current);
    };
    const first = measure();
    attach();
    // The card node can attach after the first effect. Keep measuring until it has a width.
    let tries = 0;
    const retry = () => {
      if (!alive || tries > 30) return;
      tries += 1;
      const next = measure();
      attach();
      if (next > 0) return;
      frame = requestAnimationFrame(retry);
    };
    if (!(first > 0)) frame = requestAnimationFrame(retry);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [containerRef, itemRef]);

  return count;
}

/**
 * Grid konteyner va bitta kartadan bir ekranga sig‘adigan son.
 * Balandlik — oynaning balandligi. Karta yo‘q bo‘lsa 0.
 */
export function useVisibleScreen(containerRef, itemRef, watch) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const measure = () => {
      const height = typeof window !== 'undefined' ? window.innerHeight : 0;
      setCount(measureVisibleScreen(containerRef?.current, itemRef?.current, height));
    };
    measure();
    window.addEventListener('resize', measure);
    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    if (containerRef?.current) observer.observe(containerRef.current);
    if (itemRef?.current) observer.observe(itemRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, itemRef, watch]);

  return count;
}
