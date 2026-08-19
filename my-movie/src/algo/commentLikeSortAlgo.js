/**
 * Instagram-uslubidagi izoh tartibi (frontend — server algo bilan bir xil).
 *
 * 1) Asosiy (root) kommentlar o‘zaro like bo‘yicha.
 * 2) Javoblar (to‘g‘ridan ham, javobga javob ham) like bilan tartiblanmaydi.
 *    Ular yozilgan vaqt ketma-ketligi (createdAt) bo‘yicha qoladi.
 * 3) Javob root qatoriga chiqmaydi.
 */

const HANDLE_RE = /@([A-Za-z0-9._]+)/;

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

/** Faqat asosiy kommentlar. Yuklangan javoblar tartibi saqlanadi. */
export const sortCommentListByLikes = (list) => {
  if (!Array.isArray(list) || list.length === 0) return Array.isArray(list) ? list : [];

  return [...list].sort(compareCommentsByLikes).map((node) => ({
    ...node,
    replies: Array.isArray(node.replies) ? node.replies : [],
  }));
};

export const getCommentUsername = (comment) => {
  const stored = String(comment?.authorUsername || '')
    .trim()
    .replace(/^@/, '');
  if (stored) return stored;
  const match = String(comment?.authorName || '').match(HANDLE_RE);
  return match ? match[1] : '';
};

export const getCommentDisplayName = (comment) => {
  const raw = String(comment?.authorName || '').trim();
  const withoutHandle = raw.replace(HANDLE_RE, '').replace(/\s+/g, ' ').trim();
  return withoutHandle || raw;
};

export const formatReplyMention = (replyTo) => {
  if (!replyTo) return '';
  const username = String(replyTo.authorUsername || '')
    .replace(/^@/, '')
    .trim();
  const name = String(replyTo.authorName || '').trim();
  if (username && name && name.toLowerCase() !== username.toLowerCase()) {
    return `@${username} ${name}`;
  }
  if (username) return `@${username}`;
  if (name) return name.startsWith('@') ? name : `@${name}`;
  return '';
};

/**
 * Root ostidagi barcha javoblarni bitta darajaga yoyadi.
 * To‘g‘ridan javoblar yozilgan tartibda; ularning bolalari otadan keyin keladi.
 */
export const flattenThreadReplies = (root) => {
  if (!root || !Array.isArray(root.replies) || root.replies.length === 0) return [];
  const out = [];

  const pushNested = (parent) => {
    const children = Array.isArray(parent.replies) ? parent.replies : [];
    for (const child of children) {
      out.push({
        ...child,
        replies: [],
        replyTo: {
          id: parent.id,
          authorName: getCommentDisplayName(parent),
          authorUsername: getCommentUsername(parent),
        },
      });
      pushNested(child);
    }
  };

  for (const direct of root.replies) {
    out.push({
      ...direct,
      replies: [],
      replyTo: null,
    });
    pushNested(direct);
  }

  return out;
};
