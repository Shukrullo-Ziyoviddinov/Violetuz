const UserReaction = require('../models/UserReaction.model');

/**
 * user_reactions dan like/dislike soni.
 * LikeButton: initialCount + (viewer like ? 1 : 0) — shu uchun viewer ovozi ayiriladi.
 */
const aggregateCounts = async (type, targetIds) => {
  const ids = [...new Set((targetIds || []).map((id) => String(id).trim()).filter(Boolean))];
  const out = {};
  if (!ids.length) return out;

  const rows = await UserReaction.aggregate([
    { $match: { type, targetId: { $in: ids } } },
    { $group: { _id: { targetId: '$targetId', value: '$value' }, n: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    const tid = String(row._id.targetId);
    if (!out[tid]) out[tid] = { like: 0, dislike: 0 };
    if (row._id.value === 'like') out[tid].like = row.n;
    if (row._id.value === 'dislike') out[tid].dislike = row.n;
  }
  return out;
};

const loadViewerValues = async (userId, pairs) => {
  const map = new Map();
  if (!userId || !pairs?.length) return map;

  const rows = await UserReaction.find({
    userId,
    $or: pairs.map((p) => ({ type: p.type, targetId: String(p.targetId) })),
  })
    .select('type targetId value')
    .lean();

  for (const row of rows) {
    map.set(`${row.type}:${row.targetId}`, row.value);
  }
  return map;
};

const adjustForViewer = (counts, viewerValue) => {
  let like = counts.like || 0;
  let dislike = counts.dislike || 0;
  if (viewerValue === 'like') like = Math.max(0, like - 1);
  if (viewerValue === 'dislike') dislike = Math.max(0, dislike - 1);
  return { like, dislike };
};

const reactionTypeForFeedItem = (item) => {
  if (item.type === 'movieShorts' || item.type === 'musicshorts') return 'shorts';
  return item.type;
};

const targetIdForFeedItem = (item) => {
  if (item.type === 'movie') return String(item.movieId ?? item.catalogId);
  if (item.type === 'music') return String(item.trackId ?? item.catalogId);
  if (item.type === 'klip' || item.type === 'konsert') return String(item.videoId ?? item.catalogId);
  if (item.type === 'movieShorts' || item.type === 'musicshorts') {
    return String(item.shortsId ?? item.catalogId);
  }
  return String(item.catalogId);
};

const attachFeedLikeCounts = async (items, userId) => {
  if (!Array.isArray(items) || !items.length) return items;

  const byType = {};
  for (const item of items) {
    const type = reactionTypeForFeedItem(item);
    const tid = targetIdForFeedItem(item);
    if (!type || !tid) continue;
    if (!byType[type]) byType[type] = [];
    byType[type].push(tid);
  }

  const countsByType = {};
  await Promise.all(
    Object.entries(byType).map(async ([type, ids]) => {
      countsByType[type] = await aggregateCounts(type, ids);
    })
  );

  const pairs = items.map((item) => ({
    type: reactionTypeForFeedItem(item),
    targetId: targetIdForFeedItem(item),
  }));
  const viewerMap = await loadViewerValues(userId, pairs);

  return items.map((item) => {
    const type = reactionTypeForFeedItem(item);
    const tid = targetIdForFeedItem(item);
    const raw = countsByType[type]?.[tid] || { like: 0, dislike: 0 };
    const viewer = viewerMap.get(`${type}:${tid}`);
    const next = adjustForViewer(raw, viewer);
    return { ...item, like: next.like, dislike: next.dislike };
  });
};

const attachDocLikeCounts = async (type, doc, userId) => {
  if (!doc || doc.id == null) return doc;
  const tid = String(doc.id);
  const counts = await aggregateCounts(type, [tid]);
  const raw = counts[tid] || { like: 0, dislike: 0 };
  let viewer = null;
  if (userId) {
    const row = await UserReaction.findOne({ userId, type, targetId: tid })
      .select('value')
      .lean();
    viewer = row?.value || null;
  }
  const next = adjustForViewer(raw, viewer);
  return { ...doc, like: next.like, dislike: next.dislike };
};

module.exports = {
  aggregateCounts,
  attachFeedLikeCounts,
  attachDocLikeCounts,
};
