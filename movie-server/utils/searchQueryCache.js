/**
 * Qisqa muddatli in-memory search cache.
 * Productionda Redis bilan almashtirish oson (bir xil API).
 */

const DEFAULT_TTL_MS = 45_000;
const MAX_ENTRIES = 200;

const store = new Map();

const makeKey = (parts) => parts.filter((p) => p != null && p !== '').join(':');

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest != null) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const clear = () => store.clear();

module.exports = {
  makeKey,
  get,
  set,
  clear,
  DEFAULT_TTL_MS,
};
