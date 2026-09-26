const fallbackLabel = (genre) => {
  const name = String(genre || '').trim();
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Mix nomi — qo‘shiqlar turgan bo‘lim sarlavhasi.
 * genre maydoni (masalan nasheed) ko‘rsatilmaydi.
 */
export const mixSectionLabel = ({ genre, tracks, allMusic, sections, t }) => {
  const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
  const counts = new Map();
  for (const row of tracks || []) {
    const track = byId.get(String(row.contentId));
    const key = String(track?.categoryNameMusic || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  let sectionKey = '';
  let best = 0;
  for (const [key, count] of counts) {
    if (count > best) {
      sectionKey = key;
      best = count;
    }
  }

  const section = (sections || []).find((item) => item.categoryNameMusic === sectionKey);
  if (section && t) {
    const title = t(section.titleKey, section.titleDefault);
    if (title) return title;
  }
  return fallbackLabel(genre);
};
