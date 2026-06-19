import { getFilterByMovieId } from '../utils/getFilterByMovieId';

export const shortsVideos = [
  {
    id: 1,
    video: {
      uz: "/video/shorts1.mp4",
      ru: "/video/shorts1.mp4"
    },
    title: {
      uz: "Inception",
      ru: "Начало"
    },
    description: {
      uz: "Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi. Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi.Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi.Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi.Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi.",
      ru: "Опытный вор пытается выполнить невозможную задачу инцепции."
    },
    movieId: 1,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(1)
  },
  {
    id: 2,
    video: {
      uz: "/video/shorts2.mp4",
      ru: "/video/shorts2.mp4"
    },
    title: {
      uz: "Qora Ritsar",
      ru: "Темный рыцарь"
    },
    description: {
      uz: "Batman Gotham shahrini qutqarish uchun kurashadi.",
      ru: "Бэтмен борется за спасение Готэма."
    },
    movieId: 2,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(2)
  },
  {
    id: 3,
    video: {
      uz: "/video/shorts3.mp4",
      ru: "/video/shorts3.mp4"
    },
    title: {
      uz: "Dilwale",
      ru: "Дилвале"
    },
    description: {
      uz: "Romantik va jangari sarguzasht.",
      ru: "Романтическое и боевик приключение."
    },
    movieId: 3,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(3)
  },
  {
    id: 4,
    video: {
      uz: "/video/shorts4.mp4",
      ru: "/video/shorts4.mp4"
    },
    title: {
      uz: "3 Ahmoq",
      ru: "3 идиота"
    },
    description: {
      uz: "Do'stlik va ta'lim haqida hind komediya.",
      ru: "Индийская комедия о дружбе и образовании."
    },
    movieId: 4,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(4)
  },
  {
    id: 5,
    video: {
      uz: "/video/shorts5.mp4",
      ru: "/video/shorts5.mp4"
    },
    title: {
      uz: "Interstellar",
      ru: "Интерстеллар"
    },
    description: {
      uz: "Kosmosda yangi yashash joyi qidirish.",
      ru: "Поиск нового места для жизни в космосе."
    },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 6,
    video: {
      uz: "/video/shorts6.mp4",
      ru: "/video/shorts6.mp4"
    },
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 6,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(6)
  },
  {
    id: 7,
    video: {
      uz: "/video/shorts7.mp4",
      ru: "/video/shorts7.mp4"
    },
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 7,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(7)
  },
  {
    id: 8,
    video: {
      uz: "/video/shorts8.mp4",
      ru: "/video/shorts8.mp4"
    },
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 8,
    ...getFilterByMovieId(8)
  },
  {
    id: 9,
    video: {
      uz: "/video/shorts9.mp4",
      ru: "/video/shorts9.mp4"
    },
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 9,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(9)
  },
  {
    id: 10,
    video: {
      uz: "/video/shorts10.mp4",
      ru: "/video/shorts10.mp4"
    },
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 10,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(10)
  },
  {
    id: 11,
    video: {
      uz: "/video/shorts11.mp4",
      ru: "/video/shorts11.mp4"
    },
    title: {
      uz: "Xayot haqida",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 11,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(11)
  },
  {
    id: 12,
    video: {
      uz: "/video/shorts5.mp4",
      ru: "/video/shorts5.mp4"
    },
    title: {
      uz: "Aqeldan ozgan",
      ru: "Интерстеллар"
    },
    description: {
      uz: "Kosmosda yangi yashash joyi qidirish.",
      ru: "Поиск нового места для жизни в космосе."
    },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 13,
    video: {
      uz: "/video/shorts10.mp4",
      ru: "/video/shorts10.mp4"
    },
    title: {
      uz: "mening aybem",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 10,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(10)
  },
  {
    id: 14,
    video: {
      uz: "/video/shorts9.mp4",
      ru: "/video/shorts9.mp4"
    },
    title: {
      uz: "Sevgi heslarem",
      ru: "Побег из Шоушенка"
    },
    description: {
      uz: "Qamoqxonada umid va ozodlik haqida. Qamoqxonada umid va ozodlik haqida. Qamoqxonada umid va ozodlik haqida. Qamoqxonada umid va ozodlik haqida.",
      ru: "О надежде и свободе в тюрьме."
    },
    movieId: 9,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(9)
  },
  {
    id: 15,
    video: { uz: "/video/shorts13.mp4", ru: "/video/shorts13.mp4" },
    title: { uz: "Umid yo'li", ru: "Путь надежды" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 1,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(1)
  },
  {
    id: 16,
    video: { uz: "/video/shorts14.mp4", ru: "/video/shorts14.mp4" },
    title: { uz: "Qora chodir", ru: "Тёмная палатка" },
    description: { uz: "Batman Gotham shahrini qutqarish uchun kurashadi.", ru: "Бэтмен борется за спасение Готэма." },
    movieId: 2,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(2)
  },
  {
    id: 17,
    video: { uz: "/video/shorts15.mp4", ru: "/video/shorts15.mp4" },
    title: { uz: "Dilbari", ru: "Дилбари" },
    description: { uz: "Romantik va jangari sarguzasht.", ru: "Романтическое и боевик приключение." },
    movieId: 3,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(3)
  },
  {
    id: 18,
    video: { uz: "/video/shorts16.mp4", ru: "/video/shorts16.mp4" },
    title: { uz: "Do'stlar", ru: "Друзья" },
    description: { uz: "Do'stlik va ta'lim haqida hind komediya.", ru: "Индийская комедия о дружбе и образовании." },
    movieId: 4,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(4)
  },
  {
    id: 19,
    video: { uz: "/video/shorts17.mp4", ru: "/video/shorts17.mp4" },
    title: { uz: "Yulduzlar orasida", ru: "Среди звёзд" },
    description: { uz: "Kosmosda yangi yashash joyi qidirish.", ru: "Поиск нового места для жизни в космосе." },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 20,
    video: { uz: "/video/shorts18.mp4", ru: "/video/shorts18.mp4" },
    title: { uz: "Ozodlik intilishi", ru: "Стремление к свободе" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 6,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(6)
  },
  {
    id: 21,
    video: { uz: "/video/shorts19.mp4", ru: "/video/shorts19.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 7,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(7)
  },
  {
    id: 22,
    video: { uz: "/video/shorts20.mp4", ru: "/video/shorts20.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 8,
    ...getFilterByMovieId(8)
  },
  {
    id: 23,
    video: { uz: "/video/shorts21.mp4", ru: "/video/shorts21.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 9,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(9)
  },
  {
    id: 24,
    video: { uz: "/video/shorts22.mp4", ru: "/video/shorts22.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 10,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(10)
  },
  {
    id: 25,
    video: { uz: "/video/shorts23.mp4", ru: "/video/shorts23.mp4" },
    title: { uz: "Xayot siri", ru: "Тайна жизни" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 11,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(11)
  },
  {
    id: 26,
    video: { uz: "/video/shorts24.mp4", ru: "/video/shorts24.mp4" },
    title: { uz: "Inception", ru: "Начало" },
    description: { uz: "Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi.", ru: "Опытный вор пытается выполнить невозможную задачу инцепции." },
    movieId: 1,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(1)
  },
  {
    id: 27,
    video: { uz: "/video/shorts25.mp4", ru: "/video/shorts25.mp4" },
    title: { uz: "Qora Ritsar", ru: "Темный рыцарь" },
    description: { uz: "Batman Gotham shahrini qutqarish uchun kurashadi.", ru: "Бэтмен борется за спасение Готэма." },
    movieId: 2,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(2)
  },
  {
    id: 28,
    video: { uz: "/video/shorts26.mp4", ru: "/video/shorts26.mp4" },
    title: { uz: "Dilwale", ru: "Дилвале" },
    description: { uz: "Romantik va jangari sarguzasht.", ru: "Романтическое и боевик приключение." },
    movieId: 3,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(3)
  },
  {
    id: 29,
    video: { uz: "/video/shorts27.mp4", ru: "/video/shorts27.mp4" },
    title: { uz: "3 Ahmoq", ru: "3 идиота" },
    description: { uz: "Do'stlik va ta'lim haqida hind komediya.", ru: "Индийская комедия о дружбе и образовании." },
    movieId: 4,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(4)
  },
  {
    id: 30,
    video: { uz: "/video/shorts28.mp4", ru: "/video/shorts28.mp4" },
    title: { uz: "Interstellar", ru: "Интерстеллар" },
    description: { uz: "Kosmosda yangi yashash joyi qidirish.", ru: "Поиск нового места для жизни в космосе." },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 31,
    video: { uz: "/video/shorts29.mp4", ru: "/video/shorts29.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 6,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(6)
  },
  {
    id: 32,
    video: { uz: "/video/shorts30.mp4", ru: "/video/shorts30.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 7,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(7)
  },
  {
    id: 33,
    video: { uz: "/video/shorts31.mp4", ru: "/video/shorts31.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 8,
    ...getFilterByMovieId(8)
  },
  {
    id: 34,
    video: { uz: "/video/shorts32.mp4", ru: "/video/shorts32.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 9,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(9)
  },
  {
    id: 35,
    video: { uz: "/video/shorts33.mp4", ru: "/video/shorts33.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 10,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(10)
  },
  {
    id: 36,
    video: { uz: "/video/shorts34.mp4", ru: "/video/shorts34.mp4" },
    title: { uz: "Xayot haqida", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 11,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(11)
  },
  {
    id: 37,
    video: { uz: "/video/shorts35.mp4", ru: "/video/shorts35.mp4" },
    title: { uz: "Inception", ru: "Начало" },
    description: { uz: "Malakali o'g'ri inceptionning mumkin bo'lmagan vazifasini bajarishga harakat qiladi.", ru: "Опытный вор пытается выполнить невозможную задачу инцепции." },
    movieId: 1,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(1)
  },
  {
    id: 38,
    video: { uz: "/video/shorts36.mp4", ru: "/video/shorts36.mp4" },
    title: { uz: "Qora Ritsar", ru: "Темный рыцарь" },
    description: { uz: "Batman Gotham shahrini qutqarish uchun kurashadi.", ru: "Бэтмен борется за спасение Готэма." },
    movieId: 2,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(2)
  },
  {
    id: 39,
    video: { uz: "/video/shorts37.mp4", ru: "/video/shorts37.mp4" },
    title: { uz: "Dilwale", ru: "Дилвале" },
    description: { uz: "Romantik va jangari sarguzasht.", ru: "Романтическое и боевик приключение." },
    movieId: 3,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(3)
  },
  {
    id: 40,
    video: { uz: "/video/shorts38.mp4", ru: "/video/shorts38.mp4" },
    title: { uz: "3 Ahmoq", ru: "3 идиота" },
    description: { uz: "Do'stlik va ta'lim haqida hind komediya.", ru: "Индийская комедия о дружбе и образовании." },
    movieId: 4,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(4)
  },
  {
    id: 41,
    video: { uz: "/video/shorts39.mp4", ru: "/video/shorts39.mp4" },
    title: { uz: "Interstellar", ru: "Интерстеллар" },
    description: { uz: "Kosmosda yangi yashash joyi qidirish.", ru: "Поиск нового места для жизни в космосе." },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 42,
    video: { uz: "/video/shorts40.mp4", ru: "/video/shorts40.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 6,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(6)
  },
  {
    id: 43,
    video: { uz: "/video/shorts41.mp4", ru: "/video/shorts41.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 7,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(7)
  },
  {
    id: 44,
    video: { uz: "/video/shorts42.mp4", ru: "/video/shorts42.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 8,
    ...getFilterByMovieId(8)
  },
  {
    id: 45,
    video: { uz: "/video/shorts43.mp4", ru: "/video/shorts43.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 9,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(9)
  },
  {
    id: 46,
    video: { uz: "/video/shorts44.mp4", ru: "/video/shorts44.mp4" },
    title: { uz: "Shawshank Qutqarilishi", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 10,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(10)
  },
  {
    id: 47,
    video: { uz: "/video/shorts45.mp4", ru: "/video/shorts45.mp4" },
    title: { uz: "Xayot haqida", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 11,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(11)
  },
  {
    id: 48,
    video: { uz: "/video/shorts46.mp4", ru: "/video/shorts46.mp4" },
    title: { uz: "Aqeldan ozgan", ru: "Интерстеллар" },
    description: { uz: "Kosmosda yangi yashash joyi qidirish.", ru: "Поиск нового места для жизни в космосе." },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 49,
    video: { uz: "/video/shorts47.mp4", ru: "/video/shorts47.mp4" },
    title: { uz: "mening aybem", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 10,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(10)
  },
  {
    id: 50,
    video: { uz: "/video/shorts48.mp4", ru: "/video/shorts48.mp4" },
    title: { uz: "Sevgi heslarem", ru: "Побег из Шоушенка" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 9,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(9)
  },
  {
    id: 51,
    video: { uz: "/video/shorts49.mp4", ru: "/video/shorts49.mp4" },
    title: { uz: "Umid yo'li", ru: "Путь надежды" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 1,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(1)
  },
  {
    id: 52,
    video: { uz: "/video/shorts50.mp4", ru: "/video/shorts50.mp4" },
    title: { uz: "Qora chodir", ru: "Тёмная палатка" },
    description: { uz: "Batman Gotham shahrini qutqarish uchun kurashadi.", ru: "Бэтмен борется за спасение Готэма." },
    movieId: 2,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(2)
  },
  {
    id: 53,
    video: { uz: "/video/shorts51.mp4", ru: "/video/shorts51.mp4" },
    title: { uz: "Dilbari", ru: "Дилбари" },
    description: { uz: "Romantik va jangari sarguzasht.", ru: "Романтическое и боевик приключение." },
    movieId: 3,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(3)
  },
  {
    id: 54,
    video: { uz: "/video/shorts52.mp4", ru: "/video/shorts52.mp4" },
    title: { uz: "Do'stlar", ru: "Друзья" },
    description: { uz: "Do'stlik va ta'lim haqida hind komediya.", ru: "Индийская комедия о дружбе и образовании." },
    movieId: 4,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(4)
  },
  {
    id: 55,
    video: { uz: "/video/shorts53.mp4", ru: "/video/shorts53.mp4" },
    title: { uz: "Yulduzlar orasida", ru: "Среди звёзд" },
    description: { uz: "Kosmosda yangi yashash joyi qidirish.", ru: "Поиск нового места для жизни в космосе." },
    movieId: 5,
    ...getFilterByMovieId(5)
  },
  {
    id: 56,
    video: { uz: "/video/shorts54.mp4", ru: "/video/shorts54.mp4" },
    title: { uz: "Ozodlik intilishi", ru: "Стремление к свободе" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 6,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(6)
  },
  {
    id: 57,
    video: { uz: "/video/shorts55.mp4", ru: "/video/shorts55.mp4" },
    title: { uz: "Xayot siri", ru: "Тайна жизни" },
    description: { uz: "Qamoqxonada umid va ozodlik haqida.", ru: "О надежде и свободе в тюрьме." },
    movieId: 11,
    musics: {
      music: "/music/Zivert - Life.mp3",
      video: "/video/shorts1.mp4",
      img: "/img/movie12.jpg",
      title: { uz: "Ummon - Qanday unutding", ru: "Уммон - Как ты забыл" }
    },
    ...getFilterByMovieId(11)
  },
];
