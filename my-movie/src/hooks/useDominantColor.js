import { useState, useEffect } from 'react';
import { getDominantColor } from '../utils/dominantColor';

/**
 * Rasm manbasidan dominant rangni aniqlash hook
 * @param {string|null|undefined} imageSrc - Rasm URL (relative yoki absolute)
 * @returns {{ r: number, g: number, b: number }|null} dominantColor
 */
export const useDominantColor = (imageSrc) => {
  const [dominantColor, setDominantColor] = useState(null);

  useEffect(() => {
    if (!imageSrc) {
      setDominantColor(null);
      return;
    }

    setDominantColor(null);
    const imgSrc = imageSrc.startsWith('http')
      ? imageSrc
      : window.location.origin + (imageSrc.startsWith('/') ? imageSrc : '/' + imageSrc);

    let cancelled = false;
    getDominantColor(imgSrc).then((color) => {
      if (!cancelled && color) {
        setDominantColor(color);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  return dominantColor;
};
