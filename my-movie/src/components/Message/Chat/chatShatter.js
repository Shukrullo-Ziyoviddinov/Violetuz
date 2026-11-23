export const SHATTER_MS = 520;

export const shatterElement = (bubble) => {
  if (!bubble) return null;
  const rect = bubble.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const cols = rect.width > 150 ? 4 : 3;
  const rows = rect.height > 84 ? 3 : 2;
  const layer = document.createElement('div');
  layer.className = 'chat-hold-burst';
  document.body.appendChild(layer);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const piece = bubble.cloneNode(true);
      piece.classList.add('chat-hold-shard');
      piece.style.visibility = 'visible';
      piece.style.width = `${rect.width}px`;
      piece.style.height = `${rect.height}px`;
      piece.style.left = `${rect.left}px`;
      piece.style.top = `${rect.top}px`;
      piece.style.transform = 'none';
      piece.style.transformOrigin = `${((col + 0.5) / cols) * 100}% ${((row + 0.5) / rows) * 100}%`;
      piece.style.clipPath = `inset(${(row / rows) * 100}% ${((cols - col - 1) / cols) * 100}% ${((rows - row - 1) / rows) * 100}% ${(col / cols) * 100}%)`;
      layer.appendChild(piece);
      const ox = (col + 0.5) / cols - 0.5;
      const oy = (row + 0.5) / rows - 0.5;
      const dx = ox * Math.max(88, rect.width * 1.05);
      const dy = oy * Math.max(72, rect.height) + 42;
      const rot = ox * 52 + oy * 22;
      piece.animate(
        [
          { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx * 0.28}px, ${dy * 0.12}px) rotate(${rot * 0.35}deg)`, opacity: 1, offset: 0.22 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: SHATTER_MS, easing: 'cubic-bezier(0.16, 0.72, 0.24, 1)', fill: 'forwards' }
      );
    }
  }
  return layer;
};
