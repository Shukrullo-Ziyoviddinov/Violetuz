/**
 * Ekranga sig‘adigan karta soni.
 * ceil(konteyner / (karta + oraliq)). Raqamlar o‘lchamdan chiqadi.
 */

export const visibleSlotCount = (containerWidth, itemWidth, gap = 0) => {
  const width = Number(containerWidth);
  const stride = Number(itemWidth) + Number(gap);
  if (!(width > 0) || !(stride > 0)) return 0;
  return Math.ceil(width / stride);
};

const readGap = (item, axis) => {
  const parent = item?.parentElement;
  if (!parent || typeof getComputedStyle !== 'function') return 0;
  const style = getComputedStyle(parent);
  const axisGap = axis === 'row' ? style.rowGap : style.columnGap;
  const raw = axisGap && axisGap !== 'normal' ? axisGap : style.gap;
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
};

export const measureVisibleCount = (container, item) => {
  if (!container || !item) return 0;
  const itemWidth = item.getBoundingClientRect?.().width ?? 0;
  return visibleSlotCount(container.clientWidth, itemWidth, readGap(item, 'column'));
};

/** Gridda bir ekranga sig‘adigan karta: ustunlar × qatorlar. */
export const measureVisibleScreen = (container, item, viewportHeight) => {
  if (!container || !item) return 0;
  const rect = item.getBoundingClientRect?.() ?? {};
  const columns = visibleSlotCount(container.clientWidth, rect.width, readGap(item, 'column'));
  const rows = visibleSlotCount(viewportHeight, rect.height, readGap(item, 'row'));
  if (!(columns > 0) || !(rows > 0)) return 0;
  return columns * rows;
};
