/**
 * Profil "Sharhlar" tarixi: commentsApi (kino + klip/konsert) va shortsCommentsApi (shorts) dan yig‘iladi.
 * VideoPage bilan bir xil klip manbalari — kalitlar mos kelishi uchun.
 */
import * as commentsApi from '../../api/commentsApi';
import * as shortsCommentsApi from '../../api/shortsCommentsApi';
import { allMovies } from '../../data/movies';
import { shortsVideos } from '../../data/shortsVideos';
import { musicShorts } from '../../dataMusic/musicShorts';
import { trendClipsData } from '../../dataMusic/trendClipsData';
import { jaxonConcertsData } from '../../dataMusic/jaxonConcertsData';
import { visualBeatsData } from '../../dataMusic/visualBeatsData';
import { loveAndDesireData } from '../../dataMusic/loveAndDesireData';
import { trendVideosData } from '../../dataMusic/trendVideosData';
import { stageCreationData } from '../../dataMusic/stageCreationData';
import { liveStagesData } from '../../dataMusic/liveStagesData';
import { starsStageData } from '../../dataMusic/starsStageData';
import { artists } from '../../dataMusic/artists';
import { formatMovieRating } from '../Rating/CalculateRating';

const CLIP_SOURCES = [
  trendClipsData,
  jaxonConcertsData,
  liveStagesData,
  starsStageData,
  visualBeatsData,
  loveAndDesireData,
  trendVideosData,
  stageCreationData,
];

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

function uniqueVideosById() {
  const seen = new Set();
  const out = [];
  for (const data of CLIP_SOURCES) {
    for (const v of data || []) {
      if (!v || v.id == null) continue;
      const id = String(v.id);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(v);
    }
  }
  return out;
}

const ALL_VIDEO_DATA = uniqueVideosById();

function getVideoArtistName(video) {
  if (!video?.artistId) return '';
  const a = artists.find((x) => x.id === video.artistId);
  return a?.name || '';
}

function getMovieGenresList(m, lang) {
  if (m.genre && typeof m.genre === 'object') {
    return Array.isArray(m.genre[lang])
      ? m.genre[lang]
      : m.genre[lang]
        ? [m.genre[lang]]
        : m.genre.uz || m.genre.ru || [];
  }
  return Array.isArray(m.genre) ? m.genre : [m.genre || ''];
}

function parseMovieLikeCount(v) {
  if (v === '' || v == null) return 0;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}

function isMovieRecord(m) {
  if (!m?.type) return true;
  return m.type === 'movie';
}

function getMovieTitle(m, lang) {
  return m?.title?.[lang] || m?.title?.uz || m?.title?.ru || '';
}

function getMovieImage(m, lang) {
  return m?.homeImg?.[lang] || m?.homeImg?.uz || m?.homeImg?.ru || '/img/movie1.jpg';
}

/** MovieDetail dagi tavsif matni — faqat string */
function getMovieDescriptionText(m, lang) {
  if (!m?.description) return '';
  if (typeof m.description === 'object') {
    const block = m.description[lang] || m.description.uz || m.description.ru;
    if (block && typeof block === 'object' && block.text) return String(block.text || '').trim();
    if (typeof block === 'string') return block.trim();
  }
  if (typeof m.description === 'string') return m.description.trim();
  return '';
}

function getShortsTitle(item, lang) {
  if (typeof item.title === 'string') return item.title;
  return item.title?.[lang] || item.title?.uz || item.title?.ru || '';
}

/** ShortsVideos getDescription bilan bir xil */
function getShortsDescription(item, lang) {
  if (!item?.description) return '';
  if (typeof item.description === 'object') {
    return String(item.description[lang] || item.description.uz || item.description.ru || '').trim();
  }
  if (typeof item.description === 'string') return item.description.trim();
  return '';
}

/** Shorts kartochkasi — kino rasmi emas, aynan qisqa video fayli (ShortsVideos bilan mos). */
function getShortsVideoSrc(item, lang) {
  const v = item?.video;
  if (typeof v === 'string' && v.trim()) return v;
  if (v && typeof v === 'object') {
    const src = v[lang] || v.uz || v.ru || '';
    if (src) return src;
  }
  const mv = item?.musics?.video;
  if (typeof mv === 'string' && mv.trim()) return mv;
  return '';
}

/**
 * Sharh tarixidagi (izohi bor) shortslar — yangi → eski tartibda, har bir short bir marta.
 * movieShorts (kino bo‘limi) va musicshorts (musiqa bo‘limi) bir xil playlistda aralash;
 * scroll keyingi/prev video shu yagona ro‘yxat bo‘yicha (ShortsVideos buildRepostShortsList).
 */
