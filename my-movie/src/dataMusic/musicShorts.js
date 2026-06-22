/**
 * Music Shorts - Musiqa bo'limi uchun qisqa videolar.
 * musicId + contentType orqali title/artist/img resolveShortsMusicMeta dan olinadi.
 * contentType: 'music' | 'klip' | 'konsert'.
 */
import { resolveShortsMusicMeta } from '../utils/resolveShortsMusicMeta';

const rawMusicShorts = [
  {
    id: 10001,
    video: {
      uz: '/video/shorts1.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
  {
    id: 10002,
    video: {
      uz: '/video/shorts2.mp4',
      ru: '/video/shorts2.mp4',
    },
    description: {
      uz: "Shohruhxonning romantik qo'shig'i - sevgi va orzu haqida.",
      ru: 'Романтическая песня Шохрухона - о любви и мечтах.',
    },
    musicId: 802,
    artistId: 'shohruhxon',
    movieId: 2,
    contentType: 'music',
    type: 'musicshorts',
  },
  {
    id: 10003,
    video: {
      uz: '/video/shorts3.mp4',
      ru: '/video/shorts3.mp4',
    },
    description: {
      uz: "King of Pop - Michael Jacksonning legendaviy qo'shig'i.",
      ru: 'Король поп-музыки - легендарная песня Майкла Джексона.',
    },
    musicId: 803,
    artistId: 'michael-jackson',
    movieId: 3,
    contentType: 'music',
    type: 'musicshorts',
  },
  {
    id: 10004,
    video: {
      uz: '/video/shorts4.mp4',
      ru: '/video/shorts4.mp4',
    },
    description: {
      uz: "Maher Zainning ilohiy qo'shig'i - shukr va minnatdorchilik haqida.",
      ru: 'Божественная песня Махера Зайна - о благодарности.',
    },
    musicId: 1510,
    artistId: 'maher-zain',
    contentType: 'konsert',
    type: 'musicshorts',
  },
    {
    id: 10005,
    video: {
      uz: '/video/shorts6.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 10006,
    video: {
      uz: '/video/shorts1.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 10007,
    video: {
      uz: '/video/shorts7.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 10008,
    video: {
      uz: '/video/shorts8.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 10009,
    video: {
      uz: '/video/shorts9.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 100011,
    video: {
      uz: '/video/shorts10.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 100012,
    video: {
      uz: '/video/shorts11.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 100013,
    video: {
      uz: 'video/shorts12.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 100014,
    video: {
      uz: '/video/shorts13.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
    {
    id: 100015,
    video: {
      uz: '/video/shorts15.mp4',
      ru: '/video/shorts1.mp4',
    },
    description: {
      uz: "O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri. O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.O'zbek pop qo'shig'i - Ummon guruhining eng mashhur treklaridan biri.",
      ru: 'Узбекская поп-песня - один из самых популярных треков группы Уммон.',
    },
    musicId: 1010,
    artistId: 'jah-khalib',
    movieId: 1,
    contentType: 'klip',
    type: 'musicshorts',
  },
];

export const musicShorts = rawMusicShorts.map(resolveShortsMusicMeta);
