const ShortShareEvent = require('../models/ShortShareEvent.model');

const aggregateShareCounts = async (type, itemIds) => {
  const ids = [...new Set((itemIds || []).map((id) => String(id).trim()).filter(Boolean))];
  const out = {};
  if (!ids.length) return out;

  const rows = await ShortShareEvent.aggregate([
    { $match: { type, itemId: { $in: ids } } },
    { $group: { _id: '$itemId', n: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    out[String(row._id)] = row.n;
  }
  return out;
};

const attachDocShareCount = async (type, doc) => {
  if (!doc || doc.id == null) return doc;
  const tid = String(doc.id);
  const counts = await aggregateShareCounts(type, [tid]);
  return {
    ...doc,
    shareCount: counts[tid] || 0,
  };
};

const attachDocsShareCount = async (type, docs) => {
  if (!Array.isArray(docs) || !docs.length) return docs;
  const ids = docs.map((d) => (d?.id != null ? String(d.id) : '')).filter(Boolean);
  const counts = await aggregateShareCounts(type, ids);
  return docs.map((doc) => {
    if (!doc || doc.id == null) return doc;
    const tid = String(doc.id);
    return {
      ...doc,
      shareCount: counts[tid] || 0,
    };
  });
};

module.exports = {
  aggregateShareCounts,
  attachDocShareCount,
  attachDocsShareCount,
};
