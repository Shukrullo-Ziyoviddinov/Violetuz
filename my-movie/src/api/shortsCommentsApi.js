/**
 * Shorts comments — server API wrapper (localStorage yo‘q).
 * targetType: shorts | musicShorts
 */

import * as commentsApi from './commentsApi';

export const toShortsKey = (shortsId) => String(shortsId);

const SHORTS_COMMENTS_CHANGED_EVENT = 'violet-shorts-comments-changed';

export const dispatchShortsCommentsChanged = (shortsId, extra = {}) => {
  try {
    window.dispatchEvent(
      new CustomEvent(SHORTS_COMMENTS_CHANGED_EVENT, {
        detail: { shortsId: toShortsKey(shortsId), ...extra },
      })
    );
  } catch {
    /* ignore */
  }
};

const resolveShortsType = (targetTypeHint) =>
  targetTypeHint === 'musicShorts' || targetTypeHint === 'musicshorts'
    ? 'musicShorts'
    : 'shorts';

export const getComments = async (shortsId, targetTypeHint) => {
  const targetType = resolveShortsType(targetTypeHint);
  return commentsApi.fetchComments({
    targetType,
    targetId: toShortsKey(shortsId),
  });
};

export const fetchShortsCommentReplies = (commentId, page) =>
  commentsApi.fetchCommentReplies(commentId, page);

export const getLikedIds = async (shortsId, targetTypeHint) => {
  const targetType = resolveShortsType(targetTypeHint);
  try {
    return await commentsApi.fetchCommentLikedIds({
      targetType,
      targetId: toShortsKey(shortsId),
    });
  } catch (err) {
    if (err?.status === 401) return new Set();
    throw err;
  }
};

export const createShortsCommentRequest = async ({
  shortsId,
  text,
  parentId = null,
  targetTypeHint,
}) => {
  const targetType = resolveShortsType(targetTypeHint);
  return commentsApi.createCommentRequest({
    targetType,
    targetId: toShortsKey(shortsId),
    text,
    parentId,
  });
};

export const toggleShortsCommentLikeRequest = (commentId) =>
  commentsApi.toggleCommentLikeRequest(commentId);

export const updateCommentTextById = async (shortsId, commentId, newText, targetTypeHint) => {
  await commentsApi.updateCommentTextById(
    shortsId,
    commentId,
    newText,
    resolveShortsType(targetTypeHint)
  );
  dispatchShortsCommentsChanged(shortsId);
};

export const deleteCommentById = async (shortsId, commentId, targetTypeHint) => {
  await commentsApi.deleteCommentById(
    shortsId,
    commentId,
    resolveShortsType(targetTypeHint)
  );
  dispatchShortsCommentsChanged(shortsId);
};

export { SHORTS_COMMENTS_CHANGED_EVENT };
