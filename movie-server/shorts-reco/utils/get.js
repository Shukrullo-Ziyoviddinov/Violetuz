'use strict';

/**
 * Read a dotted path. Missing objects yield undefined. Never throws.
 * @param {unknown} source
 * @param {string} path
 * @returns {unknown}
 */
const readPath = (source, path) => {
  if (source == null || typeof path !== 'string' || path.length === 0) {
    return undefined;
  }

  let current = source;
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i += 1) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[parts[i]];
  }
  return current;
};

module.exports = {
  readPath,
};
