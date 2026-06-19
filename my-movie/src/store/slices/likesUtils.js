export const LIKE_HISTORY_KEY = 'violet_like_history_v1';
export const REACTIONS_KEY = 'violet_like_reactions_v1';
export const SHORTS_LIKES_KEY = 'violet_shorts_video_likes';

export const reactionKeyForPersist = (persistKey) => `persist:${persistKey}`;
export const reactionKeyForTrailer = (trailerKey) => `trailer:${trailerKey}`;

export const normalizeCategory = (raw) => {
  const v = String(raw || '').toLowerCase();
  if (v === 'movie') return 'movie';
  if (v === 'klip' || v === 'clip') return 'clip';
  if (v === 'konsert' || v === 'concert') return 'concert';
  return 'other';
};

/** Like meta + contentId dan barqaror kalit */
export const resolveCanonicalLikeKeys = (meta, contentId) => {
  if (!meta || contentId == null || contentId === '') return null;
  const category = normalizeCategory(meta.category);
  if (category === 'movie') {
    let id = null;
    const r = meta.route?.split('?')[0] || '';
    if (r.startsWith('/movie/')) {
      id = parseInt(r.split('/movie/')[1].split(/[/?#]/)[0], 10);
    }
    if (!Number.isFinite(id)) {
      id = parseInt(String(contentId).replace(/[^\d]/g, ''), 10);
    }
    if (!Number.isFinite(id)) return null;
    const route = `/movie/${id}`;
    return { key: `movie:${route}`, category: 'movie', contentId: String(id), route };
  }
  if (category === 'clip' || category === 'concert') {
    let id = null;
    const r = meta.route?.split('?')[0] || '';
    if (r.includes('/music/video/')) {
      id = parseInt(r.split('/music/video/')[1].split(/[/?#]/)[0], 10);
    }
    if (!Number.isFinite(id)) {
      id = parseInt(String(contentId).replace(/[^\d]/g, ''), 10);
    }
    if (!Number.isFinite(id)) return null;
    const route = `/music/video/${id}`;
    return { key: `${category}:${route}`, category, contentId: String(id), route };
  }
  const identity = meta.route || String(contentId);
  return {
    key: `${category}:${identity}`,
    category,
    contentId: String(contentId),
    route: meta.route || '',
  };
};

export const toCanonicalLikeHistoryItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const routeRaw = (item.route || '').split('?')[0] || '';

  if (routeRaw.startsWith('/movie/')) {
    const m = resolveCanonicalLikeKeys(
      { category: 'movie', route: routeRaw, title: item.title, image: item.image },
      item.contentId || routeRaw.split('/movie/')[1]
    );
    if (!m) return null;
    return {
      key: m.key,
      contentId: m.contentId,
      category: 'movie',
      title: item.title || '',
      image: item.image || '',
      route: m.route,
      updatedAt: item.updatedAt || 0,
    };
  }

  if (routeRaw.includes('/music/video/')) {
    const vid = parseInt(routeRaw.split('/music/video/')[1].split(/[/?#]/)[0], 10);
    if (!Number.isFinite(vid)) return null;
    let cat = normalizeCategory(item.category);
    if (cat !== 'clip' && cat !== 'concert') cat = 'clip';
    const m = resolveCanonicalLikeKeys({ category: cat, route: routeRaw }, vid);
    if (!m) return null;
    return {
      key: m.key,
      contentId: m.contentId,
      category: m.category,
      title: item.title || '',
      image: item.image || '',
      route: m.route,
      updatedAt: item.updatedAt || 0,
    };
  }

  if (typeof item.key === 'string' && item.key.startsWith('movie:')) {
    const rest = item.key.slice('movie:'.length);
    if (/^\d+$/.test(rest)) {
      return toCanonicalLikeHistoryItem({
        ...item,
        route: `/movie/${rest}`,
        category: 'movie',
        contentId: item.contentId || rest,
      });
    }
    if (rest.startsWith('/movie/')) {
      return toCanonicalLikeHistoryItem({ ...item, route: rest, category: 'movie' });
    }
  }

  if (typeof item.key === 'string' && (item.key.startsWith('clip:') || item.key.startsWith('concert:'))) {
    const prefix = item.key.startsWith('clip:') ? 'clip' : 'concert';
    const rest = item.key.slice(prefix.length + 1);
    if (/^\d+$/.test(rest)) {
      return toCanonicalLikeHistoryItem({
        ...item,
        route: `/music/video/${rest}`,
        category: prefix === 'clip' ? 'clip' : 'concert',
        contentId: item.contentId || rest,
      });
    }
    if (rest.includes('/music/video/')) {
      return toCanonicalLikeHistoryItem({
        ...item,
        route: rest,
        category: prefix === 'clip' ? 'clip' : 'concert',
      });
    }
  }

  const cat = normalizeCategory(item.category);
  const cid = item.contentId != null ? String(item.contentId).replace(/[^\d]/g, '') : '';
  const n = parseInt(cid, 10);
  if (cat === 'movie' && Number.isFinite(n)) {
    return toCanonicalLikeHistoryItem({
      ...item,
      route: `/movie/${n}`,
      category: 'movie',
      contentId: String(n),
    });
  }
  if ((cat === 'clip' || cat === 'concert') && Number.isFinite(n)) {
    return toCanonicalLikeHistoryItem({
      ...item,
      route: `/music/video/${n}`,
      category: cat,
      contentId: String(n),
    });
  }

  if (item.key && item.category) {
    return {
      key: item.key,
      contentId: String(item.contentId ?? ''),
      category: normalizeCategory(item.category),
      title: item.title || '',
      image: item.image || '',
      route: item.route || '',
      updatedAt: item.updatedAt || 0,
    };
  }
  return null;
};

export const migrateLikeHistoryItems = (parsed) => {
  const map = new Map();
  for (const item of parsed) {
    const c = toCanonicalLikeHistoryItem(item);
    if (!c) continue;
    const prev = map.get(c.key);
    if (!prev || (c.updatedAt || 0) > (prev.updatedAt || 0)) {
      map.set(c.key, c);
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
};

export const sameLogicalLikeItem = (row, canonical) => {
  if (row.key === canonical.key) return true;
  const a = row.contentId != null ? String(row.contentId) : '';
  const b = canonical.contentId != null ? String(canonical.contentId) : '';
  if (canonical.category === 'movie' && row.category === 'movie' && a === b && a !== '') {
    return true;
  }
  if (
    (canonical.category === 'clip' || canonical.category === 'concert') &&
    row.category === canonical.category &&
    a === b &&
    a !== ''
  ) {
    return true;
  }
  return false;
};

export const upsertItemInList = (items, meta, contentId) => {
  if (!meta || !contentId) return items;
  const canonical = resolveCanonicalLikeKeys(meta, contentId);
  if (!canonical) return items;
  const normalized = {
    key: canonical.key,
    contentId: canonical.contentId,
    category: canonical.category,
    title: meta.title || '',
    image: meta.image || '',
    route: canonical.route,
    updatedAt: Date.now(),
  };
  const next = items.filter((x) => !sameLogicalLikeItem(x, normalized));
  next.unshift(normalized);
  return next;
};

export const removeItemFromList = (items, meta, contentId) => {
  if (!meta || !contentId) return items;
  const canonical = resolveCanonicalLikeKeys(meta, contentId);
  if (!canonical) return items;
  return items.filter((x) => !sameLogicalLikeItem(x, canonical));
};

export const loadLegacyLikeHistory = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIKE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return migrateLikeHistoryItems(parsed);
  } catch {
    return [];
  }
};

export const loadLegacyShortsLikes = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SHORTS_LIKES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

export const loadLegacyReactions = () => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REACTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    /* migrate from per-key storage */
  }

  const reactions = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.endsWith('_isLiked')) {
        const base = key.slice(0, -'_isLiked'.length);
        if (localStorage.getItem(key) === 'true') {
          reactions[reactionKeyForPersist(base)] = 'like';
        }
      } else if (key.endsWith('_isDisliked')) {
        const base = key.slice(0, -'_isDisliked'.length);
        if (localStorage.getItem(key) === 'true') {
          const rk = reactionKeyForPersist(base);
          if (reactions[rk] !== 'like') {
            reactions[rk] = 'dislike';
          }
        }
      } else if (key.startsWith('trailer_reactions_')) {
        const tkey = key.slice('trailer_reactions_'.length);
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data?.userReaction === 'like') {
            reactions[reactionKeyForTrailer(tkey)] = 'like';
          } else if (data?.userReaction === 'dislike') {
            reactions[reactionKeyForTrailer(tkey)] = 'dislike';
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  return reactions;
};

/** Bitta reaction uchun eski localStorage kalitini yangilaydi */
export const applyLegacyReaction = (storageKey, value) => {
  if (!storageKey || typeof localStorage === 'undefined') return;
  try {
    if (storageKey.startsWith('persist:')) {
      const pk = storageKey.slice(8);
      localStorage.setItem(`${pk}_isLiked`, value === 'like' ? 'true' : 'false');
      localStorage.setItem(`${pk}_isDisliked`, value === 'dislike' ? 'true' : 'false');
    } else if (storageKey.startsWith('trailer:')) {
      const tk = storageKey.slice(8);
      const reaction = value === 'like' || value === 'dislike' ? value : null;
      localStorage.setItem(`trailer_reactions_${tk}`, JSON.stringify({ userReaction: reaction }));
    }
  } catch {
    /* ignore */
  }
};

/** Eski `${persistKey}_isLiked` va `trailer_reactions_*` kalitlarini sinxronlashtiradi */
export const syncLegacyReactionKeys = (reactions) => {
  if (typeof localStorage === 'undefined' || !reactions) return;
  try {
    Object.entries(reactions).forEach(([key, state]) => {
      applyLegacyReaction(key, state);
    });
  } catch {
    /* ignore */
  }
};
