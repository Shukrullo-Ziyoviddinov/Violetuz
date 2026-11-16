const STORAGE_KEY = 'violet-chat-bubbles';
const HEX = /^#[0-9a-f]{6}$/i;

export const BUBBLE_PRESETS = [
  { id: 'purple', incoming: '#2a2140', outgoing: '#7c3aed' },
  { id: 'blue', incoming: '#2c3648', outgoing: '#3b82f6' },
  { id: 'teal', incoming: '#243e44', outgoing: '#14b8a6' },
  { id: 'green', incoming: '#243828', outgoing: '#22c55e' },
  { id: 'pink', incoming: '#3c2438', outgoing: '#ec4899' },
  { id: 'orange', incoming: '#3c2e22', outgoing: '#f97316' },
  { id: 'red', incoming: '#3c2428', outgoing: '#ef4444' },
  { id: 'yellow', incoming: '#3c341c', outgoing: '#eab308' },
  { id: 'violet', incoming: '#2e2644', outgoing: '#a855f7' },
];

export const DEFAULT_BUBBLE = {
  id: 'purple',
  mode: 'solid',
  incoming: '#2a2140',
  outgoing: '#7c3aed',
};

const mix = (hex, toward, ratio) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift) => {
    const current = (value >> shift) & 255;
    return Math.round(current + (toward - current) * ratio);
  };
  return `#${[channel(16), channel(8), channel(0)].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
};

export const bubbleFill = (hex, mode) => {
  if (!HEX.test(hex || '')) return DEFAULT_BUBBLE.outgoing;
  if (mode !== 'gradient') return hex;
  return `linear-gradient(135deg, ${mix(hex, 255, 0.42)}, ${hex})`;
};

export const bubbleVars = (choice) => ({
  '--chat-bubble-in-fill': bubbleFill(choice?.incoming || DEFAULT_BUBBLE.incoming, choice?.mode),
  '--chat-bubble-out-fill': bubbleFill(choice?.outgoing || DEFAULT_BUBBLE.outgoing, choice?.mode),
});

export const readBubbleChoice = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !HEX.test(saved.incoming || '') || !HEX.test(saved.outgoing || '')) {
      return DEFAULT_BUBBLE;
    }
    const incoming = saved.id === 'purple' && saved.incoming.toLowerCase() === '#3a3848'
      ? DEFAULT_BUBBLE.incoming
      : saved.incoming;
    return {
      id: saved.id || 'custom',
      mode: saved.mode === 'gradient' ? 'gradient' : 'solid',
      incoming,
      outgoing: saved.outgoing,
    };
  } catch {
    return DEFAULT_BUBBLE;
  }
};

export const writeBubbleChoice = (choice) => {
  const next = {
    id: choice.id || 'custom',
    mode: choice.mode === 'gradient' ? 'gradient' : 'solid',
    incoming: HEX.test(choice.incoming || '') ? choice.incoming : DEFAULT_BUBBLE.incoming,
    outgoing: HEX.test(choice.outgoing || '') ? choice.outgoing : DEFAULT_BUBBLE.outgoing,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Saqlanmasa ham joriy sahifa yangilanadi.
  }
  window.dispatchEvent(new CustomEvent('violet-chat-bubbles', { detail: next }));
  return next;
};

export const darkenHex = (hex) => (HEX.test(hex || '') ? mix(hex, 0, 0.62) : DEFAULT_BUBBLE.incoming);
