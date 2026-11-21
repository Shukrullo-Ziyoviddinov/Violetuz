import { emojiMatches } from './chatEmojis';

const RECENT_KEY = 'violet-chat-gif-recent';
const RECENT_MAX = 24;

export const CHAT_GIFS = [
  { file: "firefly-2-rfrrfr.mp4", name: "Hayron", cat: "shock", tint: "#38bdf8", q: "Hayron hayron hayrat lol firefly gif" },
  { file: "gif 8.mp4", name: "Reaksiya", cat: "shock", tint: "#38bdf8", q: "Reaksiya reaksiya hayron gif 8 gif" },
  { file: "gif10.mp4", name: "Reaksiya", cat: "shock", tint: "#38bdf8", q: "Reaksiya reaksiya hayron gif10 gif" },
  { file: "gif17.mp4", name: "Reaksiya", cat: "shock", tint: "#38bdf8", q: "Reaksiya reaksiya hayron gif17 gif" },
  { file: "gif19.mp4", name: "Reaksiya", cat: "shock", tint: "#38bdf8", q: "Reaksiya reaksiya hayron gif19 gif" },
  { file: "gif9.mp4", name: "Reaksiya", cat: "shock", tint: "#38bdf8", q: "Reaksiya reaksiya hayron gif9 gif" },
];

const byFile = new Map(CHAT_GIFS.map((item) => [item.file, item]));

export const gifByFile = (file) => byFile.get(String(file || '')) || null;

export const gifMatches = (item, query) => emojiMatches({ char: '', q: `${item.name} ${item.q}` }, query);

export const readRecentGifIds = () => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((file) => typeof file === 'string' && byFile.has(file)).slice(0, RECENT_MAX);
  } catch (_err) {
    return [];
  }
};

export const rememberGif = (file) => {
  const next = [file, ...readRecentGifIds().filter((item) => item !== file)].slice(0, RECENT_MAX);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
};
