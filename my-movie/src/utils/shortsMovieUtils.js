export const getLocalizedField = (value, lang = 'uz') => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.uz || value.ru || '';
};

/** specs maydonlaridagi qiymatlarni label siz, ketma-ket qaytaradi */
export const getShortsSpecValues = (specs) => {
  if (!specs || typeof specs !== 'object') return [];

  const values = [];
  if (specs.duration != null && specs.duration !== '') values.push(String(specs.duration));
  if (specs.ageRating) values.push(String(specs.ageRating));
  if (specs.year != null && specs.year !== '') values.push(String(specs.year));

  if (Array.isArray(specs.countries)) {
    specs.countries.forEach((c) => {
      if (c != null && c !== '') values.push(String(c));
    });
  } else if (specs.countries) {
    values.push(String(specs.countries));
  }

  if (Array.isArray(specs.languages)) {
    specs.languages.forEach((l) => {
      if (l != null && l !== '') values.push(String(l));
    });
  } else if (specs.languages) {
    values.push(String(specs.languages));
  }

  return values;
};
