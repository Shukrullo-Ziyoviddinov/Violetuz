export const russianMovies = [
  {
    id: 6001,
    title: { uz: "Aka", ru: "Брат" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 7.9,
    ratingKinopoisk: 8.2,
    ageRestriction: 16,
    genre: { uz: ["Jangari", "Drama", "Kriminal"], ru: ["Боевик", "Драма", "Криминал"] },
    description: {
      uz: {
        text: "Demobilizatsiya qilingan Danila Sankt-Peterburgda akasi bilan uchrashadi va jinoyat dunyosiga kirib ketadi.",
        year: 1997,
        country: "Rossiya",
        duration: 100,
        genre: ["Jangari", "Drama", "Kriminal"],
        director: "Aleksey Balabanov"
      },
      ru: {
        text: "Демобилизованный Данила приезжает к брату в Санкт-Петербург и попадает в криминальный мир.",
        year: 1997,
        country: "Россия",
        duration: 100,
        genre: ["Боевик", "Драма", "Криминал"],
        director: "Алексей Балабанов"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Aka - Treyler", ru: "Брат - Трейлер" }, like: '4500', dislike: '85', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Jangari",
    typeCategory: ["action", "drama", "russianMovies", "crime"],
    filterCountry: "Russia",
    filterGenre: ["Jangari", "Drama"],
    like: '6200',
    dislike: '',
    specs: { duration: 100, ageRating: "16+", year: 1997, countries: ["Russia"], languages: ["rus"] }
  },
  {
    id: 6002,
    title: { uz: "Leviathan", ru: "Левиафан" },
    homeImg: { uz: "/img/movie2.jpg", ru: "/img/movie2.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.7,
    ratingImdb: 7.6,
    ratingKinopoisk: 7.0,
    ageRestriction: 18,
    genre: { uz: ["Drama"], ru: ["Драма"] },
    description: {
      uz: {
        text: "Shimoliy Rossiyada baliqchi Nikolay uyini yo'qotish xavfi ostida — korruptsiya va hokimiyat haqida.",
        year: 2014,
        country: "Rossiya",
        duration: 141,
        genre: ["Drama"],
        director: "Andrey Zvyagintsev"
      },
      ru: {
        text: "Рыбак Николай на севере России рискует потерять дом — о коррупции и власти.",
        year: 2014,
        country: "Россия",
        duration: 141,
        genre: ["Драма"],
        director: "Андрей Звягинцев"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Leviathan - Treyler", ru: "Левиафан - Трейлер" }, like: '2100', dislike: '45', typeTrailers: "drama" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["drama", "russianMovies"],
    filterCountry: "Russia",
    filterGenre: ["Drama"],
    like: '2850',
    dislike: '',
    specs: { duration: 141, ageRating: "18+", year: 2014, countries: ["Russia"], languages: ["rus"] }
  },
  {
    id: 6003,
    title: { uz: "Yuqoriga Harakat", ru: "Движение вверх" },
    homeImg: { uz: "/img/movie4.jpg", ru: "/img/movie4.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 7.2,
    ratingKinopoisk: 7.0,
    ageRestriction: 12,
    genre: { uz: ["Sport", "Drama", "Oilaviy"], ru: ["Спорт", "Драма", "Семейный"] },
    description: {
      uz: {
        text: "1972-yilgi Olimpiada — SSSR basketbol jamoasi AQShni mag'lub etadi. Sport tarixidagi epik voqea.",
        year: 2017,
        country: "Rossiya",
        duration: 133,
        genre: ["Sport", "Drama", "Oilaviy"],
        director: "Anton Megerdichev"
      },
      ru: {
        text: "Олимпиада 1972 — сборная СССР по баскетболу побеждает США. Эпическое событие в истории спорта.",
        year: 2017,
        country: "Россия",
        duration: 133,
        genre: ["Спорт", "Драма", "Семейный"],
        director: "Антон Мегердичев"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Yuqoriga Harakat - Treyler", ru: "Движение вверх - Трейлер" }, like: '3800', dislike: '52', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["action", "drama", "russianMovies", "sport"],
    filterCountry: "Russia",
    filterGenre: ["Drama", "Sport", "Oilaviy"],
    like: '5200',
    dislike: '',
    specs: { duration: 133, ageRating: "12+", year: 2017, countries: ["Russia"], languages: ["rus"] }
  },
  {
    id: 6004,
    title: { uz: "Moskva Yig'lamaydi", ru: "Москва слезам не верит" },
    homeImg: { uz: "/img/movie6.jpg", ru: "/img/movie6.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 8.2,
    ratingKinopoisk: 8.0,
    ageRestriction: 12,
    genre: { uz: ["Drama", "Romantik", "Komediya"], ru: ["Драма", "Романтика", "Комедия"] },
    description: {
      uz: {
        text: "1950-yillarda Moskvaga kelgan uch qizning hayoti va sevgisi haqida klassik sovet filmi.",
        year: 1979,
        country: "SSSR",
        duration: 150,
        genre: ["Drama", "Romantik", "Komediya"],
        director: "Vladimir Menshov"
      },
      ru: {
        text: "Классическая советская картина о жизни и любви трёх девушек, приехавших в Москву в 1950-х.",
        year: 1979,
        country: "СССР",
        duration: 150,
        genre: ["Драма", "Романтика", "Комедия"],
        director: "Владимир Меньшов"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Moskva Yig'lamaydi - Treyler", ru: "Москва слезам не верит - Трейлер" }, like: '2900', dislike: '28', typeTrailers: "romance" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Romantika",
    typeCategory: ["drama", "romance", "russianMovies", "comedy"],
    filterCountry: "Russia",
    filterGenre: ["Drama", "Romantik"],
    like: '4100',
    dislike: '',
    specs: { duration: 150, ageRating: "12+", year: 1979, countries: ["Russia"], languages: ["rus"] }
  },
  {
    id: 6005,
    title: { uz: "Taqdirning Ironiyasi", ru: "Ирония судьбы" },
    homeImg: { uz: "/img/movie8.jpg", ru: "/img/movie8.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 8.1,
    ratingKinopoisk: 8.2,
    ageRestriction: 12,
    genre: { uz: ["Romantik", "Komediya", "Drama"], ru: ["Романтика", "Комедия", "Драма"] },
    description: {
      uz: {
        text: "Yangiy yil oldi sog'inganda do'stlar bilan hammomda bo'lgan Zhenya noto'g'ri uyga oqib ketadi.",
        year: 1975,
        country: "SSSR",
        duration: 184,
        genre: ["Romantik", "Komediya", "Drama"],
        director: "Eldar Ryazanov"
      },
      ru: {
        text: "В канун Нового года Женя по ошибке попадает в чужую квартиру после бани с друзьями.",
        year: 1975,
        country: "СССР",
        duration: 184,
        genre: ["Романтика", "Комедия", "Драма"],
        director: "Эльдар Рязанов"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Taqdirning Ironiyasi - Treyler", ru: "Ирония судьбы - Трейлер" }, like: '4500', dislike: '35', typeTrailers: "romance" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Komediya",
    typeCategory: ["romance", "comedy", "russianMovies", "drama"],
    filterCountry: "Russia",
    filterGenre: ["Romantik", "Komediya"],
    like: '5800',
    dislike: '',
    specs: { duration: 184, ageRating: "12+", year: 1975, countries: ["Russia"], languages: ["rus"] }
  },
  {
    id: 6006,
    title: { uz: "T-34", ru: "Т-34" },
    homeImg: { uz: "/img/movie12.jpg", ru: "/img/movie12.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 6.9,
    ratingKinopoisk: 7.2,
    ageRestriction: 16,
    genre: { uz: ["Jangari", "Drama", "Tarixiy"], ru: ["Боевик", "Драма", "Исторический"] },
    description: {
      uz: {
        text: "1941-yil — yosh tankchi Nikolay qo'lga olinadi, lekin qochish rejasini tuzadi: T-34 tankida.",
        year: 2018,
        country: "Rossiya",
        duration: 139,
        genre: ["Jangari", "Drama", "Tarixiy"],
        director: "Aleksey Sidorov"
      },
      ru: {
        text: "1941 год — молодой танкист Николай попадает в плен, но строит план побега на танке Т-34.",
        year: 2018,
        country: "Россия",
        duration: 139,
        genre: ["Боевик", "Драма", "Исторический"],
        director: "Алексей Сидоров"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "T-34 - Treyler", ru: "Т-34 - Трейлер" }, like: '3200', dislike: '68', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Jangari",
    typeCategory: ["action", "drama", "russianMovies", "historical"],
    filterCountry: "Russia",
    filterGenre: ["Jangari", "Drama"],
    like: '3950',
    dislike: '',
    specs: { duration: 139, ageRating: "16+", year: 2018, countries: ["Russia"], languages: ["rus"] }
  },
  {
    id: 6007,
    title: { uz: "Aka", ru: "Брат" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 7.9,
    ratingKinopoisk: 8.2,
    ageRestriction: 16,
    genre: { uz: ["Jangari", "Drama", "Kriminal"], ru: ["Боевик", "Драма", "Криминал"] },
    description: {
      uz: {
        text: "Demobilizatsiya qilingan Danila Sankt-Peterburgda akasi bilan uchrashadi va jinoyat dunyosiga kirib ketadi.",
        year: 1997,
        country: "Rossiya",
        duration: 100,
        genre: ["Jangari", "Drama", "Kriminal"],
        director: "Aleksey Balabanov"
      },
      ru: {
        text: "Демобилизованный Данила приезжает к брату в Санкт-Петербург и попадает в криминальный мир.",
        year: 1997,
        country: "Россия",
        duration: 100,
        genre: ["Боевик", "Драма", "Криминал"],
        director: "Алексей Балабанов"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Aka - Treyler", ru: "Брат - Трейлер" }, like: '4500', dislike: '85', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Jangari",
    typeCategory: ["action", "drama", "russianMovies", "crime"],
    filterCountry: "Russia",
    filterGenre: ["Jangari", "Drama"],
    like: '6200',
    dislike: '',
    specs: { duration: 100, ageRating: "16+", year: 1997, countries: ["Russia"], languages: ["rus"] }
  },
];
