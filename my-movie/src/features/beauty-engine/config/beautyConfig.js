// Effekt, filtr, fon va tayyor ko‘rinish shu yerda.
// Yangi band shu ro‘yxatga qo‘shiladi. Saqlash kaliti bitta.

export const BEAUTY_STORAGE_KEY = 'violetplay_beauty_settings';

const STORAGE_LIMIT = 8192;

const qualities = [
  { id: 'low', label: { uz: 'Past', ru: 'Низкое' } },
  { id: 'medium', label: { uz: 'O‘rta', ru: 'Среднее' } },
  { id: 'high', label: { uz: 'Yuqori', ru: 'Высокое' } },
  { id: 'auto', label: { uz: 'Avto', ru: 'Авто' } },
];

const effects = [
  { id: 'smooth', label: { uz: 'Silliq', ru: 'Гладкость' }, min: 0, max: 100, defaultValue: 0, shape: false },
  { id: 'retouch', label: { uz: 'Retush', ru: 'Ретушь' }, min: 0, max: 100, defaultValue: 0, shape: false },
  { id: 'brighten', label: { uz: 'Yorug‘lik', ru: 'Свет' }, min: 0, max: 100, defaultValue: 0, shape: false },
  { id: 'clear', label: { uz: 'Aniq', ru: 'Чёткость' }, min: 0, max: 100, defaultValue: 0, shape: false },
  { id: 'denoise', label: { uz: 'Shovqin', ru: 'Шум' }, min: 0, max: 100, defaultValue: 0, shape: false },
  { id: 'slim', label: { uz: 'Yuz', ru: 'Лицо' }, min: 0, max: 100, defaultValue: 0, shape: true },
  { id: 'jaw', label: { uz: 'Jag‘', ru: 'Челюсть' }, min: 0, max: 100, defaultValue: 0, shape: true },
  { id: 'eye', label: { uz: 'Ko‘z', ru: 'Глаза' }, min: 0, max: 100, defaultValue: 0, shape: true },
  { id: 'nose', label: { uz: 'Burun', ru: 'Нос' }, min: 0, max: 100, defaultValue: 0, shape: true },
  { id: 'tone', label: { uz: 'Teri', ru: 'Тон' }, min: 0, max: 100, defaultValue: 0, shape: false },
  { id: 'contour', label: { uz: 'Yuz chizig‘i', ru: 'Контур' }, min: 0, max: 100, defaultValue: 0, shape: false },
];

