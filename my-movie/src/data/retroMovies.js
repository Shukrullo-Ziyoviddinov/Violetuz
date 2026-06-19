export const retroMovies = [
  {
    id: 13001,
    categoryName: "retroMovies",
    title: { uz: "Godfather", ru: "Крёстный отец" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 9.2,
    ratingKinopoisk: 8.9,
    ageRestriction: 18,
    genre: { uz: ["Drama", "Kriminal"], ru: ["Драма", "Криминал"] },
    description: {
      uz: {
        text: "Don Vito Corleone va uning oilasi — mafiya dunyosi va hokimiyat. Kino tarixidagi eng buyuk film.",
        year: 1972,
        country: "AQSh",
        duration: 175,
        genre: ["Drama", "Kriminal"],
        director: "Francis Ford Coppola"
      },
      ru: {
        text: "Дон Вито Корлеоне и его семья — мир мафии и власти. Один из величайших фильмов в истории кино.",
        year: 1972,
        country: "США",
        duration: 175,
        genre: ["Драма", "Криминал"],
        director: "Фрэнсис Форд Коппола"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Godfather - Treyler", ru: "Крёстный отец - Трейлер" }, like: '9200', dislike: '85', typeTrailers: "drama" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["drama", "retroMovies", "crime"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Kriminal"],
    like: '15800',
    dislike: '',
    specs: { duration: 175, ageRating: "18+", year: 1972, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 13002,
    categoryName: "retroMovies",
    title: { uz: "Back to the Future", ru: "Назад в будущее" },
    homeImg: { uz: "/img/movie2.jpg", ru: "/img/movie2.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.4,
    ageRestriction: 12,
    genre: { uz: ["Fantastika", "Komediya", "Sarguzasht"], ru: ["Фантастика", "Комедия", "Приключения"] },
    description: {
      uz: {
        text: "Marty McFly va Doc Brown vaqt mashinasida — 1985 dan 1955 ga sayohat.",
        year: 1985,
        country: "AQSh",
        duration: 116,
        genre: ["Fantastika", "Komediya", "Sarguzasht"],
        director: "Robert Zemeckis"
      },
      ru: {
        text: "Марти МакФлай и Док Браун на машине времени — путешествие из 1985 в 1955.",
        year: 1985,
        country: "США",
        duration: 116,
        genre: ["Фантастика", "Комедия", "Приключения"],
        director: "Роберт Земекис"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Back to the Future - Treyler", ru: "Назад в будущее - Трейлер" }, like: '6800', dislike: '42', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Fantastika",
    typeCategory: ["scifi", "comedy", "retroMovies"],
    filterCountry: "USA",
    filterGenre: ["Fantastika", "Komediya"],
    like: '11200',
    dislike: '',
    specs: { duration: 116, ageRating: "12+", year: 1985, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 13003,
    categoryName: "retroMovies",
    title: { uz: "E.T. - O'zga Sayyoralik", ru: "Инопланетянин" },
    homeImg: { uz: "/img/movie4.jpg", ru: "/img/movie4.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 7.9,
    ratingKinopoisk: 7.8,
    ageRestriction: 0,
    genre: { uz: ["Fantastika", "Oilaviy", "Sarguzasht"], ru: ["Фантастика", "Семейный", "Приключения"] },
    description: {
      uz: {
        text: "Elliott va E.T. — bolalar va sayyoralik o'rtasidagi do'stlik. Steven Spielberg klassikasi.",
        year: 1982,
        country: "AQSh",
        duration: 115,
        genre: ["Fantastika", "Oilaviy", "Sarguzasht"],
        director: "Steven Spielberg"
      },
      ru: {
        text: "Эллиотт и Э.Т. — дружба между ребёнком и инопланетянином. Классика Стивена Спилберга.",
        year: 1982,
        country: "США",
        duration: 115,
        genre: ["Фантастика", "Семейный", "Приключения"],
        director: "Стивен Спилберг"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "E.T. - Treyler", ru: "Инопланетянин - Трейлер" }, like: '5200', dislike: '38', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Fantastika",
    typeCategory: ["scifi", "retroMovies", "adventure"],
    filterCountry: "USA",
    filterGenre: ["Fantastika", "Oilaviy"],
    like: '8500',
    dislike: '',
    specs: { duration: 115, ageRating: "0+", year: 1982, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 13004,
    categoryName: "retroMovies",
    title: { uz: "Terminator", ru: "Терминатор" },
    homeImg: { uz: "/img/movie6.jpg", ru: "/img/movie6.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 8.0,
    ratingKinopoisk: 7.9,
    ageRestriction: 18,
    genre: { uz: ["Fantastika", "Jangari", "Triller"], ru: ["Фантастика", "Боевик", "Триллер"] },
    description: {
      uz: {
        text: "Kelajakdan robot qotil — Sarah Connorni o'ldirish uchun yuborilgan. Arnold Schwarzenegger.",
        year: 1984,
        country: "AQSh",
        duration: 107,
        genre: ["Fantastika", "Jangari", "Triller"],
        director: "James Cameron"
      },
      ru: {
        text: "Робот-убийца из будущего — послан убить Сару Коннор. Арнольд Шварценеггер.",
        year: 1984,
        country: "США",
        duration: 107,
        genre: ["Фантастика", "Боевик", "Триллер"],
        director: "Джеймс Кэмерон"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Terminator - Treyler", ru: "Терминатор - Трейлер" }, like: '7500', dislike: '62', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Fantastika",
    typeCategory: ["scifi", "action", "retroMovies"],
    filterCountry: "USA",
    filterGenre: ["Fantastika", "Jangari"],
    like: '9800',
    dislike: '',
    specs: { duration: 107, ageRating: "18+", year: 1984, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 13005,
    categoryName: "retroMovies",
    title: { uz: "Dirty Dancing", ru: "Грязные танцы" },
    homeImg: { uz: "/img/movie8.jpg", ru: "/img/movie8.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.7,
    ratingImdb: 7.0,
    ratingKinopoisk: 7.2,
    ageRestriction: 16,
    genre: { uz: ["Romantik", "Drama", "Musiqiy"], ru: ["Романтика", "Драма", "Мюзикл"] },
    description: {
      uz: {
        text: "Baby va Johnny — kurortda raqs va sevgi. 1980-yillarning ikonik romantik filmi.",
        year: 1987,
        country: "AQSh",
        duration: 100,
        genre: ["Romantik", "Drama", "Musiqiy"],
        director: "Emile Ardolino"
      },
      ru: {
        text: "Бэби и Джонни — танец и любовь на курорте. Иконический романтический фильм 80-х.",
        year: 1987,
        country: "США",
        duration: 100,
        genre: ["Романтика", "Драма", "Мюзикл"],
        director: "Эмиль Ардолино"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Dirty Dancing - Treyler", ru: "Грязные танцы - Трейлер" }, like: '4200', dislike: '55', typeTrailers: "romance" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Romantika",
    typeCategory: ["romance", "drama", "retroMovies"],
    filterCountry: "USA",
    filterGenre: ["Romantik", "Drama"],
    like: '7200',
    dislike: '',
    specs: { duration: 100, ageRating: "16+", year: 1987, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 13006,
    categoryName: "retroMovies",
    title: { uz: "The Shawshank Redemption", ru: "Побег из Шоушенка" },
    homeImg: { uz: "/img/movie12.jpg", ru: "/img/movie12.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 9.3,
    ratingKinopoisk: 9.1,
    ageRestriction: 16,
    genre: { uz: ["Drama"], ru: ["Драма"] },
    description: {
      uz: {
        text: "Andy Dufresne noto'g'ri qamoqqa tushadi — umid va ozodlik haqida. Eng yuqori reytingli film.",
        year: 1994,
        country: "AQSh",
        duration: 142,
        genre: ["Drama"],
        director: "Frank Darabont"
      },
      ru: {
        text: "Энди Дюфрейн несправедливо попадает в тюрьму — о надежде и свободе. Фильм с высшим рейтингом.",
        year: 1994,
        country: "США",
        duration: 142,
        genre: ["Драма"],
        director: "Фрэнк Дарабонт"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Shawshank - Treyler", ru: "Побег из Шоушенка - Трейлер" }, like: '8500', dislike: '28', typeTrailers: "drama" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["drama", "retroMovies"],
    filterCountry: "USA",
    filterGenre: ["Drama"],
    like: '14200',
    dislike: '',
    specs: { duration: 142, ageRating: "16+", year: 1994, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 13001,
    categoryName: "retroMovies",
    title: { uz: "Godfather", ru: "Крёстный отец" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.9,
    ratingImdb: 9.2,
    ratingKinopoisk: 8.9,
    ageRestriction: 18,
    genre: { uz: ["Drama", "Kriminal"], ru: ["Драма", "Криминал"] },
    description: {
      uz: {
        text: "Don Vito Corleone va uning oilasi — mafiya dunyosi va hokimiyat. Kino tarixidagi eng buyuk film.",
        year: 1972,
        country: "AQSh",
        duration: 175,
        genre: ["Drama", "Kriminal"],
        director: "Francis Ford Coppola"
      },
      ru: {
        text: "Дон Вито Корлеоне и его семья — мир мафии и власти. Один из величайших фильмов в истории кино.",
        year: 1972,
        country: "США",
        duration: 175,
        genre: ["Драма", "Криминал"],
        director: "Фрэнсис Форд Коппола"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Godfather - Treyler", ru: "Крёстный отец - Трейлер" }, like: '9200', dislike: '85', typeTrailers: "drama" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["drama", "retroMovies", "crime"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Kriminal"],
    like: '15800',
    dislike: '',
    specs: { duration: 175, ageRating: "18+", year: 1972, countries: ["USA"], languages: ["eng"] }
  },
];
