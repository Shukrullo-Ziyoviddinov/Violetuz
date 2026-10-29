'use strict';

/**
 * @param {number} ttlMs
 * @param {() => number} [now]
 */
const createTtlCache = (ttlMs, now = Date.now) => {
  const entries = new Map();

  return {
    /**
     * @param {string} key
     */
    get(key) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now()) {
        entries.delete(key);
        return undefined;
      }
      return hit.value;
    },

    /**
     * @param {string} key
     * @param {unknown} value
     */
    set(key, value) {
      entries.set(key, { value, expires: now() + ttlMs });
    },
  };
};

module.exports = {
  createTtlCache,
};
