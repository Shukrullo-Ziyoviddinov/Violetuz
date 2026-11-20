import { emojiMatches } from './chatEmojis';

const RECENT_KEY = 'violet-chat-anim-recent';
const RECENT_MAX = 24;

export const CHAT_ANIMATIONS = [
  { id: '1f525', char: '🔥', cat: 'emotion', tint: '#ff6a2a', q: 'olov fire огонь' },
  { id: '2764', char: '❤️', cat: 'love', tint: '#ff4d6d', q: 'yurak heart сердце sevgi' },
  { id: '1f602', char: '😂', cat: 'laugh', tint: '#f5c542', q: 'kulgi laugh смех' },
  { id: '1f389', char: '🎉', cat: 'laugh', tint: '#7c5cff', q: 'bayram party праздник' },
  { id: '1f37f', char: '🍿', cat: 'cinema', tint: '#f2c14e', q: 'popkorn popcorn попкорн kino' },
  { id: '1f44f', char: '👏', cat: 'emotion', tint: '#f0b429', q: 'chapak clap аплодисменты' },
  { id: '1f60d', char: '😍', cat: 'love', tint: '#ff5a7a', q: 'sevgi love любовь yurak' },
  { id: '1f62e', char: '😮', cat: 'emotion', tint: '#f6c945', q: 'hayron wow удивление' },
  { id: '1f62d', char: '😭', cat: 'emotion', tint: '#5aa7ff', q: 'yig‘i cry слёзы' },
  { id: '1f973', char: '🥳', cat: 'laugh', tint: '#c084fc', q: 'bayram party праздник' },
  { id: '1f483', char: '💃', cat: 'cinema', tint: '#fb7185', q: 'raqs dance танец kino' },
  { id: '1f3ac', char: '🎬', cat: 'cinema', tint: '#94a3b8', q: 'kino film кино' },
  { id: '1f923', char: '🤣', cat: 'laugh', tint: '#f5c542', q: 'kulgi laugh смех' },
  { id: '1f606', char: '😆', cat: 'laugh', tint: '#f2c14e', q: 'kulgi laugh смех' },
  { id: '1f929', char: '🤩', cat: 'laugh', tint: '#f6c945', q: 'hayron wow' },
  { id: '1f60e', char: '😎', cat: 'laugh', tint: '#38bdf8', q: 'salqin cool круто' },
  { id: '1f970', char: '🥰', cat: 'love', tint: '#fb7185', q: 'sevgi love любовь' },
  { id: '1f618', char: '😘', cat: 'love', tint: '#f472b6', q: 'bo‘sa kiss поцелуй sevgi' },
  { id: '1f495', char: '💕', cat: 'love', tint: '#fb7185', q: 'yurak heart sevgi' },
  { id: '1f496', char: '💖', cat: 'love', tint: '#e879f9', q: 'yurak heart sevgi' },
  { id: '1f3a5', char: '🎥', cat: 'cinema', tint: '#64748b', q: 'kamera camera кино' },
  { id: '1f3ad', char: '🎭', cat: 'cinema', tint: '#a78bfa', q: 'teatr theatre театр kino' },
  { id: '1f3b6', char: '🎶', cat: 'cinema', tint: '#818cf8', q: 'musiqa music музыка' },
  { id: '1f57a', char: '🕺', cat: 'cinema', tint: '#22d3ee', q: 'raqs dance танец' },
  { id: '1f631', char: '😱', cat: 'emotion', tint: '#60a5fa', q: 'qo‘rquv fear страх' },
  { id: '1f621', char: '😡', cat: 'emotion', tint: '#f87171', q: 'jahl angry злость' },
  { id: '1f97a', char: '🥺', cat: 'emotion', tint: '#f9a8d4', q: 'iltimos please' },
  { id: '1f44d', char: '👍', cat: 'emotion', tint: '#f5c542', q: 'yoqdi like класс' },
];

const byId = new Map();
CHAT_ANIMATIONS.forEach((item) => {
  if (!byId.has(item.id)) byId.set(item.id, item);
});

export const FEATURED_ANIMATIONS = [
  '1f525', '2764', '1f602', '1f389', '1f37f', '1f44f', '1f60d', '1f62e', '1f62d', '1f973', '1f483', '1f3ac',
].map((id) => byId.get(id)).filter(Boolean);

export const animationMatches = (item, query) => emojiMatches(item, query);

export const readRecentAnimationIds = () => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((id) => typeof id === 'string' && byId.has(id)).slice(0, RECENT_MAX);
  } catch (_err) {
    return [];
  }
};

export const rememberAnimation = (id) => {
  const next = [id, ...readRecentAnimationIds().filter((item) => item !== id)].slice(0, RECENT_MAX);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
};
