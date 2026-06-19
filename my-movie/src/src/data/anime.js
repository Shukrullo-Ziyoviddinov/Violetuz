export const anime = [
  {
    id: 10001,
    title: { uz: "Ruhlar Olib Ketiladi", ru: "Унесённые призраками" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 8.6,
    ratingKinopoisk: 8.5,
    ageRestriction: 6,
    genre: { uz: ["Anime", "Sarguzasht", "Fantastika"], ru: ["Аниме", "Приключения", "Фэнтези"] },
    description: {
      uz: {
        text: "Chihiro maxsus hamomda ishlashga majbur bo'ladi — sehrli dunyoda ota-onasini qutqarish uchun.",
        year: 2001,
        country: "Yaponiya",
        duration: 125,
        genre: ["Anime", "Sarguzasht", "Fantastika"],
        director: "Hayao Miyazaki"
      },
      ru: {
        text: "Тихиро вынуждена работать в особенной бане — чтобы спасти родителей в волшебном мире.",
        year: 2001,
        country: "Япония",
        duration: 125,
        genre: ["Аниме", "Приключения", "Фэнтези"],
        director: "Хаяо Миядзаки"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Ruhlar Olib Ketiladi - Treyler", ru: "Унесённые призраками - Трейлер" }, like: '5200', dislike: '25', typeTrailers: "animation" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "animation", "adventure"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Sarguzasht"],
    like: '8500',
    dislike: '',
    specs: { duration: 125, ageRating: "6+", year: 2001, countries: ["Japan"], languages: ["jpn"] }
  },
  {
    id: 10002,
    title: { uz: "Sening Isming", ru: "Твоё имя" },
    homeImg: { uz: "/img/movie2.jpg", ru: "/img/movie2.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 8.2,
    ratingKinopoisk: 8.1,
    ageRestriction: 12,
    genre: { uz: ["Anime", "Romantik", "Drama"], ru: ["Аниме", "Романтика", "Драма"] },
    description: {
      uz: {
        text: "Mitsuha va Taki tanishing — ular tanani almashtirishda. Vaqt va masofa ularni ajratadi.",
        year: 2016,
        country: "Yaponiya",
        duration: 106,
        genre: ["Anime", "Romantik", "Drama"],
        director: "Makoto Shinkai"
      },
      ru: {
        text: "Мицуха и Таки обмениваются телами. Время и расстояние разделяют их.",
        year: 2016,
        country: "Япония",
        duration: 106,
        genre: ["Аниме", "Романтика", "Драма"],
        director: "Макото Синкай"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Sening Isming - Treyler", ru: "Твоё имя - Трейлер" }, like: '6800', dislike: '42', typeTrailers: "romance" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "romance", "drama"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Romantik"],
    like: '9200',
    dislike: '',
    specs: { duration: 106, ageRating: "12+", year: 2016, countries: ["Japan"], languages: ["jpn"] }
  },
  {
    id: 10003,
    title: { uz: "Demon Qotar: Mugen Qatari", ru: "Истребитель демонов: Бесконечный поезд" },
    homeImg: { uz: "/img/movie4.jpg", ru: "/img/movie4.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 8.2,
    ratingKinopoisk: 8.0,
    ageRestriction: 16,
    genre: { uz: ["Anime", "Jangari", "Fantastika"], ru: ["Аниме", "Боевик", "Фэнтези"] },
    description: {
      uz: {
        text: "Tanjiro va do'stlari Mugen poyezdda Yuqori Demon bilan jang qiladi.",
        year: 2020,
        country: "Yaponiya",
        duration: 117,
        genre: ["Anime", "Jangari", "Fantastika"],
        director: "Haruo Sotozaki"
      },
      ru: {
        text: "Тандзиро и друзья сражаются с Верхним Демоном в поезде Муген.",
        year: 2020,
        country: "Япония",
        duration: 117,
        genre: ["Аниме", "Боевик", "Фэнтези"],
        director: "Харуо Сотодзаки"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Demon Qotar - Treyler", ru: "Истребитель демонов - Трейлер" }, like: '4500', dislike: '55', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "action", "fantasy"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Jangari"],
    like: '7800',
    dislike: '',
    specs: { duration: 117, ageRating: "16+", year: 2020, countries: ["Japan"], languages: ["jpn"] }
  },
  {
    id: 10004,
    title: { uz: "Howlning Qo'rg'oshin Qal'asi", ru: "Ходячий замок" },
    homeImg: { uz: "/img/movie6.jpg", ru: "/img/movie6.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 8.2,
    ratingKinopoisk: 8.1,
    ageRestriction: 6,
    genre: { uz: ["Anime", "Fantastika", "Romantik"], ru: ["Аниме", "Фэнтези", "Романтика"] },
    description: {
      uz: {
        text: "Sophie sehrgar tomonidan keksa ayolga aylantiriladi — Howl bilan uchrashadi va sehrli qal'ada yashaydi.",
        year: 2004,
        country: "Yaponiya",
        duration: 119,
        genre: ["Anime", "Fantastika", "Romantik"],
        director: "Hayao Miyazaki"
      },
      ru: {
        text: "Софи колдуньей превращена в старуху — встречает Хаула и живёт в волшебном замке.",
        year: 2004,
        country: "Япония",
        duration: 119,
        genre: ["Аниме", "Фэнтези", "Романтика"],
        director: "Хаяо Миядзаки"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Howl Qal'asi - Treyler", ru: "Ходячий замок - Трейлер" }, like: '4100', dislike: '38', typeTrailers: "animation" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "fantasy", "romance"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Fantastika"],
    like: '6200',
    dislike: '',
    specs: { duration: 119, ageRating: "6+", year: 2004, countries: ["Japan"], languages: ["jpn"] }
  },
  {
    id: 10005,
    title: { uz: "Spy x Family Code: White", ru: "Шпион × Семья Код: Белый" },
    homeImg: { uz: "/img/movie8.jpg", ru: "/img/movie8.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.7,
    ratingImdb: 7.5,
    ratingKinopoisk: 7.4,
    ageRestriction: 12,
    genre: { uz: ["Anime", "Komediya", "Jangari"], ru: ["Аниме", "Комедия", "Боевик"] },
    description: {
      uz: {
        text: "Forger oilasi dam olish uchun sayohatga chiqadi — lekin maxfiy vazifa ularni kutadi.",
        year: 2023,
        country: "Yaponiya",
        duration: 110,
        genre: ["Anime", "Komediya", "Jangari"],
        director: "Takashi Katagiri"
      },
      ru: {
        text: "Семья Форджер отправляется в отпуск — но секретная миссия ждёт их.",
        year: 2023,
        country: "Япония",
        duration: 110,
        genre: ["Аниме", "Комедия", "Боевик"],
        director: "Такаси Катагири"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Spy x Family - Treyler", ru: "Шпион × Семья - Трейлер" }, like: '3200', dislike: '48', typeTrailers: "comedy" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "comedy", "action"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Komediya"],
    like: '5500',
    dislike: '',
    specs: { duration: 110, ageRating: "12+", year: 2023, countries: ["Japan"], languages: ["jpn"] }
  },
  {
    id: 10006,
    title: { uz: "Jodugar Qiz", ru: "Ведьмина служба доставки" },
    homeImg: { uz: "/img/movie12.jpg", ru: "/img/movie12.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 7.8,
    ratingKinopoisk: 7.7,
    ageRestriction: 0,
    genre: { uz: ["Anime", "Sarguzasht", "Oilaviy"], ru: ["Аниме", "Приключения", "Семейный"] },
    description: {
      uz: {
        text: "Kiki — 13 yoshli jodugar qiz. U supurgi bilan uchib, yangi shaharda yetakchilik qilishni o'rganadi.",
        year: 1989,
        country: "Yaponiya",
        duration: 103,
        genre: ["Anime", "Sarguzasht", "Oilaviy"],
        director: "Hayao Miyazaki"
      },
      ru: {
        text: "Кики — 13-летняя ведьма. Она летает на метле и учится самостоятельности в новом городе.",
        year: 1989,
        country: "Япония",
        duration: 103,
        genre: ["Аниме", "Приключения", "Семейный"],
        director: "Хаяо Миядзаки"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Jodugar Qiz - Treyler", ru: "Ведьмина служба - Трейлер" }, like: '3800', dislike: '32', typeTrailers: "animation" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "adventure", "animation"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Sarguzasht", "Oilaviy"],
    like: '5900',
    dislike: '',
    specs: { duration: 103, ageRating: "0+", year: 1989, countries: ["Japan"], languages: ["jpn"] }
  },
  {
    id: 10007,
    title: { uz: "Spy x Family Code: White", ru: "Шпион × Семья Код: Белый" },
    homeImg: { uz: "/img/movie8.jpg", ru: "/img/movie8.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.7,
    ratingImdb: 7.5,
    ratingKinopoisk: 7.4,
    ageRestriction: 12,
    genre: { uz: ["Anime", "Komediya", "Jangari"], ru: ["Аниме", "Комедия", "Боевик"] },
    description: {
      uz: {
        text: "Forger oilasi dam olish uchun sayohatga chiqadi — lekin maxfiy vazifa ularni kutadi.",
        year: 2023,
        country: "Yaponiya",
        duration: 110,
        genre: ["Anime", "Komediya", "Jangari"],
        director: "Takashi Katagiri"
      },
      ru: {
        text: "Семья Форджер отправляется в отпуск — но секретная миссия ждёт их.",
        year: 2023,
        country: "Япония",
        duration: 110,
        genre: ["Аниме", "Комедия", "Боевик"],
        director: "Такаси Катагири"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Spy x Family - Treyler", ru: "Шпион × Семья - Трейлер" }, like: '3200', dislike: '48', typeTrailers: "comedy" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "anime",
    typeCategory: ["anime", "comedy", "action"],
    filterCountry: "Japan",
    filterGenre: ["Anime", "Komediya"],
    like: '5500',
    dislike: '',
    specs: { duration: 110, ageRating: "12+", year: 2023, countries: ["Japan"], languages: ["jpn"] }
  },
];
