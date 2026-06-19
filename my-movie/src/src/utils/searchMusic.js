/**
 * Musiqa qidiruv – musiqalar, albomlar, kliplar va konsertlar bo'yicha.
 * Albomlar: title, artist, songs[].title, songs[].artist bo'yicha qidiradi.
 * Musiqa/klip/konsert: title va artist bo'yicha qidiradi.
 * Stop words va minimal moslik – faqat aniq natijalar chiqadi.
 */
import { allMusicData } from '../dataMusic/allMusicData';
import { ensureArray } from '../dataMusic/musicDataUtils';
import { artists } from '../dataMusic/artists';
import { TopAlbums } from '../dataMusic/topAlbumsData';
import { musicDropsData } from '../dataMusic/musicDropsData';
import { sevgiVaMusiqaData } from '../dataMusic/sevgiVaMusiqaData';
import { hitCollectionsData } from '../dataMusic/hitCollectionsData';
import { trendClipsData } from '../dataMusic/trendClipsData';
import { jaxonConcertsData } from '../dataMusic/jaxonConcertsData';
import { visualBeatsData } from '../dataMusic/visualBeatsData';
import { loveAndDesireData } from '../dataMusic/loveAndDesireData';
import { trendVideosData } from '../dataMusic/trendVideosData';
import { stageCreationData } from '../dataMusic/stageCreationData';
import { liveStagesData } from '../dataMusic/liveStagesData';
import { starsStageData } from '../dataMusic/starsStageData';

const allAlbumsData = [
  ...(TopAlbums || []),
  ...(musicDropsData || []),
  ...(sevgiVaMusiqaData || []),
  ...(hitCollectionsData || []),
];

const allClipsData = [
  ...(trendClipsData || []),
  ...(jaxonConcertsData || []),
  ...(visualBeatsData || []),
  ...(loveAndDesireData || []),
  ...(trendVideosData || []),
  ...(stageCreationData || []),
  ...(liveStagesData || []),
  ...(starsStageData || []),
];

const normalize = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

/** Umume'tirof so'zlar – bular qidiruvda hisobga olinmaydi */
const STOP_WORDS = new Set([
  'with', 'a', 'the', 'and', 'or', 'in', 'on', 'of', 'to', 'for', 'by',
  'at', 'is', 'it', 'an', 'as', 'be', 'so', 'no', 'up', 'vs', '-',
]);

/** Ma'noli qidiruv so'zlarini qaytaradi (stop words olib tashlangan) */
const getSignificantWords = (queryWords) =>
  queryWords.filter((w) => w.length >= 2 && !STOP_WORDS.has(normalize(w)));

const getTitleForLang = (item, lang) => {
  if (!item?.title) return '';
  if (typeof item.title === 'object') {
    return item.title[lang] || item.title.uz || item.title.ru || item.title.en || '';
  }
  return String(item.title);
};

const getArtistName = (artistId) => {
  const artist = artists.find((a) => a.id === artistId);
  return artist?.name || artistId || '';
};

const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

const fuzzyMatch = (queryWord, textWord) => {
  if (!queryWord || queryWord.length < 2) return false;
  if (textWord.includes(queryWord) || queryWord.includes(textWord)) return true;
  if (queryWord.length >= 3 && textWord.length >= 3) {
    const d = levenshtein(queryWord, textWord);
    const maxDist = queryWord.length <= 4 ? 1 : Math.min(2, Math.floor(queryWord.length / 2));
    return d <= maxDist;
  }
  return false;
};

/** Qancha ma'noli so'z mos kelishini hisoblaydi */
const countSignificantMatches = (textUz, textRu, significantWords) => {
  const wordsUz = textUz.split(/\s+/).filter(Boolean);
  const wordsRu = textRu.split(/\s+/).filter(Boolean);
  const allWords = [...new Set([...wordsUz, ...wordsRu])];
  let count = 0;
  for (const qw of significantWords) {
    const matched = allWords.some((tw) => fuzzyMatch(qw, tw)) ||
      textUz.includes(qw) || textRu.includes(qw);
    if (matched) count++;
  }
  return count;
};

