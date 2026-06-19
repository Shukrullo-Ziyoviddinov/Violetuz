/**
 * Kino bo'limlari konfiguratsiyasi.
 * Musiqa bo'limi (dataMusic) dan alohida – kino bo'limi uchun.
 * Yangi bo'lim qo'shish: MOVIE_SECTIONS ga obyekt qo'shing va HOME_CONTENT ga joylashtiring.
 */
import { recommendedMovies } from './movies';
import { koreaDrama } from './koreaDrama';
import { kinolar } from './kinolar';
import { worldMovies } from './worldMovies';
import { animations } from './animations';
import { turkishSeries } from './turkishSeries';
import { russianMovies } from './russianMovies';
import { tvSeries } from './tvSeries';
import { actionMovies } from './actionMovies';
import { horrorMovies } from './horrorMovies';
import { anime } from './anime';
import { adventureMovies } from './adventureMovies';
import { romanceMovies } from './romanceMovies';
import { retroMovies } from './retroMovies';
import { uzbekMovies } from './uzbekMovies';

/** Barcha kino bo'limlari – id, data, titleKey, moreTo */
export const MOVIE_SECTIONS = [
  {
    id: 'recommended',
    data: recommendedMovies || [],
    titleKey: 'movies.recommended',
    moreTo: '/recommended',
    showHorizontalScroll: true,
  },
  {
    id: 'koreaDrama',
    data: koreaDrama || [],
    titleKey: 'movies.koreaDrama',
    moreTo: '/category/korea',
    showHorizontalScroll: true,
  },
  {
    id: 'kinolar',
    data: kinolar || [],
    titleKey: 'movies.kinolar',
    moreTo: '/category/kinolar',
    showHorizontalScroll: true,
  },
  {
    id: 'worldMovies',
    data: worldMovies || [],
    titleKey: 'movies.worldMovies',
    moreTo: '/category/worldMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'animations',
    data: animations || [],
    titleKey: 'movies.animations',
    moreTo: '/category/animations',
    showHorizontalScroll: true,
  },
  {
    id: 'turkishSeries',
    data: turkishSeries || [],
    titleKey: 'movies.turkishSeries',
    moreTo: '/category/turkishSeries',
    showHorizontalScroll: true,
  },
  {
    id: 'russianMovies',
    data: russianMovies || [],
    titleKey: 'movies.russianMovies',
    moreTo: '/category/russianMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'tvSeries',
    data: tvSeries || [],
    titleKey: 'movies.tvSeries',
    moreTo: '/category/tvSeries',
    showHorizontalScroll: true,
  },
  {
    id: 'actionMovies',
    data: actionMovies || [],
    titleKey: 'movies.actionMovies',
    moreTo: '/category/actionMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'horrorMovies',
    data: horrorMovies || [],
    titleKey: 'movies.horrorMovies',
    moreTo: '/category/horrorMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'anime',
    data: anime || [],
    titleKey: 'movies.anime',
    moreTo: '/category/anime',
    showHorizontalScroll: true,
  },
  {
    id: 'adventureMovies',
    data: adventureMovies || [],
    titleKey: 'movies.adventureMovies',
    moreTo: '/category/adventureMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'romanceMovies',
    data: romanceMovies || [],
    titleKey: 'movies.romanceMovies',
    moreTo: '/category/romanceMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'retroMovies',
    data: retroMovies || [],
    titleKey: 'movies.retroMovies',
    moreTo: '/category/retroMovies',
    showHorizontalScroll: true,
  },
  {
    id: 'uzbekMovies',
    data: uzbekMovies || [],
    titleKey: 'movies.uzbekMovies',
    moreTo: '/category/uzbekMovies',
    showHorizontalScroll: true,
  },
];

/** sectionsById – id bo'yicha tez qidirish */
export const MOVIE_SECTIONS_BY_ID = Object.fromEntries(
  MOVIE_SECTIONS.map((s) => [s.id, s])
);

/**
 * Bosh sahifa kontent tartibi – Home.jsx layout.
 * type: 'movies' – Movies komponenti, sectionId config dan olinadi
 * type: 'shorts' – HomeShorts komponenti, variant ixtiyoriy
 * type: 'topRated' – TopRatedContent komponenti
 * type: 'recommendedActors' – RecommendedActors (aktyorlar)
 */
export const HOME_CONTENT = [
  { type: 'movies', sectionId: 'recommended' },
  { type: 'shorts', variant: 'default' },
  { type: 'movies', sectionId: 'koreaDrama' },
  { type: 'movies', sectionId: 'kinolar' },
  { type: 'movies', sectionId: 'worldMovies' },
  { type: 'recommendedActors' },
  { type: 'shorts', variant: 'secondary' },
  { type: 'movies', sectionId: 'animations' },
  { type: 'movies', sectionId: 'turkishSeries' },
  { type: 'videoBanner' },
  { type: 'movies', sectionId: 'russianMovies' },
  { type: 'shorts', variant: 'tertiary' },
  { type: 'movies', sectionId: 'tvSeries' },
  { type: 'topRated' },
  { type: 'movies', sectionId: 'actionMovies' },
  { type: 'movies', sectionId: 'horrorMovies' },
  { type: 'shorts', variant: 'quaternary' },
  { type: 'movies', sectionId: 'anime' },
  { type: 'movies', sectionId: 'adventureMovies' },
  { type: 'movies', sectionId: 'romanceMovies' },
  { type: 'movies', sectionId: 'retroMovies' },
  { type: 'shorts', variant: 'quinary' },
  { type: 'movies', sectionId: 'uzbekMovies' },
];
