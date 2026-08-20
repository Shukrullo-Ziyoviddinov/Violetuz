const Repost = require('../models/Repost.model');

const aggregateRepostCounts = async (type, itemIds) => {
  const ids = [...new Set((itemIds || []).map((id) => String(id).trim()).filter(Boolean))];
  const out = {};
  if (!ids.length) return out;

  const rows = await Repost.aggregate([
    { $match: { type, itemId: { $in: ids } } },
    { $group: { _id: '$itemId', n: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    out[String(row._id)] = row.n;
  }
  return out;
};

const loadViewerRepostedIds = async (userId, type, itemIds) => {
  const set = new Set();
  if (!userId || !itemIds?.length) return set;
  const rows = await Repost.find({
    userId,
    type,
    itemId: { $in: itemIds },
  })
    .select('itemId')
    .lean();
  for (const row of rows) set.add(String(row.itemId));
  return set;
};

const adjustForViewer = (total, viewerHas) =>
  viewerHas ? Math.max(0, (total || 0) - 1) : total || 0;

const attachDocRepostCount = async (type, doc, userId) => {
  if (!doc || doc.id == null) return doc;
  const tid = String(doc.id);
  const counts = await aggregateRepostCounts(type, [tid]);
  const viewerSet = await loadViewerRepostedIds(userId, type, [tid]);
  return {
    ...doc,
    repostCount: adjustForViewer(counts[tid] || 0, viewerSet.has(tid)),
  };
};

const attachDocsRepostCount = async (type, docs, userId) => {
  if (!Array.isArray(docs) || !docs.length) return docs;
  const ids = docs.map((d) => (d?.id != null ? String(d.id) : '')).filter(Boolean);
  const [counts, viewerSet] = await Promise.all([
    aggregateRepostCounts(type, ids),
    loadViewerRepostedIds(userId, type, ids),
  ]);
  return docs.map((doc) => {
    if (!doc || doc.id == null) return doc;
    const tid = String(doc.id);
    return {
      ...doc,
      repostCount: adjustForViewer(counts[tid] || 0, viewerSet.has(tid)),
    };
  });
};

module.exports = {
  attachDocRepostCount,
  attachDocsRepostCount,
};
