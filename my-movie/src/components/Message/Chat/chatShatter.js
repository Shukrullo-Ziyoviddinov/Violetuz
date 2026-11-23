export const SHATTER_MS = 1180;

const CELL = 6;
const MAX_PIECES = 240;

const roundRect = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let line = '';
  let top = y;
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, top);
      line = word;
      top += lineHeight;
      return;
    }
    line = next;
  });
  if (line) ctx.fillText(line, x, top);
};

const paintBubble = (bubble, ctx, width, height) => {
  const style = getComputedStyle(bubble);
  const radius = parseFloat(style.borderTopLeftRadius) || 16;
  const bg = style.backgroundColor;
  ctx.clearRect(0, 0, width, height);
  if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, width, height, radius);
    ctx.fill();
  }
  const host = bubble.getBoundingClientRect();
  bubble.querySelectorAll('canvas, video, img').forEach((media) => {
    const box = media.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    try {
      ctx.drawImage(media, box.left - host.left, box.top - host.top, box.width, box.height);
    } catch {
      // Tayyor bo‘lmagan kadr tushib qoladi, qolgan zarralar chiziladi.
    }
  });
  const media = bubble.querySelector('video, img, canvas');
  const mediaBox = media?.getBoundingClientRect();
  const text = String(bubble.innerText || '').replace(/\s+/g, ' ').trim();
  if (!text || (mediaBox && mediaBox.height > height * 0.62)) return;
  ctx.fillStyle = style.color || '#fff';
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.textBaseline = 'top';
  const padX = parseFloat(style.paddingLeft) || 12;
  const padY = parseFloat(style.paddingTop) || 8;
  wrapText(ctx, text, padX, padY, Math.max(8, width - padX * 2), parseFloat(style.lineHeight) || 18);
};

const snapshot = (bubble, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  paintBubble(bubble, ctx, canvas.width, canvas.height);
  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let opaque = 0;
  for (let i = 3; i < sample.length; i += 16) {
    if (sample[i] > 18) opaque += 1;
  }
  if (opaque < 8) {
    ctx.fillStyle = 'rgba(244, 244, 248, 0.92)';
    roundRect(ctx, 0, 0, canvas.width, canvas.height, 16);
    ctx.fill();
  }
  let url = '';
  try {
    url = canvas.toDataURL('image/png');
  } catch {
    url = '';
  }
  return { canvas, ctx, url };
};

const visualOf = (bubble) => (
  bubble.matches?.('.chat-block') ? bubble : (bubble.querySelector('.chat-block') || bubble)
);

export const shatterElement = (bubble) => {
  if (!bubble) return null;
  const visual = visualOf(bubble);
  const rect = visual.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const shot = snapshot(visual, rect.width, rect.height);
  if (!shot) return null;
  let cols = Math.max(8, Math.ceil(rect.width / CELL));
  let rows = Math.max(5, Math.ceil(rect.height / CELL));
  while (cols * rows > MAX_PIECES) {
    if (cols >= rows) cols -= 1;
    else rows -= 1;
  }
  cols = Math.max(6, cols);
  rows = Math.max(4, rows);
  const cellW = rect.width / cols;
  const cellH = rect.height / rows;
  const layer = document.createElement('div');
  layer.className = 'chat-hold-burst';
  const { ctx, url } = shot;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sx = Math.min(shot.canvas.width - 1, Math.round((col + 0.5) * cellW));
      const sy = Math.min(shot.canvas.height - 1, Math.round((row + 0.5) * cellH));
      const pixel = ctx.getImageData(sx, sy, 1, 1).data;
      if (pixel[3] < 18) continue;
      const bit = document.createElement('span');
      bit.className = 'chat-hold-shard';
      bit.style.left = `${rect.left + col * cellW}px`;
      bit.style.top = `${rect.top + row * cellH}px`;
      bit.style.width = `${cellW + 0.6}px`;
      bit.style.height = `${cellH + 0.6}px`;
      if (url) {
        bit.style.backgroundImage = `url("${url}")`;
        bit.style.backgroundSize = `${rect.width}px ${rect.height}px`;
        bit.style.backgroundPosition = `${-col * cellW}px ${-row * cellH}px`;
      } else {
        bit.style.backgroundColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
      }
      layer.appendChild(bit);
      const px = (col + 0.5) * cellW;
      const py = (row + 0.5) * cellH;
      let vx = px - cx;
      let vy = py - cy;
      const len = Math.hypot(vx, vy) || 1;
      vx /= len;
      vy /= len;
      const speed = 62 + Math.random() * 58;
      const dx = vx * speed + (Math.random() - 0.5) * 18;
      const dy = vy * speed + (Math.random() - 0.45) * 28;
      const rot = (Math.random() - 0.5) * 120;
      const duration = SHATTER_MS - Math.round(Math.random() * 160);
      bit.animate(
        [
          { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${dx * 0.34}px, ${dy * 0.34}px) rotate(${rot * 0.35}deg) scale(0.94)`, opacity: 1, offset: 0.42 },
          { transform: `translate(${dx}px, ${dy + 16}px) rotate(${rot}deg) scale(0.45)`, opacity: 0 },
        ],
        { duration, easing: 'cubic-bezier(0.33, 0.15, 0.28, 1)', fill: 'forwards' }
      );
    }
  }
  if (!layer.childElementCount) return null;
  document.body.appendChild(layer);
  return layer;
};
