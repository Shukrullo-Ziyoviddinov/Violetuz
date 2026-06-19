
export const REPOST_ENTITY_TYPES = Object.freeze([
  'movie',
  'music',
  'klip',
  'konsert',
  'movieShorts',
  'musicshorts',
]);

const ENTITY_SET = new Set(REPOST_ENTITY_TYPES);

/** Profil filtrlari — RepostFilter bilan bir xil tartib va id dan olinadi */
export const REPOST_UI_FILTERS = Object.freeze([
  { id: 'all', label: 'Hammasi', icon: 'fa-border-all' },
  { id: 'movie', label: 'Kino', icon: 'fa-film' },
  { id: 'shorts', label: 'Shorts', icon: 'fa-mobile-screen-button' },
  { id: 'klip', label: 'Klip', icon: 'fa-video' },
  { id: 'konsert', label: 'Konsert', icon: 'fa-microphone-lines' },
  { id: 'music', label: 'Music', icon: 'fa-music' },
]);

export function normalizeRepostId(id) {
  if (id == null || id === '') return null;
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? String(id) : n;
}

/**
 * @param {unknown} raw — admin/API dan kelgan type
 * @returns {string|null} — REPOST_ENTITY_TYPES dan biri yoki null
 */
export function normalizeRepostType(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (ENTITY_SET.has(s)) return s;

  const compact = s.replace(/_/g, '').toLowerCase();
  const map = {
    movie: 'movie',
    music: 'music',
    klip: 'klip',
    konsert: 'konsert',
    clip: 'klip',
    concert: 'konsert',
    movieshorts: 'movieShorts',
    musicshorts: 'musicshorts',
    movieshort: 'movieShorts',
    musicshort: 'musicshorts',
  };
  const mapped = map[compact];
  if (mapped) return mapped;

  return null;
}

/**
 * @returns {object|null} — { ...item, id, type } yoki noto‘g‘ri bo‘lsa null
 */
export function sanitizeRepostItem(item) {
  if (!item || typeof item !== 'object') return null;
  const id = normalizeRepostId(item.id);
  const type = normalizeRepostType(item.type);
  if (id == null || !type) return null;
  return { ...item, id, type };
}

/**
 * localStorage dan o‘qilganda: noto‘g‘ri yozuvlarni tashlash, type/id ni tuzatish, dublikatlarni olib tashlash.
 * @returns {{ items: object[], changed: boolean }}
 */
export function migrateRepostsList(raw) {
  if (!Array.isArray(raw)) return { items: [], changed: true };

  const seen = new Set();
  const out = [];
  let changed = false;

  for (const item of raw) {
    const s = sanitizeRepostItem(item);
    if (!s) {
      changed = true;
      continue;
    }
    const key = `${String(s.id)}::${s.type}`;
    if (seen.has(key)) {
      changed = true;
      continue;
    }
    seen.add(key);

    const merged = { ...item, ...s };
    if (merged.type !== item.type || String(merged.id) !== String(item.id)) changed = true;
    out.push(merged);
  }

  if (out.length !== raw.length) changed = true;

  return { items: out, changed };
}

/** Profil filtri bilan mosligi (canonical type talab qilinadi) */
export function repostMatchesFilter(canonicalType, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'shorts') {
    return canonicalType === 'movieShorts' || canonicalType === 'musicshorts';
  }
  return canonicalType === filterId;
}

/**
 * URL query: repostShorts=movieShorts:1,musicshorts:10001
 * @returns {Array<{ type: 'movieShorts' | 'musicshorts', id: string | number }>|null}
 */
export function parseRepostShortsParam(raw) {
  if (raw == null || raw === '') return null;
  const str = String(raw).trim();
  if (!str) return null;
  const out = [];
  for (const segment of str.split(',')) {
    const p = segment.trim();
    const colon = p.indexOf(':');
    if (colon === -1) continue;
    const type = p.slice(0, colon).trim();
    const idRaw = p.slice(colon + 1).trim();
    if (!idRaw) continue;
    if (type !== 'movieShorts' && type !== 'musicshorts') continue;
    const idNum = parseInt(idRaw, 10);
    const id = Number.isNaN(idNum) ? idRaw : idNum;
    out.push({ type, id });
  }
  return out.length ? out : null;
}
