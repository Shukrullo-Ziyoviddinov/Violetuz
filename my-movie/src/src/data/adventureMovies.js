export const adventureMovies = [
  {
    id: 11001,
    title: { uz: "Indiana Jones va Taqdir Diali", ru: "Индиана Джонс и Колесо судьбы" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 6.7,
    ratingKinopoisk: 6.5,
    ageRestriction: 12,
    genre: { uz: ["Sarguzasht", "Jangari", "Fantastika"], ru: ["Приключения", "Боевик", "Фэнтези"] },
    description: {
      uz: {
        text: "Indiana Jones so'nggi sarguzashtida — vaqtni orqaga qaytarish qudratiga ega bo'lgan artefaktni qidirmoqda.",
        year: 2023,
        country: "AQSh",
        duration: 154,
        genre: ["Sarguzasht", "Jangari", "Fantastika"],
        director: "James Mangold"
      },
      ru: {
        text: "Индиана Джонс в последнем приключении — ищет артефакт, способный повернуть время вспять.",
        year: 2023,
        country: "США",
        duration: 154,
        genre: ["Приключения", "Боевик", "Фэнтези"],
        director: "Джеймс Мэнголд"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Indiana Jones - Treyler", ru: "Индиана Джонс - Трейлер" }, like: '2850', dislike: '58', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "action", "adventureMovies"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Jangari"],
    like: '4200',
    dislike: '',
    specs: { duration: 154, ageRating: "12+", year: 2023, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 11002,
    title: { uz: "Uncharted", ru: "Анчартед: На картах не значится" },
    homeImg: { uz: "/img/movie2.jpg", ru: "/img/movie2.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.3,
    ratingKinopoisk: 6.4,
    ageRestriction: 12,
    genre: { uz: ["Sarguzasht", "Jangari"], ru: ["Приключения", "Боевик"] },
    description: {
      uz: {
        text: "Nathan Drake va Victor Sullivan Magellanning yo'qolgan oltinini qidirishda — xavfli sarguzasht.",
        year: 2022,
        country: "AQSh",
        duration: 116,
        genre: ["Sarguzasht", "Jangari"],
        director: "Ruben Fleischer"
      },
      ru: {
        text: "Нейтан Дрейк и Виктор Салливан в поисках потерянного золота Магеллана — опасное приключение.",
        year: 2022,
        country: "США",
        duration: 116,
        genre: ["Приключения", "Боевик"],
        director: "Рубен Фляйшер"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Uncharted - Treyler", ru: "Анчартед - Трейлер" }, like: '2100', dislike: '72', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "action", "adventureMovies"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Jangari"],
    like: '3650',
    dislike: '',
    specs: { duration: 116, ageRating: "12+", year: 2022, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 11003,
    title: { uz: "Jungle Cruise", ru: "Джунгли" },
    homeImg: { uz: "/img/movie4.jpg", ru: "/img/movie4.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.6,
    ratingKinopoisk: 6.5,
    ageRestriction: 12,
    genre: { uz: ["Sarguzasht", "Komediya", "Fantastika"], ru: ["Приключения", "Комедия", "Фэнтези"] },
    description: {
      uz: {
        text: "Doktor Lily Houghton va Frank Amazon daryosida sehrli daraxtni qidirishda.",
        year: 2021,
        country: "AQSh",
        duration: 127,
        genre: ["Sarguzasht", "Komediya", "Fantastika"],
        director: "Jaume Collet-Serra"
      },
      ru: {
        text: "Доктор Лилли Хоутон и Фрэнк в поисках волшебного дерева на реке Амазонка.",
        year: 2021,
        country: "США",
        duration: 127,
        genre: ["Приключения", "Комедия", "Фэнтези"],
        director: "Жауме Колет-Серра"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Jungle Cruise - Treyler", ru: "Джунгли - Трейлер" }, like: '1950', dislike: '45', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "comedy", "adventureMovies"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Komediya"],
    like: '3100',
    dislike: '',
    specs: { duration: 127, ageRating: "12+", year: 2021, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 11004,
    title: { uz: "Jumanji: Keyingi Daraja", ru: "Джуманджи: Новый уровень" },
    homeImg: { uz: "/img/movie6.jpg", ru: "/img/movie6.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 6.7,
    ratingKinopoisk: 6.6,
    ageRestriction: 12,
    genre: { uz: ["Sarguzasht", "Komediya", "Fantastika"], ru: ["Приключения", "Комедия", "Фэнтези"] },
    description: {
      uz: {
        text: "To'rt do'st yana Jumanji o'yiniga kirib ketadi — lekin bu safar qoidalar o'zgargan.",
        year: 2019,
        country: "AQSh",
        duration: 123,
        genre: ["Sarguzasht", "Komediya", "Fantastika"],
        director: "Jake Kasdan"
      },
      ru: {
        text: "Четверо друзей снова попадают в игру Джуманджи — но на этот раз правила изменились.",
        year: 2019,
        country: "США",
        duration: 123,
        genre: ["Приключения", "Комедия", "Фэнтези"],
        director: "Джейк Кэздан"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Jumanji - Treyler", ru: "Джуманджи - Трейлер" }, like: '2450', dislike: '62', typeTrailers: "comedy" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "comedy", "adventureMovies"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Komediya"],
    like: '4800',
    dislike: '',
    specs: { duration: 123, ageRating: "12+", year: 2019, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 11005,
    title: { uz: "Tomb Raider", ru: "Томб Райдер" },
    homeImg: { uz: "/img/movie8.jpg", ru: "/img/movie8.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.3,
    ratingKinopoisk: 6.2,
    ageRestriction: 16,
    genre: { uz: ["Sarguzasht", "Jangari"], ru: ["Приключения", "Боевик"] },
    description: {
      uz: {
        text: "Lara Croft otasining yo'qolganini topish uchun xavfli orolga yo'l oladi.",
        year: 2018,
        country: "AQSh",
        duration: 118,
        genre: ["Sarguzasht", "Jangari", "Oilaviy"],
        director: "Roar Uthaug"
      },
      ru: {
        text: "Лара Крофт отправляется на опасный остров в поисках пропавшего отца.",
        year: 2018,
        country: "США",
        duration: 118,
        genre: ["Приключения", "Боевик"],
        director: "Роар Утго"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Tomb Raider - Treyler", ru: "Томб Райдер - Трейлер" }, like: '1680', dislike: '55', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "action", "adventureMovies"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Jangari", "Oilaviy"],
    like: '2950',
    dislike: '',
    specs: { duration: 118, ageRating: "16+", year: 2018, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 11006,
    title: { uz: "The Lost City", ru: "Затерянный город" },
    homeImg: { uz: "/img/movie12.jpg", ru: "/img/movie12.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 6.5,
    ratingKinopoisk: 6.4,
    ageRestriction: 12,
    genre: { uz: ["Sarguzasht", "Komediya", "Romantik"], ru: ["Приключения", "Комедия", "Романтика"] },
    description: {
      uz: {
        text: "Yozuvchi Loretta Sage o'g'irlanadi — model Alan qutqarish uchun yo'l oladi.",
        year: 2022,
        country: "AQSh",
        duration: 112,
        genre: ["Sarguzasht", "Komediya", "Romantik"],
        director: "Aaron Nee"
      },
      ru: {
        text: "Писательницу Лоретту Сейдж похищают — модель Алан отправляется на спасение.",
        year: 2022,
        country: "США",
        duration: 112,
        genre: ["Приключения", "Комедия", "Романтика"],
        director: "Аарон Ни"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "The Lost City - Treyler", ru: "Затерянный город - Трейлер" }, like: '2200', dislike: '48', typeTrailers: "comedy" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "comedy", "adventureMovies", "romance"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Komediya"],
    like: '3550',
    dislike: '',
    specs: { duration: 112, ageRating: "12+", year: 2022, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 11007,
    title: { uz: "Uncharted", ru: "Анчартед: На картах не значится" },
    homeImg: { uz: "/img/movie2.jpg", ru: "/img/movie2.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.3,
    ratingKinopoisk: 6.4,
    ageRestriction: 12,
    genre: { uz: ["Sarguzasht", "Jangari"], ru: ["Приключения", "Боевик"] },
    description: {
      uz: {
        text: "Nathan Drake va Victor Sullivan Magellanning yo'qolgan oltinini qidirishda — xavfli sarguzasht.",
        year: 2022,
        country: "AQSh",
        duration: 116,
        genre: ["Sarguzasht", "Jangari"],
        director: "Ruben Fleischer"
      },
      ru: {
        text: "Нейтан Дрейк и Виктор Салливан в поисках потерянного золота Магеллана — опасное приключение.",
        year: 2022,
        country: "США",
        duration: 116,
        genre: ["Приключения", "Боевик"],
        director: "Рубен Фляйшер"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Uncharted - Treyler", ru: "Анчартед - Трейлер" }, like: '2100', dislike: '72', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Sarguzasht",
    typeCategory: ["adventure", "action", "adventureMovies"],
    filterCountry: "USA",
    filterGenre: ["Sarguzasht", "Jangari"],
    like: '3650',
    dislike: '',
    specs: { duration: 116, ageRating: "12+", year: 2022, countries: ["USA"], languages: ["eng"] }
  },
];
