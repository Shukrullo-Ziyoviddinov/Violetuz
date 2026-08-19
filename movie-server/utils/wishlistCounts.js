const Wishlist = require('../models/Wishlist.model');

const aggregateSaveCounts = async (type, itemIds) => {
  const ids = [...new Set((itemIds || []).map((id) => String(id).trim()).filter(Boolean))];
  const out = {};
  if (!ids.length) return out;

  const rows = await Wishlist.aggregate([
    { $match: { type, itemId: { $in: ids } } },
    { $group: { _id: '$itemId', n: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    out[String(row._id)] = row.n;
  }
  return out;
};

const loadViewerSavedIds = async (userId, type, itemIds) => {
  const set = new Set();
  if (!userId || !itemIds?.length) return set;
  const rows = await Wishlist.find({
    userId,
    type,
    itemId: { $in: itemIds },
  })
    .select('itemId')
    .lean();
  for (const row of rows) set.add(String(row.itemId));
  return set;
};

const adjustForViewer = (total, viewerSaved) =>
  viewerSaved ? Math.max(0, (total || 0) - 1) : total || 0;

const attachDocSaveCount = async (type, doc, userId) => {
  if (!doc || doc.id == null) return doc;
  const tid = String(doc.id);
  const counts = await aggregateSaveCounts(type, [tid]);
  const viewerSet = await loadViewerSavedIds(userId, type, [tid]);
  return {
    ...doc,
    saveCount: adjustForViewer(counts[tid] || 0, viewerSet.has(tid)),
  };
};

const attachDocsSaveCount = async (type, docs, userId) => {
  if (!Array.isArray(docs) || !docs.length) return docs;
  const ids = docs.map((d) => (d?.id != null ? String(d.id) : '')).filter(Boolean);
  const [counts, viewerSet] = await Promise.all([
    aggregateSaveCounts(type, ids),
    loadViewerSavedIds(userId, type, ids),
  ]);
  return docs.map((doc) => {
    if (!doc || doc.id == null) return doc;
    const tid = String(doc.id);
    return {
      ...doc,
      saveCount: adjustForViewer(counts[tid] || 0, viewerSet.has(tid)),
    };
  });
};

module.exports = {
  aggregateSaveCounts,
  attachDocSaveCount,
  attachDocsSaveCount,
};