const adjustments = [
  { id: 'brightness', label: { uz: 'Yorqinlik', ru: 'Яркость' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'contrast', label: { uz: 'Kontrast', ru: 'Контраст' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'saturation', label: { uz: 'To‘yinganlik', ru: 'Насыщенность' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'exposure', label: { uz: 'Ekspozitsiya', ru: 'Экспозиция' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'temperature', label: { uz: 'Harorat', ru: 'Температура' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'tint', label: { uz: 'Tus', ru: 'Оттенок' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'highlights', label: { uz: 'Yorug‘ joy', ru: 'Света' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'shadows', label: { uz: 'Soya', ru: 'Тени' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'gamma', label: { uz: 'Gamma', ru: 'Гамма' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'vibrance', label: { uz: 'Jonlilik', ru: 'Сочность' }, min: -100, max: 100, defaultValue: 0 },
  { id: 'sharpness', label: { uz: 'O‘tkirlik', ru: 'Резкость' }, min: 0, max: 100, defaultValue: 0 },
];

const grade = (partial = {}) => ({
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  gamma: 0,
  vibrance: 0,
  sharpness: 0,
  ...partial,
});

const filters = [
  { id: 'original', label: { uz: 'Asl', ru: 'Оригинал' }, swatch: '#2a2438', grade: grade() },
  { id: 'natural', label: { uz: 'Tabiiy', ru: 'Естественный' }, swatch: 'linear-gradient(135deg, #e6c7a8, #8d6b58)', grade: grade({ temperature: 8, contrast: 6, vibrance: 8 }) },
  { id: 'soft', label: { uz: 'Yumshoq', ru: 'Мягкий' }, swatch: 'linear-gradient(135deg, #f6d7e6, #c9a4d4)', grade: grade({ contrast: -12, brightness: 6, saturation: -6, highlights: 8 }) },
  { id: 'clear', label: { uz: 'Tiniq', ru: 'Чёткий' }, swatch: 'linear-gradient(135deg, #d9ecff, #8eb6e8)', grade: grade({ contrast: 10, sharpness: 18, vibrance: 6 }) },
  { id: 'portrait', label: { uz: 'Portret', ru: 'Портрет' }, swatch: 'linear-gradient(135deg, #f0c7b0, #c48b9a)', grade: grade({ brightness: 4, contrast: 8, temperature: 10, saturation: 4, sharpness: 8 }) },
  { id: 'cinematic', label: { uz: 'Kino', ru: 'Кино' }, swatch: 'linear-gradient(135deg, #1b2438, #c6a15b)', grade: grade({ contrast: 16, saturation: -8, temperature: -6, shadows: -12, highlights: -8, gamma: -6 }) },
  { id: 'warm', label: { uz: 'Iliq', ru: 'Тёплый' }, swatch: 'linear-gradient(135deg, #f3c98a, #e08a4f)', grade: grade({ temperature: 32, tint: 8, saturation: 6 }) },
  { id: 'cool', label: { uz: 'Salqin', ru: 'Холодный' }, swatch: 'linear-gradient(135deg, #c9dff5, #6f93c9)', grade: grade({ temperature: -28, tint: -4, saturation: 4 }) },
  { id: 'vintage', label: { uz: 'Eskicha', ru: 'Винтаж' }, swatch: 'linear-gradient(135deg, #e7d3b0, #a68462)', grade: grade({ saturation: -22, contrast: 8, temperature: 14, gamma: 8, shadows: 10 }) },
  { id: 'golden', label: { uz: 'Oltin', ru: 'Золото' }, swatch: 'linear-gradient(135deg, #f8e2a0, #d7a441)', grade: grade({ temperature: 24, brightness: 6, saturation: 10, highlights: 8 }) },
  { id: 'fresh', label: { uz: 'Yangi', ru: 'Свежий' }, swatch: 'linear-gradient(135deg, #d9f5d6, #7fbf90)', grade: grade({ vibrance: 18, saturation: 8, temperature: -4, contrast: 6 }) },
  { id: 'bw', label: { uz: 'Oq-qora', ru: 'Ч/б' }, swatch: 'linear-gradient(135deg, #f4f4f4, #2b2b2b)', grade: grade({ saturation: -100, contrast: 12 }) },
  { id: 'film', label: { uz: 'Plyonka', ru: 'Плёнка' }, swatch: 'linear-gradient(135deg, #d7c4a8, #6d5a4a)', grade: grade({ contrast: 12, saturation: -10, temperature: 6, gamma: 4, sharpness: 6 }) },
  { id: 'night', label: { uz: 'Tun', ru: 'Ночь' }, swatch: 'linear-gradient(135deg, #1a2140, #3d6d9a)', grade: grade({ brightness: -8, contrast: 14, temperature: -12, shadows: -16, saturation: 6 }) },
  { id: 'vivid', label: { uz: 'Yorqin', ru: 'Яркий' }, swatch: 'linear-gradient(135deg, #ffb3c7, #7d5cff)', grade: grade({ saturation: 22, vibrance: 20, contrast: 10 }) },
  { id: 'matte', label: { uz: 'Mat', ru: 'Матовый' }, swatch: 'linear-gradient(135deg, #d9d3cc, #8d8680)', grade: grade({ contrast: -8, saturation: -12, highlights: -10, shadows: 14 }) },
];

const backgrounds = [
  { id: 'original', label: { uz: 'Asl', ru: 'Оригинал' }, fields: [] },
  { id: 'blur', label: { uz: 'Xira', ru: 'Размытие' }, fields: ['amount'], defaultAmount: 40 },
  { id: 'image', label: { uz: 'Rasm', ru: 'Фото' }, fields: ['url'] },
  { id: 'video', label: { uz: 'Video', ru: 'Видео' }, fields: ['url'] },
  { id: 'solid', label: { uz: 'Rang', ru: 'Цвет' }, fields: ['color'] },
  { id: 'gradient', label: { uz: 'Gradient', ru: 'Градиент' }, fields: ['from', 'to'] },
];

const presets = [
  {
    id: 'original',
    label: { uz: 'Asl', ru: 'Оригинал' },
    swatch: '#2a2438',
    filter: 'original',
    beauty: {},
    background: { mode: 'original' },
    resetAdjust: true,
  },
  {
    id: 'natural',
    label: { uz: 'Tabiiy', ru: 'Естественный' },
    swatch: 'linear-gradient(135deg, #e6c7a8, #8d6b58)',
    filter: 'natural',
    beauty: { smooth: 20, tone: 10, brighten: 6 },
  },
  {
    id: 'soft',
    label: { uz: 'Yumshoq', ru: 'Мягкая' },
    swatch: 'linear-gradient(135deg, #f6d7e6, #c9a4d4)',
    filter: 'soft',
    beauty: { smooth: 55, retouch: 24, brighten: 18, tone: 16 },
  },
  {
    id: 'clear',
    label: { uz: 'Tiniq', ru: 'Чистая' },
    swatch: 'linear-gradient(135deg, #d9ecff, #8eb6e8)',
    filter: 'clear',
    beauty: { smooth: 12, retouch: 10, clear: 46, denoise: 22 },
  },
  {
    id: 'studio',
    label: { uz: 'Studiya', ru: 'Студия' },
    swatch: 'linear-gradient(135deg, #f7f2ea, #b9a48a)',
    filter: 'portrait',
    beauty: { smooth: 34, retouch: 30, brighten: 22, tone: 14, clear: 20 },
  },
  {
    id: 'portrait',
    label: { uz: 'Portret', ru: 'Портрет' },
    swatch: 'linear-gradient(135deg, #f0c7b0, #9b4fe7)',
    filter: 'portrait',
    beauty: { smooth: 40, retouch: 26, tone: 22, brighten: 12 },
  },
  {
    id: 'cinematic',
    label: { uz: 'Kino', ru: 'Кино' },
    swatch: 'linear-gradient(135deg, #1b2438, #c6a15b)',
    filter: 'cinematic',
    beauty: { smooth: 16, clear: 18, tone: 8, denoise: 10 },
  },
];

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const unitsFrom = (defs, partial) => {
  const next = {};
  defs.forEach((def) => {
    const raw = partial && Object.prototype.hasOwnProperty.call(partial, def.id)
      ? partial[def.id]
      : def.defaultValue;
    next[def.id] = clamp(raw, def.min, def.max, def.defaultValue);
  });
  return next;
};

const copyList = (list) => list.map((item) => ({
  ...item,
  label: item.label ? { ...item.label } : undefined,
  grade: item.grade ? { ...item.grade } : undefined,
  beauty: item.beauty ? { ...item.beauty } : undefined,
  background: item.background ? { ...item.background } : undefined,
  fields: item.fields ? [...item.fields] : undefined,
}));

const hexOf = (value) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text) ? text.toLowerCase() : '';
};

const httpUrl = (value) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || text.length > 2048) return '';
  if (/^(?:data|blob):/i.test(text)) return '';
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
};

const storageBox = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
};

const removeOwn = (box) => {
  try {
    box.removeItem(BEAUTY_STORAGE_KEY);
  } catch {
    // yozuv yopiq bo‘lsa sozlama xotirada qoladi
  }
};

presets.forEach((preset) => {
  if (!filters.some((filter) => filter.id === preset.filter)) {
    throw new Error(`Preset ${preset.id} filter`);
  }
  effects.filter((effect) => effect.shape).forEach((effect) => {
    if (preset.beauty[effect.id]) throw new Error(`Preset ${preset.id} turns on ${effect.id}`);
  });
  if (preset.beauty) Object.freeze(preset.beauty);
  if (preset.background) Object.freeze(preset.background);
  Object.freeze(preset.label);
  Object.freeze(preset);
});

[effects, adjustments, filters, backgrounds, qualities].forEach((list) => {
  list.forEach((item) => {
    if (item.label) Object.freeze(item.label);
    if (item.grade) Object.freeze(item.grade);
    if (item.fields) Object.freeze(item.fields);
    Object.freeze(item);
  });
  Object.freeze(list);
});
Object.freeze(presets);

export const beautyEffects = effects;
export const beautyAdjustments = adjustments;

export const isQuality = (quality) => qualities.some((item) => item.id === quality);
export const isFilterId = (filterId) => filters.some((item) => item.id === filterId);

export const resolveGrade = (filterId, adjust = {}) => {
  const filter = filters.find((item) => item.id === filterId) || filters[0];
  const next = {};
  adjustments.forEach((def) => {
    const fromFilter = filter.grade?.[def.id] || 0;
    const fromUser = adjust?.[def.id] || 0;
    next[def.id] = clamp(fromFilter + fromUser, def.min, def.max, 0);
  });
  return next;
};

export const gradeActive = (grade) => {
  if (!grade) return false;
  return adjustments.some((def) => grade[def.id]);
};

export const createDefaultSettings = () => ({
  enabled: true,
  quality: 'auto',
  preset: 'original',
  filter: 'original',
  background: { mode: 'original' },
  beauty: unitsFrom(effects, {}),
  adjust: unitsFrom(adjustments, {}),
});

export const sanitizeBackground = (input) => {
  if (!input || typeof input !== 'object') return null;
  const mode = backgrounds.find((item) => item.id === input.mode);
  if (!mode) return null;
  if (mode.id === 'original') return { mode: 'original' };
  if (mode.id === 'blur') {
    return { mode: 'blur', amount: clamp(input.amount, 0, 100, mode.defaultAmount) };
  }
  if (mode.id === 'solid') {
    const color = hexOf(input.color);
    return color ? { mode: 'solid', color } : null;
  }
  if (mode.id === 'gradient') {
    const from = hexOf(input.from);
    const to = hexOf(input.to);
    return from && to ? { mode: 'gradient', from, to } : null;
  }
  const url = httpUrl(input.url);
  return url ? { mode: mode.id, url } : null;
};

export const sanitizeSettings = (raw) => {
  const base = createDefaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const preset = presets.some((item) => item.id === raw.preset) ? raw.preset : base.preset;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : base.enabled,
    quality: isQuality(raw.quality) ? raw.quality : base.quality,
    preset,
    filter: isFilterId(raw.filter) ? raw.filter : base.filter,
    background: sanitizeBackground(raw.background) || base.background,
    beauty: unitsFrom(effects, raw.beauty),
    adjust: unitsFrom(adjustments, raw.adjust),
  };
};

export const applyPresetSettings = (current, presetId) => {
  const preset = presets.find((item) => item.id === presetId);
  if (!preset) return null;
  const background = preset.background
    ? sanitizeBackground(preset.background) || current.background
    : current.background;
  return {
    ...current,
    preset: preset.id,
    filter: preset.filter,
    beauty: unitsFrom(effects, preset.beauty),
    background,
    adjust: preset.resetAdjust ? unitsFrom(adjustments, {}) : current.adjust,
  };
};

export const patchUnits = (current, partial, defs) => {
  if (!partial || typeof partial !== 'object') return null;
  const next = { ...current };
  let changed = false;
  defs.forEach((def) => {
    if (!Object.prototype.hasOwnProperty.call(partial, def.id)) return;
    const value = clamp(partial[def.id], def.min, def.max, null);
    if (value === null || value === next[def.id]) return;
    next[def.id] = value;
    changed = true;
  });
  return changed ? next : null;
};

export const readBeautySettings = () => {
  const box = storageBox();
  if (!box) return null;
  let text = null;
  try {
    text = box.getItem(BEAUTY_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!text) return null;
  if (text.length > STORAGE_LIMIT) {
    removeOwn(box);
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.v !== 1) {
      removeOwn(box);
      return null;
    }
    return sanitizeSettings(parsed);
  } catch {
    removeOwn(box);
    return null;
  }
};

export const writeBeautySettings = (settings) => {
  const box = storageBox();
  if (!box) return;
  const payload = { v: 1, ...sanitizeSettings(settings) };
  let text = '';
  try {
    text = JSON.stringify(payload);
  } catch {
    return;
  }
  if (text.length > STORAGE_LIMIT) return;
  try {
    box.setItem(BEAUTY_STORAGE_KEY, text);
  } catch {
    // joy yetmasa kamera ishlashda davom etadi
  }
};

const labelOf = (item, lang) => (lang === 'ru' ? item.label.ru : item.label.uz);

export const getBeautyEffects = () => copyList(effects);
export const getBeautyAdjustments = () => copyList(adjustments);
export const getBeautyFilters = () => copyList(filters);
export const getBeautyBackgrounds = () => copyList(backgrounds);
export const getBeautyPresets = () => copyList(presets);
export const getBeautyQualities = () => copyList(qualities);

export const getBeautyPresetStrip = (lang) => presets.map((preset) => ({
  id: preset.id,
  label: labelOf(preset, lang),
  swatch: preset.swatch,
}));
