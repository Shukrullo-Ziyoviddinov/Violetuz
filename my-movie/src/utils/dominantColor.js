/**
 * Extract dominant color from image using Canvas API
 * Samples center region, excludes very dark/light pixels for accuracy
 * @param {string} imageUrl - Image src URL
 * @returns {Promise<{ r: number, g: number, b: number }>}
 */
export const getDominantColor = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    // crossOrigin faqat cross-origin URL lar uchun - same-origin da canvas "taint" bo'ladi
    try {
      const url = new URL(imageUrl, window.location.origin);
      if (url.origin !== window.location.origin) {
        img.crossOrigin = 'anonymous';
      }
    } catch {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const colorCount = {};
        const quantize = (v) => Math.round(v / 20) * 20;
        const centerStart = Math.floor(size * 0.2);
        const centerEnd = Math.floor(size * 0.8);

        for (let y = centerStart; y < centerEnd; y += 2) {
          for (let x = centerStart; x < centerEnd; x += 2) {
            const i = (y * size + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 200) continue;
            const brightness = (r + g + b) / 3;
            if (brightness < 25 || brightness > 230) continue;
            const qr = quantize(r);
            const qg = quantize(g);
            const qb = quantize(b);
            const key = `${qr},${qg},${qb}`;
            colorCount[key] = (colorCount[key] || 0) + 1;
          }
        }

        let maxCount = 0;
        let dominantKey = '';
        for (const [key, count] of Object.entries(colorCount)) {
          if (count > maxCount) {
            maxCount = count;
            dominantKey = key;
          }
        }

        if (dominantKey) {
          let [r, g, b] = dominantKey.split(',').map(Number);
          const maxC = Math.max(r, g, b);
          const targetMax = 140;
          const scale = maxC > 0 ? targetMax / maxC : 1;
          r = Math.round(Math.min(255, Math.max(0, r * scale * 0.85)));
          g = Math.round(Math.min(255, Math.max(0, g * scale * 0.85)));
          b = Math.round(Math.min(255, Math.max(0, b * scale * 0.85)));
          resolve({ r, g, b });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};