export function buildShortsHistoryPlaylist(lang = 'uz') {
  const all = buildCommentHistoryEntries(lang);
  const shortsRows = all.filter((e) => e.filter === 'shorts');
  const seen = new Set();
  const playlist = [];
  for (const e of shortsRows) {
    const t = e.target;
    if (t.kind !== 'shorts' || t.shortsId == null) continue;
    const repostType = t.shortsSource === 'musicshorts' ? 'musicshorts' : 'movieShorts';
    const k = `${repostType}:${t.shortsId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    playlist.push({ type: repostType, id: t.shortsId });
  }
  return playlist;
}

/**
 * Sharh tarixidan ochilganda: barcha shorts playlist + bosilgan short indeksi.
 */
export function getShortsRouteFromHistory(target, lang = 'uz') {
  if (target?.kind !== 'shorts' || target.shortsId == null) return '/shorts';
  const playlist = buildShortsHistoryPlaylist(lang);
  const repostType = target.shortsSource === 'musicshorts' ? 'musicshorts' : 'movieShorts';
  const idx = playlist.findIndex(
    (p) => p.type === repostType && String(p.id) === String(target.shortsId)
  );
  const startIndex = idx >= 0 ? idx : 0;
  const p = new URLSearchParams();
  if (playlist.length) {
    p.set('repostShorts', playlist.map((x) => `${x.type}:${x.id}`).join(','));
  } else {
    p.set('repostShorts', `${repostType}:${target.shortsId}`);
  }
  p.set('startIndex', String(startIndex));
  return `/shorts?${p.toString()}`;
}

export function buildCommentHistoryEntries(lang = 'uz') {
  const entries = [];

  for (const m of allMovies) {
    if (!isMovieRecord(m)) continue;
    const id = m.id;
    const raw = commentsApi.getComments(id);
    const flat = flattenCommentTree(raw);
    for (const c of flat) {
      entries.push({
        key: `movie-${id}-${c.id}`,
        filter: 'movie',
        createdAt: c.createdAt || '',
        comment: c,
        target: {
          kind: 'movie',
          movieId: id,
          title: getMovieTitle(m, lang),
          image: getMovieImage(m, lang),
          route: `/movie/${id}`,
          genres: getMovieGenresList(m, lang),
          movieCategory: m.category,
          rating: m.rating,
          ratingImdb: m.ratingImdb,
          ratingKinopoisk: m.ratingKinopoisk,
          ratingNetflix: m.ratingNetflix,
          ratingDisplay: formatMovieRating(m.rating),
          likeCount: parseMovieLikeCount(m.like),
          dislikeCount: parseMovieLikeCount(m.dislike),
          descriptionPreview: getMovieDescriptionText(m, lang),
        },
      });
    }
  }

  for (const v of ALL_VIDEO_DATA) {
    const storageKey = `music:${String(v.id)}`;
    const raw = commentsApi.getComments(storageKey);
    const flat = flattenCommentTree(raw);
    const filter = v.type === 'konsert' ? 'konsert' : 'klip';
    for (const c of flat) {
      entries.push({
        key: `mv-${v.id}-${c.id}`,
        filter,
        createdAt: c.createdAt || '',
        comment: c,
        target: {
          kind: 'video',
          videoType: v.type || 'klip',
          title: v.title || '',
          image: v.img || '/img/movie1.jpg',
          route: `/music/video/${v.id}`,
          videoId: v.id,
          artistName: getVideoArtistName(v),
          likeCount: parseInt(v.like, 10) || 0,
          dislikeCount: parseInt(v.dislike, 10) || 0,
        },
      });
    }
  }

  shortsVideos.forEach((s) => {
    const raw = shortsCommentsApi.getComments(s.id);
    const flat = flattenCommentTree(raw);
    for (const c of flat) {
      entries.push({
        key: `ms-${s.id}-${c.id}`,
        filter: 'shorts',
        createdAt: c.createdAt || '',
        comment: c,
        target: {
          kind: 'shorts',
          shortsType: s.type || 'movieShorts',
          shortsSource: 'movieShorts',
          shortsId: s.id,
          movieId: s.movieId ?? null,
          musicId: null,
          contentType: null,
          title: getShortsTitle(s, lang),
          videoSrc: getShortsVideoSrc(s, lang),
          descriptionPreview: getShortsDescription(s, lang),
        },
      });
    }
  });

  musicShorts.forEach((s) => {
    const raw = shortsCommentsApi.getComments(s.id);
    const flat = flattenCommentTree(raw);
    for (const c of flat) {
      entries.push({
        key: `mus-${s.id}-${c.id}`,
        filter: 'shorts',
        createdAt: c.createdAt || '',
        comment: c,
        target: {
          kind: 'shorts',
          shortsType: s.type || 'musicshorts',
          shortsSource: 'musicshorts',
          shortsId: s.id,
          movieId: s.movieId ?? null,
          musicId: s.musicId ?? null,
          contentType: s.contentType || 'music',
          title: getShortsTitle(s, lang),
          videoSrc: getShortsVideoSrc(s, lang),
          descriptionPreview: getShortsDescription(s, lang),
        },
      });
    }
  });

  entries.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  return entries;
}
