/**
 * genres.js - Janr filterlash uchun ma'lumot
 * filterGenre: string yoki array - kinolarda filterGenre bilan mos kelishi kerak
 * Array bo'lsa (masalan Romantika/Romantik) - har qaysi qiymat bo'yicha qidiriladi
 */
export const genres = [
  { id: 'drama', title: { uz: 'Drama', ru: 'Драма' }, img: '/img/movie-4.5-1.avif', filterGenre: 'Drama' },
  { id: 'oilaviy', title: { uz: 'Oilaviy', ru: 'Семейный' }, img: '/img/movie-4.5-2.jpeg', filterGenre: 'Oilaviy' },
  { id: 'romantika', title: { uz: 'Romantika', ru: 'Романтика' }, img: '/img/movie-4.5-3.jpg', filterGenre: ['Romantika', 'Romantik'] },
  { id: 'multfilim', title: { uz: 'Multfilim', ru: 'Мультфильм' }, img: '/img/movie-4.5-4.webp', filterGenre: 'Multfilim' },
  { id: 'boevik', title: { uz: 'Boevik', ru: 'Боевик' }, img: '/img/movie-4.5-5.jpg', filterGenre: 'Jangari' },
  { id: 'anime', title: { uz: 'Anime', ru: 'Аниме' }, img: '/img/movie-4.5-6.avif', filterGenre: 'Anime' },
  { id: 'sarguzasht', title: { uz: 'Sarguzasht', ru: 'Приключения' }, img: '/img/movie-4.5-7.jpg', filterGenre: 'Sarguzasht' }
];
