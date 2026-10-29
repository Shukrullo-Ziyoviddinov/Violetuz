'use strict';

/**
 * @param {unknown} left
 * @param {unknown} right
 */
const same = (left, right) => {
  if (left === right) return true;
  if (left == null || right == null || typeof left === 'object' || typeof right === 'object') {
    return false;
  }
  return String(left) === String(right);
};

/**
 * @param {unknown} actual
 * @param {object} expected
 */
const matchesOperator = (actual, expected) => {
  if (expected.$ne !== undefined && same(actual, expected.$ne)) return false;
  if (Array.isArray(expected.$in)) {
    const hits = expected.$in.some((value) => {
      if (Array.isArray(actual)) return actual.some((item) => same(item, value));
      return same(actual, value);
    });
    if (!hits) return false;
  }
  if (Array.isArray(expected.$nin)) {
    const hits = expected.$nin.some((value) => {
      if (Array.isArray(actual)) return actual.some((item) => same(item, value));
      return same(actual, value);
    });
    if (hits) return false;
  }
  return true;
};

/**
 * @param {object} doc
 * @param {object} filter
 */
const matches = (doc, filter) => {
  const keys = Object.keys(filter || {});
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const expected = filter[key];
    if (key === '$or') {
      if (!expected.some((branch) => matches(doc, branch))) return false;
      continue;
    }
    const actual = doc[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if (!matchesOperator(actual, expected)) return false;
      continue;
    }
    if (Array.isArray(actual)) {
      const list = Array.isArray(expected) ? expected : [expected];
      if (!list.some((value) => actual.some((item) => same(item, value)))) return false;
    } else if (!same(actual, expected)) return false;
  }
  return true;
};

/**
 * @param {object[]} docs
 * @param {object} [sort]
 */
const sortDocs = (docs, sort) => {
  if (!sort) return docs.slice();
  const fields = Object.entries(sort);
  return docs.slice().sort((left, right) => {
    for (let i = 0; i < fields.length; i += 1) {
      const [field, direction] = fields[i];
      const sign = direction < 0 ? -1 : 1;
      const a = left[field];
      const b = right[field];
      if (a == null && b == null) continue;
      if (a == null) return 1;
      if (b == null) return -1;
      if (a > b) return sign;
      if (a < b) return -sign;
    }
    return 0;
  });
};

/**
 * @param {object[]} docs
 * @param {object} filter
 * @param {number} [limit]
 * @param {object} [sort]
 */
const queryDocs = (docs, filter, limit, sort) => {
  const matched = sortDocs(docs || [], sort).filter((doc) => matches(doc, filter));
  const size = limit == null ? matched.length : limit;
  return matched.slice(0, size);
};

/**
 * @param {unknown[]|undefined} left
 * @param {unknown[]|undefined} right
 */
const overlaps = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) {
    return false;
  }
  return left.some((value) => right.some((other) => same(value, other)));
};

module.exports = {
  matches,
  queryDocs,
  overlaps,
};
