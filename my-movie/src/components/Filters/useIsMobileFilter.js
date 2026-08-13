import { useState, useEffect } from 'react';

export const FILTERS_MOBILE_MAX = 768;

/** Kino filterlari — faqat mobil (≤768). Desktop o‘zgarmaydi. */
export const useIsMobileFilter = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= FILTERS_MOBILE_MAX
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= FILTERS_MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
};
