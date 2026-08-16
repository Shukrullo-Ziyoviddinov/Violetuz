/**
 * Profil "Sharhlar" tarixi — server `/comments/history` dan.
 * Snapshot + katalog ma’lumotlari bilan UI entry yasaydi.
 */
import { fetchMyCommentHistory } from '../../api/commentsApi';
import { formatMovieRating } from '../Rating/CalculateRating';

function pickLocalized(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.uz || value.ru || '';
}

function getMovieGenresList(genre, lang) {
  if (!genre) return [];
  if (typeof genre === 'object') {
    return Array.isArray(genre[lang])
      ? genre[lang]
      : genre[lang]
        ? [genre[lang]]
        : genre.uz || genre.ru || [];
  }
  return Array.isArray(genre) ? genre : [genre];
}

function parseLikeCount(v) {
  if (v === '' || v == null) return 0;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}

function getMovieDescriptionText(description, lang) {
  if (!description) return '';
  if (typeof description === 'object') {
    const block = description[lang] || description.uz || description.ru;
    if (block && typeof block === 'object' && block.text) return String(block.text || '').trim();
    if (typeof block === 'string') return block.trim();
  }
  if (typeof description === 'string') return description.trim();
  return '';
}

function getShortsVideoSrc(snap, lang) {
  const v = snap?.video;
  if (typeof v === 'string' && v.trim()) return v;
  if (v && typeof v === 'object') {
    const src = v[lang] || v.uz || v.ru || '';
    if (src) return src;
  }
  return '';
}

function getShortsDescription(snap, lang) {
  if (!snap?.description) return '';
  if (typeof snap.description === 'object') {
    return String(
      snap.description[lang] || snap.description.uz || snap.description.ru || ''
    ).trim();
  }
  return String(snap.description).trim();
}

function mapHistoryItemToEntry(item, lang) {
  const snap = item.targetSnapshot || {};
  const comment = {
    id: item.id,
    text: item.text,
    authorName: item.authorName,
    authorAvatar: item.authorAvatar,
    createdAt: item.createdAt,
    likes: item.likes || 0,
    parentId: item.parentId,
    replies: [],
  };

  if (item.targetType === 'movie' || snap.kind === 'movie') {
    const movieId = snap.movieId ?? item.targetId;
    return {
      key: `movie-${movieId}-${item.id}`,
      filter: 'movie',
      createdAt: item.createdAt || '',
      comment,
      target: {
        kind: 'movie',
        movieId,
        title: pickLocalized(snap.title, lang),
        image:
          pickLocalized(snap.homeImg, lang) ||
          snap.image ||
          '/img/movie1.jpg',
        route: snap.route || `/movie/${movieId}`,
        genres: getMovieGenresList(snap.genre, lang),
        movieCategory: snap.category,
        rating: snap.rating,
        ratingImdb: snap.ratingImdb,
        ratingKinopoisk: snap.ratingKinopoisk,
        ratingNetflix: snap.ratingNetflix,
        ratingDisplay: formatMovieRating(snap.rating),
        likeCount: parseLikeCount(snap.like),
        dislikeCount: parseLikeCount(snap.dislike),
        descriptionPreview: getMovieDescriptionText(snap.description, lang),
      },
    };
  }

  if (
    item.targetType === 'klip' ||
    item.targetType === 'konsert' ||
    snap.kind === 'video'
  ) {
    const videoId = snap.videoId ?? item.targetId;
    const videoType =
      snap.videoType ||
      (item.targetType === 'konsert' ? 'konsert' : 'klip');
    return {
      key: `mv-${videoId}-${item.id}`,
      filter: videoType === 'konsert' ? 'konsert' : 'klip',
      createdAt: item.createdAt || '',
      comment,
      target: {
        kind: 'video',
        videoType,
        title: snap.title || '',
        image: snap.image || '/img/movie1.jpg',
        route: snap.route || `/music/video/${videoId}`,
        videoId,
        artistName: '',
        likeCount: parseLikeCount(snap.like),
        dislikeCount: parseLikeCount(snap.dislike),
      },
    };
  }

  if (item.targetType === 'triller' || snap.kind === 'triller') {
    const trillerId = snap.trillerId ?? item.targetId;
    return {
      key: `triller-${trillerId}-${item.id}`,
      filter: 'triller',
      createdAt: item.createdAt || '',
      comment,
      target: {
        kind: 'triller',
        trillerId,
        title: pickLocalized(snap.title, lang),
        image: pickLocalized(snap.image, lang) || '/img/movie1.jpg',
        route: snap.route || `/triller/${trillerId}`,
      },
    };
  }

  const shortsId = snap.shortsId ?? item.targetId;
  const shortsSource =
    snap.shortsSource ||
    (item.targetType === 'musicShorts' ? 'musicshorts' : 'movieShorts');
  return {
    key: `shorts-${shortsSource}-${shortsId}-${item.id}`,
    filter: 'shorts',
    createdAt: item.createdAt || '',
    comment,
    target: {
      kind: 'shorts',
      shortsType: snap.shortsType || shortsSource,
      shortsSource,
      shortsId,
      movieId: snap.movieId ?? null,
      musicId: snap.musicId ?? null,
      contentType: snap.contentType || null,
      title: pickLocalized(snap.title, lang),
      videoSrc: getShortsVideoSrc(snap, lang),
      descriptionPreview: getShortsDescription(snap, lang),
    },
  };
}

/** @deprecated sync o‘rniga fetchCommentHistoryEntries ishlating */
export function buildCommentHistoryEntries() {
  return [];
}

export async function fetchCommentHistoryEntries(lang = 'uz') {
  const history = await fetchMyCommentHistory();
  const entries = history.map((item) => mapHistoryItemToEntry(item, lang));
  entries.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });
  return entries;
}

export function flattenCommentTree(list) {
  const out = [];
  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      out.push(n);
      if (n.replies?.length) walk(n.replies);
    }
  };
  walk(list);
  return out;
}

export function getShortsRouteFromHistory(target) {
  if (!target || target.kind !== 'shorts') return '/shorts';
  const id = target.shortsId;
  if (id == null) return '/shorts';
  if (target.shortsSource === 'musicshorts') {
    return `/shorts?source=musicshorts&id=${id}`;
  }
  return `/shorts?id=${id}`;
}

export function buildShortsHistoryPlaylist() {
  return [];
}