const metaMatchesQuery = (music, queryWords) => {
  for (const qw of queryWords) {
    if (qw.length < 2 || STOP_WORDS.has(normalize(qw))) continue;
    if (music.genre && fuzzyMatch(qw, normalize(String(music.genre)))) return true;
    if (music.country && fuzzyMatch(qw, normalize(String(music.country)))) return true;
    if (music.language && fuzzyMatch(qw, normalize(String(music.language)))) return true;
    if (music.type && fuzzyMatch(qw, normalize(String(music.type)))) return true;
  }
  return false;
};

const titleArtistMatchScore = (music, q, queryWords, significantWords) => {
  const titleUz = normalize(getTitleForLang(music, 'uz'));
  const titleRu = normalize(getTitleForLang(music, 'ru'));
  const artistName = normalize(getArtistName(music.artistId) || music.artist || '');
  const searchUz = `${titleUz} ${artistName}`;
  const searchRu = `${titleRu} ${artistName}`;
  if (searchUz.includes(q) || searchRu.includes(q)) return 3;
  const titleCount = countSignificantMatches(titleUz, titleRu, significantWords);
  const artistCount = countSignificantMatches(artistName, artistName, significantWords);
  const matchCount = Math.max(titleCount, artistCount);
  if (significantWords.length === 0) return 0;
  if (matchCount >= 2) return 1 + matchCount / significantWords.length;
  if (matchCount === 1 && significantWords.length <= 2) return 1;
  if (matchCount === 1) return 0;
  return 0;
};

/** Albom: title + artist + har bir qo'shiqning title va artist bo'yicha qidirish */
const albumMatchScore = (album, q, queryWords, significantWords) => {
  const albumTitle = normalize(String(album.title || ''));
  const albumArtist = normalize(album.artist || getArtistName(album.artistId) || '');
  const songTexts = ensureArray(album.songs).map(
    (s) => `${normalize(String(s.title || ''))} ${normalize(String(s.artist || ''))}`
  );
  const fullSearch = `${albumTitle} ${albumArtist} ${songTexts.join(' ')}`;
  if (fullSearch.includes(q)) return 3;
  let matchCount = countSignificantMatches(albumTitle, albumTitle, significantWords);
  matchCount = Math.max(matchCount, countSignificantMatches(albumArtist, albumArtist, significantWords));
  for (const st of songTexts) {
    const sc = countSignificantMatches(st, st, significantWords);
    matchCount = Math.max(matchCount, sc);
  }
  if (significantWords.length === 0) return 0;
  if (matchCount >= 2) return 1 + matchCount / significantWords.length;
  if (matchCount === 1 && significantWords.length <= 2) return 1;
  if (matchCount === 1) return 0;
  return 0;
};

/** Artist: faqat name maydoni bo'yicha qidirish (aniq nom mos kelsa 4 ball – ustun bo'ladi) */
const artistMatchScore = (artist, q, queryWords, significantWords) => {
  const nameNorm = normalize(String(artist.name || ''));
  if (nameNorm.includes(q)) return 4; /* artistlar musiqadan ustun */
  const matchCount = countSignificantMatches(nameNorm, nameNorm, significantWords);
  if (significantWords.length === 0) return 0;
  if (matchCount >= 2) return 1 + matchCount / significantWords.length;
  if (matchCount === 1 && significantWords.length <= 2) return 1;
  if (matchCount === 1) return 0;
  return 0;
};

