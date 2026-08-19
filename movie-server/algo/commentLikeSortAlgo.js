/**
 * Instagram-uslubidagi izoh tartibi (polimorf kommentlar).
 *
 * Qoidalar:
 * 1) Asosiy kommentlar (root) — faqat o‘zaro: like ko‘p → yuqoriroq.
 * 2) Javoblar like bilan tartiblanmaydi; createdAt ketma-ket.
 * 3) Javob hech qachon asosiy kommentlar qatoriga chiqmaydi.
 *
 * Like teng bo‘lsa — yangiroq root komment yuqoriroq (createdAt).
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
 * Faqat asosiy (root) kommentlarni like bo‘yicha tartiblaydi.
 * Javoblar yozilgan vaqt ketma-ketligi bo‘yicha qoladi.
 *
 * @param {Array} list
 * @returns {Array}
 */
const sortCommentListByLikes = (list) => {
  if (!Array.isArray(list) || list.length === 0) return Array.isArray(list) ? list : [];

  const sorted = [...list].sort(compareCommentsByLikes);

  return sorted.map((node) => ({
    ...node,
    replies: sortNestedRepliesChronologically(node.replies || []),
  }));
};

module.exports = {
  getLikes,
  getCreatedAtMs,
  compareCommentsByLikes,
  sortCommentListByLikes,
};
