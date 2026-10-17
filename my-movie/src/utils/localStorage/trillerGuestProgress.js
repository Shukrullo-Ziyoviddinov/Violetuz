/**
 * Mehmonning Parda ortida video foizi.
 * Faqat shu telefon. Hisobga yuborilmaydi va kino mehmon tarixiga yozilmaydi.
 */

export const TRILLER_GUEST_PROGRESS_STORAGE_KEY = 'violet_guest_triller_progress_v1';

const MAX_ENTRIES = 200;

const clamp01 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
};

const canUseStorage = () => {
  try {
    return typeof localStorage !== 'undefined' && localStorage != null;
  } catch {
    return false;
  }
};

const readRaw = () => {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(TRILLER_GUEST_PROGRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRaw = (entries) => {
  if (!canUseStorage()) return false;
  try {
    localStorage.setItem(TRILLER_GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
};

/**
 * @returns {Array<{ id: number, r: number }>}
 */
export const getGuestTrillerProgress = () =>
  readRaw()
    .map((row) => ({
      id: Number(row?.id),
      r: clamp01(row?.r),
    }))
    .filter((row) => Number.isInteger(row.id) && row.id > 0);

/**
 * Foiz faqat oshganda yangilanadi.
 * @param {number} trillerId
 * @param {number} completionRate
 */
export const recordGuestTrillerProgress = (trillerId, completionRate) => {
  const id = Number(trillerId);
  if (!Number.isInteger(id) || id <= 0) return false;

  const rate = clamp01(completionRate);
  if (rate <= 0) return false;

  const list = readRaw();
  const index = list.findIndex((row) => Number(row?.id) === id);

  if (index === -1) {
    list.push({ id, r: rate, t: Date.now() });
  } else if (rate > clamp01(list[index]?.r) + 1e-9) {
    list[index] = { id, r: rate, t: Date.now() };
  } else {
    return true;
  }

  const trimmed = list
    .map((row) => ({
      id: Number(row.id),
      r: clamp01(row.r),
      t: Number(row.t) || 0,
    }))
    .filter((row) => Number.isInteger(row.id) && row.id > 0 && row.r > 0)
    .sort((a, b) => b.t - a.t)
    .slice(0, MAX_ENTRIES);

  return writeRaw(trimmed);
};
