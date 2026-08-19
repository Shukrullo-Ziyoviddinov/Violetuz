/**
 * Comments API — faqat server (localStorage yo‘q).
 * Base: /api/comments
 */

import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const commentFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Comment request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** UI kalitidan { targetType, targetId } */
export const resolveCommentTarget = (entityKey, targetTypeHint) => {
  const raw = String(entityKey ?? '').trim();
  if (!raw) return { targetType: targetTypeHint || 'movie', targetId: '' };

  if (raw.startsWith('triller:')) {
    return { targetType: 'triller', targetId: raw.slice('triller:'.length) };
  }
  if (raw.startsWith('music:')) {
    const type =
      targetTypeHint === 'konsert' || targetTypeHint === 'klip'
        ? targetTypeHint
        : 'klip';
    return { targetType: type, targetId: raw.slice('music:'.length) };
  }
  if (targetTypeHint) {
    return { targetType: targetTypeHint, targetId: raw };
  }
  return { targetType: 'movie', targetId: raw };
};

/** Eski API mosligi */
export const toMovieKey = (movieId) => String(movieId);

const COMMENTS_CHANGED_EVENT = 'violet-movie-comments-changed';

export const dispatchMovieCommentsChanged = (movieId, extra = {}) => {
  try {
    window.dispatchEvent(
      new CustomEvent(COMMENTS_CHANGED_EVENT, {
        detail: { movieId: toMovieKey(movieId), ...extra },
      })
    );
  } catch {
    /* ignore */
  }
};

export const COMMENT_REPLIES_PAGE_SIZE = 5;

export const fetchCommentReplies = async (
  commentId,
  { skip = 0, limit = COMMENT_REPLIES_PAGE_SIZE } = {}
) => {
  const q = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  const res = await commentFetch(
    `/comments/${encodeURIComponent(commentId)}/replies?${q}`
  );
  const data = await parseJson(res);
  return {
    replies: Array.isArray(data?.replies) ? data.replies : [],
    replyCount: Number(data?.replyCount) || 0,
    hasMore: Boolean(data?.hasMore),
  };
};

export const fetchComments = async ({ targetType, targetId }) => {
  const q = new URLSearchParams({
    targetType: String(targetType),
    targetId: String(targetId),
  });
  const res = await commentFetch(`/comments?${q}`);
  const data = await parseJson(res);
  return Array.isArray(data?.comments) ? data.comments : [];
};

/** entityKey + optional type hint (MovieComments uchun) */
export const getComments = async (entityKey, targetTypeHint) => {
  const target = resolveCommentTarget(entityKey, targetTypeHint);
  if (!target.targetId) return [];
  return fetchComments(target);
};

export const createCommentRequest = async ({
  targetType,
  targetId,
  text,
  parentId = null,
}) => {
  const res = await commentFetch('/comments', {
    method: 'POST',
    body: JSON.stringify({ targetType, targetId, text, parentId }),
  });
  return parseJson(res);
};

export const updateCommentTextById = async (entityKey, commentId, newText, targetTypeHint) => {
  const text = String(newText ?? '').trim();
  if (!text || commentId == null) return;
  const res = await commentFetch(`/comments/${encodeURIComponent(commentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ text }),
  });
  await parseJson(res);
  dispatchMovieCommentsChanged(entityKey, {
    ...resolveCommentTarget(entityKey, targetTypeHint),
  });
};

export const deleteCommentById = async (entityKey, commentId, targetTypeHint) => {
  if (commentId == null) return;
  const res = await commentFetch(`/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
  await parseJson(res);
  dispatchMovieCommentsChanged(entityKey, {
    ...resolveCommentTarget(entityKey, targetTypeHint),
  });
};

export const toggleCommentLikeRequest = async (commentId) => {
  const res = await commentFetch(`/comments/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
  });
  return parseJson(res);
};

export const fetchCommentLikedIds = async ({ targetType, targetId }) => {
  const q = new URLSearchParams({
    targetType: String(targetType),
    targetId: String(targetId),
  });
  const res = await commentFetch(`/comments/liked?${q}`);
  const data = await parseJson(res);
  return new Set(Array.isArray(data?.likedIds) ? data.likedIds.map(String) : []);
};

export const getLikedIds = async (entityKey, targetTypeHint) => {
  const target = resolveCommentTarget(entityKey, targetTypeHint);
  if (!target.targetId) return new Set();
  try {
    return await fetchCommentLikedIds(target);
  } catch (err) {
    if (err?.status === 401) return new Set();
    throw err;
  }
};

export const fetchMyCommentHistory = async () => {
  const res = await commentFetch('/comments/history');
  const data = await parseJson(res);
  return Array.isArray(data?.history) ? data.history : [];
};

export { COMMENTS_CHANGED_EVENT };
