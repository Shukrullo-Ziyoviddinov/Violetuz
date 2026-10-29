'use strict';

const config = require('../../config');

/**
 * @param {Record<string, string>} fields
 * @returns {Record<string, 1>}
 */
const projectionFrom = (fields) => {
  const projection = { _id: 1 };
  const paths = Object.values(fields);
  for (let i = 0; i < paths.length; i += 1) {
    projection[paths[i]] = 1;
  }
  return projection;
};

/**
 * @param {import('mongodb').Collection} collection
 * @param {{ projection: Record<string, 1>, visitor: (docs: object[]) => Promise<void>|void }} options
 */
const forEachBatch = async (collection, options) => {
  const batchSize = config.catalogSyncBatchSize;
  let lastId = null;

  for (;;) {
    const filter = lastId == null ? {} : { _id: { $gt: lastId } };
    const docs = await collection
      .find(filter, { projection: options.projection })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();

    if (docs.length === 0) return;
    await options.visitor(docs);
    lastId = docs[docs.length - 1]._id;
    if (docs.length < batchSize) return;
  }
};

/**
 * @param {import('mongodb').Collection} collection
 * @param {Array<number|string>} ids
 * @param {{ projection: Record<string, 1>, idField: string }} options
 * @returns {Promise<object[]>}
 */
const findByIds = async (collection, ids, options) => {
  const batchSize = config.catalogLookupBatchSize;
  const unique = [];
  const seen = new Set();

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (id == null || id === '' || typeof id === 'object') continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(id);
  }

  const docs = [];
  for (let offset = 0; offset < unique.length; offset += batchSize) {
    const chunk = unique.slice(offset, offset + batchSize);
    const found = await collection
      .find({ [options.idField]: { $in: chunk } }, { projection: options.projection })
      .toArray();
    docs.push(...found);
  }

  return docs;
};

module.exports = {
  projectionFrom,
  forEachBatch,
  findByIds,
};