/** score bilan qaytaradi – natijalar relevance bo'yicha saralanishi uchun */
const searchPool = (items, itemType, q, queryWords, significantWords, resolveItemType = null, customMatch = null) => {
  const byTitle = [];
  const byMeta = [];
  const getType = resolveItemType || (() => itemType);
  const matchFn = customMatch || titleArtistMatchScore;
  for (const m of items) {
    const score = matchFn(m, q, queryWords, significantWords);
    const resolvedType = getType(m);
    if (score > 0) byTitle.push({ item: m, score, itemType: resolvedType });
    else if (metaMatchesQuery(m, queryWords)) byMeta.push({ item: m, itemType: resolvedType, score: 0.5 });
  }
  byTitle.sort((a, b) => b.score - a.score);
  const titleKeys = new Set(byTitle.map((x) => `${x.itemType}-${x.item.id}`));
  const metaOnly = byMeta
    .filter(({ item }) => !titleKeys.has(`${getType(item)}-${item.id}`))
    .map(({ item, itemType, score }) => ({ item: { ...item, itemType }, score }));
  return byTitle.map((x) => ({ item: { ...x.item, itemType: x.itemType }, score: x.score })).concat(metaOnly);
};

/** Qidiruv tarixi – localStorage */
const MUSIC_SEARCH_HISTORY_KEY = 'music_search_history';
const MAX_HISTORY = 20;

export const getMusicSearchHistory = () => {
  try {
    const raw = localStorage.getItem(MUSIC_SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const addMusicSearchHistory = (item, getTitle, getArtistName) => {
  if (!item?.id) return;
  const title = getTitle ? getTitle(item) : (item.name || (item.title && (typeof item.title === 'object' ? item.title.uz || item.title.ru : item.title)) || '');
  const artist = getArtistName ? getArtistName(item) : '';
  const entry = {
    historyId: `${item.itemType || 'music'}-${item.id}-${Date.now()}`,
    itemId: item.id,
    itemType: item.itemType || 'music',
    type: item.type,
    img: item.imgArtist || item.img || '/img/movie1.jpg',
    title: String(title || ''),
    artist: String(artist || ''),
    addedAt: Date.now(),
  };
  let list = getMusicSearchHistory();
  list = list.filter((e) => !(e.itemId === entry.itemId && e.itemType === entry.itemType));
  list.unshift(entry);
  list = list.slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(MUSIC_SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch {}
};

export const removeMusicSearchHistory = (historyId) => {
  let list = getMusicSearchHistory().filter((e) => e.historyId !== historyId);
  try {
    localStorage.setItem(MUSIC_SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch {}
};

export const searchMusicByQuery = (query, contentLang = 'uz', limit = 20) => {
  const q = normalize(query);
  if (!q) return [];

  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  const significantWords = getSignificantWords(queryWords);

  const musicWithScore = searchPool(ensureArray(allMusicData), 'music', q, queryWords, significantWords);
  const albumWithScore = searchPool(
    ensureArray(allAlbumsData),
    'album',
    q,
    queryWords,
    significantWords,
    null,
    albumMatchScore
  );
  const clipWithScore = searchPool(
    ensureArray(allClipsData),
    'clip',
    q,
    queryWords,
    significantWords,
    (item) => item.type || 'clip'
  );
  const artistWithScore = searchPool(
    ensureArray(artists),
    'artist',
    q,
    queryWords,
    significantWords,
    null,
    artistMatchScore
  );

  /** Har bir kategoriyadan kamida natija olish – artistlar oraga tushib qolmasin */
  const perCategory = 10;
  const fromMusic = musicWithScore.filter((x) => x.score >= 0.5).slice(0, perCategory);
  const fromArtist = artistWithScore.filter((x) => x.score >= 0.5).slice(0, 5);
  const fromAlbum = albumWithScore.filter((x) => x.score >= 0.5).slice(0, perCategory);
  const fromClip = clipWithScore.filter((x) => x.score >= 0.5).slice(0, perCategory);

  /** Bir xil score bo'lganda artistlar ustunda (JS sort barqaror) */
  const combined = [...fromArtist, ...fromMusic, ...fromAlbum, ...fromClip];
  combined.sort((a, b) => b.score - a.score);
  return combined.slice(0, Math.max(limit, 30)).map(({ item }) => item);
};
