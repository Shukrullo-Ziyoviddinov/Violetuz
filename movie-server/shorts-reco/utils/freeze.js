'use strict';

/**
 * Freeze nested config objects so call sites cannot change tunables.
 * @param {unknown} value
 * @returns {unknown}
 */
const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.values(value).forEach((item) => {
    deepFreeze(item);
  });
  return Object.freeze(value);
};

module.exports = {
  deepFreeze,
};
