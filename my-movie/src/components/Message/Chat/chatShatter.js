export const SHATTER_MS = 1180;

const EMOJI_CELL = 6;
const EMOJI_MAX = 240;
const ANIM_CELL = 5;
const ANIM_MAX = 520;
const FINE_CELL = 3.5;
const FINE_MAX = 1100;

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

const paintBubble = (bubble, ctx, width, height, kind) => {
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
  if (kind === 'emoji') {
    const glyph = String(bubble.querySelector('.chat-emoji-still, .chat-emoji-solo, .chat-block-text')?.textContent || bubble.innerText || '').trim();
    if (!glyph) return;
    ctx.fillStyle = style.color || '#fff';
    ctx.font = `${Math.floor(Math.min(width, height) * 0.86)}px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, width / 2, height / 2);
    return;
  }
  if (kind === 'anim') return;
  const media = bubble.querySelector('video, img, canvas');
  const mediaBox = media?.getBoundingClientRect();
  const text = String(bubble.innerText || '').replace(/\s+/g, ' ').trim();
  if (!text || (mediaBox && mediaBox.height > height * 0.62)) return;
  ctx.fillStyle = style.color || '#fff';
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const padX = parseFloat(style.paddingLeft) || 12;
  const padY = parseFloat(style.paddingTop) || 8;
  wrapText(ctx, text, padX, padY, Math.max(8, width - padX * 2), parseFloat(style.lineHeight) || 18);
};

const drawSvg = (svg, ctx, host) => new Promise((resolve) => {
  const box = svg.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) {
    resolve();
    return;
  }
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(Math.round(box.width)));
  clone.setAttribute('height', String(Math.round(box.height)));
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.onload = () => {
    try {
      ctx.drawImage(img, box.left - host.left, box.top - host.top, box.width, box.height);
    } catch {
      // SVG kadr tushmasa, qolgan rasm ishlatiladi.
    }
    resolve();
  };
  img.onerror = () => resolve();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
});

const snapshot = (bubble, width, height, kind) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  paintBubble(bubble, ctx, canvas.width, canvas.height, kind);
  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let opaque = 0;
  for (let i = 3; i < sample.length; i += 16) {
    if (sample[i] > 18) opaque += 1;
  }
  if (opaque < 8 && kind !== 'anim' && kind !== 'emoji') {
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

const kindOf = (visual) => {
  if (visual.classList?.contains('is-gif')) return 'gif';
  if (visual.classList?.contains('is-anim')) return 'anim';
  if (visual.classList?.contains('is-emoji')) return 'emoji';
  return 'text';
};

export const shatterElement = (bubble) => {
  if (!bubble) return null;
  const visual = visualOf(bubble);
  const rect = visual.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const kind = kindOf(visual);
  const shot = snapshot(visual, rect.width, rect.height, kind);
  if (!shot) return null;
  const far = kind === 'gif' || kind === 'text';
  const cell = kind === 'anim' ? ANIM_CELL : (kind === 'emoji' ? EMOJI_CELL : FINE_CELL);
  const maxPieces = kind === 'anim' ? ANIM_MAX : (kind === 'emoji' ? EMOJI_MAX : FINE_MAX);
  const minCols = kind === 'anim' ? 10 : (kind === 'emoji' ? 8 : 12);
  const minRows = kind === 'anim' ? 7 : (kind === 'emoji' ? 6 : 8);
  let cols = Math.max(minCols, Math.ceil(rect.width / cell));
  let rows = Math.max(minRows, Math.ceil(rect.height / cell));
  while (cols * rows > maxPieces) {
    if (cols >= rows) cols -= 1;
    else rows -= 1;
  }
  cols = Math.max(kind === 'anim' ? 8 : (kind === 'emoji' ? 6 : 10), cols);
  rows = Math.max(kind === 'emoji' ? 5 : 6, rows);
  const cellW = rect.width / cols;
  const cellH = rect.height / rows;
  const layer = document.createElement('div');
  layer.className = 'chat-hold-burst';
  const { ctx } = shot;
  if (kind === 'anim') {
    ctx.fillStyle = 'rgba(244, 244, 248, 0.92)';
    roundRect(ctx, 0, 0, shot.canvas.width, shot.canvas.height, 16);
    ctx.fill();
  }
  const spawn = () => {
  if (kind === 'emoji') {
    const probe = ctx.getImageData(0, 0, shot.canvas.width, shot.canvas.height).data;
    let opaque = 0;
    let seen = 0;
    for (let i = 3; i < probe.length; i += 16) {
      seen += 1;
      if (probe[i] > 18) opaque += 1;
    }
    if (!seen || opaque / seen < 0.12) {
      ctx.fillStyle = 'rgba(244, 244, 248, 0.92)';
      roundRect(ctx, 0, 0, shot.canvas.width, shot.canvas.height, 16);
      ctx.fill();
    }
  }
  let url = '';
  try {
    url = shot.canvas.toDataURL('image/png');
  } catch {
    url = '';
  }
  const pixels = ctx.getImageData(0, 0, shot.canvas.width, shot.canvas.height).data;
  const alphaAt = (x, y) => pixels[((y * shot.canvas.width) + x) * 4 + 3];
  const colorAt = (x, y) => {
    const i = ((y * shot.canvas.width) + x) * 4;
    return pixels.slice(i, i + 4);
  };
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sx = Math.min(shot.canvas.width - 1, Math.round((col + 0.5) * cellW));
      const sy = Math.min(shot.canvas.height - 1, Math.round((row + 0.5) * cellH));
      const near = [
        alphaAt(sx, sy),
        alphaAt(Math.max(0, sx - 1), sy),
        alphaAt(sx, Math.max(0, sy - 1)),
      ];
      if (near.every((alpha) => alpha < 18)) continue;
      const pixel = colorAt(sx, sy);
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
      const speed = far ? 118 + Math.random() * 84 : 62 + Math.random() * 58;
      const dx = vx * speed + (Math.random() - 0.5) * (far ? 36 : 18);
      const dy = vy * speed + (Math.random() - 0.45) * (far ? 52 : 28);
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
  };
  const svg = visual.querySelector('svg');
  if (svg) drawSvg(svg, ctx, visual.getBoundingClientRect()).then(spawn);
  else spawn();
  if (!svg && !layer.childElementCount) return null;
  document.body.appendChild(layer);
  return layer;
};
