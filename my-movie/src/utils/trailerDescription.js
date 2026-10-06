/**
 * trailersVideo.text → TrillerDescription description shakli.
 * Legacy string / yangi nested — ikkalasini qo‘llab-quvvatlaydi.
 */
export const normalizeTrailerDescription = (text) => {
  if (text == null) return null;

  const toLang = (raw) => {
    if (raw == null) return null;
    if (typeof raw === 'string') {
      const t = raw.trim();
      return t ? { text: t, year: '', country: '', genre: '' } : null;
    }
    if (typeof raw !== 'object') return null;
    const body = raw.text != null ? String(raw.text).trim() : '';
    const year = raw.year != null ? String(raw.year).trim() : '';
    const country = raw.country != null ? String(raw.country).trim() : '';
    const genre = raw.genre != null ? String(raw.genre).trim() : '';
    if (!body && !year && !country && !genre) return null;
    return { text: body, year, country, genre };
  };

  if (typeof text === 'string') {
    const lang = toLang(text);
    return lang ? { uz: lang, ru: { ...lang } } : null;
  }

  if (typeof text !== 'object') return null;

  const uz = toLang(text.uz);
  const ru = toLang(text.ru);
  if (!uz && !ru) return null;
  return {
    uz: uz || ru,
    ru: ru || uz,
  };
};
