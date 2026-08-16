/**
 * Komment like tartibi (polimorf kommentlar).
 *
 * Qoidalar:
 * 1) Asosiy kommentlar (root) — faqat o‘zaro: like ko‘p → yuqoriroq.
 * 2) Javoblar — faqat ota-komment ichida: like ko‘p → yuqoriroq.
 * 3) Javob hech qachon asosiy kommentlar qatoriga chiqmaydi.
 * 4) Turli otalarning javoblari bir-biri bilan bahslashmaydi.
 *
 * Like teng bo‘lsa — yangiroq komment yuqoriroq (createdAt).
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

/**
 * Bitta darajadagi ro‘yxatni like bo‘yicha tartiblaydi,
 * har bir node.replies ni alohida (rekursiv) tartiblaydi.
 *
 * @param {Array} list
 * @returns {Array}
 */
const sortCommentListByLikes = (list) => {
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

module.exports = {
  getLikes,
  getCreatedAtMs,
  compareCommentsByLikes,
  sortCommentListByLikes,
};
