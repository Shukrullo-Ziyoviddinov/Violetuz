import {
  reactionKeyForPersist,
  reactionKeyForTrailer,
} from '../store/slices/likesUtils';

/** Server type + id → Redux reaction key */
export const reactionKeyFromServerItem = (item) => {
  if (!item || item.id == null || !item.type) return null;
  const id = item.id;
  switch (item.type) {
    case 'movie':
      return reactionKeyForPersist(`movie_${id}`);
    case 'klip':
    case 'konsert':
    case 'music':
      return reactionKeyForPersist(`video_${id}`);
    case 'triller':
      return reactionKeyForPersist(`triller-${id}`);
    case 'movieTriller':
      return reactionKeyForTrailer(String(id));
    default:
      return null;
  }
};

export const mapServerReactionsToStore = (items = []) => {
  const reactions = {};
  const shortsLikedIds = [];

  for (const item of items) {
    if (!item || (item.value !== 'like' && item.value !== 'dislike')) continue;
    if (item.type === 'shorts') {
      if (item.value === 'like') shortsLikedIds.push(String(item.id));
      continue;
    }
    const key = reactionKeyFromServerItem(item);
    if (key) reactions[key] = item.value;
  }

  return { reactions, shortsLikedIds };
};

/** LikeButton props dan API type */
export const resolveReactionTypeFromProps = ({
  variant,
  likeMeta,
  persistKey,
  persistTrailerKey,
}) => {
  if (variant === 'shorts') return 'shorts';
  /* .trailer-page TrailerModal — movieId-trailerId */
  if (persistTrailerKey) return 'movieTriller';
  /* .triller-main — oddiy triller (variant trailerModal bo‘lsa ham) */
  if (persistKey?.startsWith('triller')) return 'triller';

  const cat = String(likeMeta?.category || '')
    .trim()
    .toLowerCase();
  if (cat === 'movie') return 'movie';
  if (cat === 'music') return 'music';
  if (cat === 'clip' || cat === 'klip') return 'klip';
  if (cat === 'concert' || cat === 'konsert') return 'konsert';
  if (cat === 'movietriller' || cat === 'movie-triller') return 'movieTriller';
  if (cat === 'triller' || cat === 'trailer') return 'triller';

  if (variant === 'trailerModal' || variant === 'trailerSimilar') {
    return 'movieTriller';
  }

  if (persistKey?.startsWith('movie_')) return 'movie';
  if (persistKey?.startsWith('video_')) {
    if (cat === 'konsert' || cat === 'concert') return 'konsert';
    return 'klip';
  }
  return null;
};
