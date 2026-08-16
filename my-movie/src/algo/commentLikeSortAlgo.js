/**
 * Komment like tartibi (frontend — server algo bilan bir xil).
 *
 * Asosiy kommentlar o‘zaro; javoblar faqat ota ichida.
 * Javob root qatoriga chiqmaydi.
 */

const getLikes = (comment) => {
  const n = Number(comment?.likes);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const getCreatedAtMs = (comment) => {
  const t = new Date(comment?.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const compareCommentsByLikes = (a, b) => {
  const likesDiff = getLikes(b) - getLikes(a);
  if (likesDiff !== 0) return likesDiff;
  return getCreatedAtMs(b) - getCreatedAtMs(a);
};

/** @param {Array} list */
export const sortCommentListByLikes = (list) => {
  if (!Array.isArray(list) || list.length === 0) return Array.isArray(list) ? list : [];

  const sorted = [...list].sort(compareCommentsByLikes);

  return sorted.map((node) => {
    const replies = Array.isArray(node?.replies) ? node.replies : [];
    return {
      ...node,
      replies: sortCommentListByLikes(replies),
    };
  });
};
