import {
  BEAUTY_STORAGE_KEY,
  applyPresetSettings,
  createDefaultSettings,
  getBeautyEffects,
  getBeautyFilters,
  getBeautyPresetStrip,
  gradeActive,
  readBeautySettings,
  resolveGrade,
  sanitizeBackground,
  writeBeautySettings,
} from './beautyConfig';

const OTHER_KEY = 'beauty-module-test-other';

const remember = () => localStorage.getItem(BEAUTY_STORAGE_KEY);

let previous;

beforeEach(() => {
  previous = remember();
  localStorage.removeItem(BEAUTY_STORAGE_KEY);
  localStorage.setItem(OTHER_KEY, 'leave-me');
});

afterEach(() => {
  localStorage.removeItem(OTHER_KEY);
  if (previous == null) localStorage.removeItem(BEAUTY_STORAGE_KEY);
  else localStorage.setItem(BEAUTY_STORAGE_KEY, previous);
});

test('keeps settings on one key and leaves every other key alone', () => {
  expect(BEAUTY_STORAGE_KEY).toBe('violetplay_beauty_settings');
  writeBeautySettings(createDefaultSettings());
  expect(readBeautySettings().preset).toBe('original');
  localStorage.setItem(BEAUTY_STORAGE_KEY, '{');
  expect(readBeautySettings()).toBeNull();
  expect(localStorage.getItem(BEAUTY_STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(OTHER_KEY)).toBe('leave-me');
});

test('reads filters and adjustments from the config list', () => {
  const ids = getBeautyFilters().map((item) => item.id);
  expect(ids.slice(0, 3)).toEqual(['original', 'natural', 'soft']);
  expect(ids).toEqual(expect.arrayContaining(['cinematic', 'bw', 'matte']));

  const original = resolveGrade('original', {});
  expect(gradeActive(original)).toBeFalsy();
  expect(resolveGrade('natural', {}).temperature).toBe(8);
  expect(resolveGrade('soft', {}).contrast).toBe(-12);

  const adjust = { brightness: 10, saturation: 30 };
  const mixed = resolveGrade('soft', adjust);
  expect(mixed.brightness).toBe(16);
  expect(resolveGrade('bw', adjust).saturation).toBe(-70);
  expect(adjust).toEqual({ brightness: 10, saturation: 30 });
  expect(gradeActive(resolveGrade('missing', {}))).toBeFalsy();
});

test('presets do not turn shape effects on', () => {
  const shapeIds = getBeautyEffects().filter((item) => item.shape).map((item) => item.id);
  expect(shapeIds).toEqual(['slim', 'jaw', 'eye', 'nose']);
  ['original', 'natural', 'soft', 'clear', 'studio', 'portrait', 'cinematic'].forEach((id) => {
    const next = applyPresetSettings(createDefaultSettings(), id);
    shapeIds.forEach((shapeId) => {
      expect(next.beauty[shapeId]).toBe(0);
    });
  });
});

test('accepts an http background address and rejects embedded files', () => {
  expect(sanitizeBackground({ mode: 'image', url: 'https://cdn.example/a.jpg' }).url)
    .toBe('https://cdn.example/a.jpg');
  expect(sanitizeBackground({ mode: 'image', url: 'data:image/png;base64,abc' })).toBeNull();
  expect(sanitizeBackground({ mode: 'video', url: 'blob:http://localhost/abc' })).toBeNull();
  expect(sanitizeBackground({ mode: 'solid', color: '#112233' }).color).toBe('#112233');
  expect(sanitizeBackground({ mode: 'blur' }).amount).toBe(40);
  expect(getBeautyPresetStrip('uz')[0]).toMatchObject({ id: 'original', label: 'Asl' });
  expect(getBeautyPresetStrip('ru')[1]).toMatchObject({ id: 'natural', label: 'Естественный' });
});
