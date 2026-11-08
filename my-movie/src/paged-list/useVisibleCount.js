import { useEffect, useState } from 'react';
import { measureVisibleCount, measureVisibleScreen } from './visibleCount';

/**
 * Konteyner va bitta karta o‘lchamidan ko‘rinadigan son.
 * Karta hali yo‘q bo‘lsa 0.
 */
export function useVisibleCount(containerRef, itemRef) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const measure = () => {
      setCount(measureVisibleCount(containerRef?.current, itemRef?.current));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    if (containerRef?.current) observer.observe(containerRef.current);
    if (itemRef?.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
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
