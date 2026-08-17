/**
 * Instagram-uslubidagi izoh tartibi (polimorf kommentlar).
 *
 * Qoidalar:
 * 1) Asosiy kommentlar (root) — faqat o‘zaro: like ko‘p → yuqoriroq.
 * 2) Rootga to‘g‘ridan javoblar — faqat shu ota ichida like bo‘yicha.
 * 3) Javobga javob like bilan otadan yuqoriga chiqmaydi; ota ostida createdAt ketma-ket.
 * 4) Javob hech qachon asosiy kommentlar qatoriga chiqmaydi.
 *
 * Like teng bo‘lsa — yangiroq komment yuqoriroq (createdAt) — faqat like-sort qatlamida.
 */

const getLikes = (comment) => {
  const n = Number(comment?.likes);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const getCreatedAtMs = (comment) => {
  const t = new Date(comment?.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

/** Ikki kommentni like (keyin vaqt) bo‘yicha solishtirish */
const compareCommentsByLikes = (a, b) => {
  const likesDiff = getLikes(b) - getLikes(a);
  if (likesDiff !== 0) return likesDiff;
  return getCreatedAtMs(b) - getCreatedAtMs(a);
};

const compareCommentsByCreatedAtAsc = (a, b) => getCreatedAtMs(a) - getCreatedAtMs(b);

const sortNestedRepliesChronologically = (list) => {
  if (!Array.isArray(list) || list.length === 0) return Array.isArray(list) ? list : [];
  return [...list].sort(compareCommentsByCreatedAtAsc).map((node) => ({
    ...node,
    replies: sortNestedRepliesChronologically(node.replies || []),
  }));
};

/**
 * Root va to‘g‘ridan javoblarni like bo‘yicha tartiblaydi.
 * Nested javoblar ota ostida qoladi (like bilan yuqoriga chiqmaydi).
 *
 * @param {Array} list
 * @returns {Array}
 */
const sortCommentListByLikes = (list) => {
  if (!Array.isArray(list) || list.length === 0) return Array.isArray(list) ? list : [];

  const sorted = [...list].sort(compareCommentsByLikes);

  return sorted.map((node) => {
    const direct = Array.isArray(node?.replies) ? [...node.replies] : [];
    const sortedDirect = direct.sort(compareCommentsByLikes);
    return {
      ...node,
      replies: sortedDirect.map((reply) => ({
        ...reply,
        replies: sortNestedRepliesChronologically(reply.replies || []),
      })),
    };
  });
};

module.exports = {
  getLikes,
  getCreatedAtMs,
  compareCommentsByLikes,
  sortCommentListByLikes,
};
