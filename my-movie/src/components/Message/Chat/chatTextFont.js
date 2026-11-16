const STORAGE_KEY = 'violet-chat-text';
const HEX = /^#[0-9a-f]{6}$/i;

export const TEXT_COLORS = [
  '#FFFFFF',
  '#22D3EE',
  '#3B82F6',
  '#22C55E',
  '#84CC16',
  '#FACC15',
  '#EAB308',
  '#F97316',
  '#FB7185',
  '#E879F9',
  '#A855F7',
  '#8B5CF6',
];

export const TEXT_LOOKS = [
  { id: 'standard', label: 'Standart' },
  { id: 'glow', label: 'Yoritilgan' },
  { id: 'outline', label: 'Konturli' },
];

export const DEFAULT_TEXT = {
  color: '#FFFFFF',
  look: 'standard',
};

export const normalizeTextHex = (value) => {
  const hex = String(value || '').trim();
  return HEX.test(hex) ? hex.toUpperCase() : '';
};

export const readTextChoice = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const color = normalizeTextHex(saved?.color);
    const look = TEXT_LOOKS.some((item) => item.id === saved?.look) ? saved.look : DEFAULT_TEXT.look;
    if (!color) return DEFAULT_TEXT;
    return { color, look };
  } catch {
    return DEFAULT_TEXT;
  }
};

export const writeTextChoice = (choice) => {
  const next = {
    color: normalizeTextHex(choice?.color) || DEFAULT_TEXT.color,
    look: TEXT_LOOKS.some((item) => item.id === choice?.look) ? choice.look : DEFAULT_TEXT.look,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Saqlanmasa ham joriy sahifa yangilanadi.
  }
  window.dispatchEvent(new CustomEvent('violet-chat-text', { detail: next }));
  return next;
};

export const textVars = (choice) => ({
  '--chat-text-color': normalizeTextHex(choice?.color) || DEFAULT_TEXT.color,
});

export const textLookClass = (look) => (
  look === 'glow' ? 'is-text-glow' : look === 'outline' ? 'is-text-outline' : ''
);

const RECENT_KEY = 'violet-chat-custom-colors';

export const DEFAULT_RECENT_COLORS = [
  '#A855F7',
  '#3B82F6',
  '#22D3EE',
  '#22C55E',
  '#84CC16',
  '#FACC15',
  '#F97316',
  '#FB7185',
];

export const readRecentColors = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || 'null');
    const colors = Array.isArray(saved) ? saved.map(normalizeTextHex).filter(Boolean) : [];
    return colors.length ? colors.slice(0, 8) : DEFAULT_RECENT_COLORS;
  } catch {
    return DEFAULT_RECENT_COLORS;
  }
};

export const rememberRecentColor = (hex) => {
  const color = normalizeTextHex(hex);
  const current = readRecentColors().filter((item) => item !== color);
  const next = color ? [color, ...current].slice(0, 8) : current;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Ro‘yxat saqlanmasa ham tanlov qo‘llanadi.
  }
  return next;
};
