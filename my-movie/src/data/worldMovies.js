export const worldMovies = [
  {
    id: 3001,
    categoryName: "worldMovies",
    title: { uz: "Rahmat", ru: "Милосердие" },
    homeImg: { uz: "/img/movie1.jpg", ru: "/img/movie1.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 7.2,
    ratingKinopoisk: 7.0,
    ageRestriction: 13,
    genre: { uz: ["Fantastika", "Jangari", "Triller"], ru: ["Фантастика", "Боевик", "Триллер"] },
    description: {
      uz: {
        text: "Sun'iy intellekt hakamiga o'z begunohligingizni isbotlashingiz yoki qatl etilishingiz kerak.",
        year: 2025,
        country: "AQSh",
        duration: 115,
        genre: ["Fantastika", "Jangari", "Triller"],
        director: "Turli"
      },
      ru: {
        text: "Докажите свою невиновность ИИ-судье или столкнётесь с казнью.",
        year: 2025,
        country: "США",
        duration: 115,
        genre: ["Фантастика", "Боевик", "Триллер"],
        director: "Разные"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Rahmat - Treyler", ru: "Милосердие - Трейлер" }, like: '450', dislike: '12', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Fantastika",
    typeCategory: ["action", "scifi", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Fantastika", "Jangari"],
    like: '520',
    dislike: '',
    specs: { duration: 115, ageRating: "13+", year: 2025, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3002,
    categoryName: "worldMovies",
    title: { uz: "Annaatthe", ru: "Аннаатхе" },
    homeImg: { uz: "/img/movie4.jpg", ru: "/img/movie4.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.8,
    ratingKinopoisk: 6.5,
    ageRestriction: 16,
    genre: { uz: ["Jangari", "Drama", "Oilaviy"], ru: ["Боевик", "Драма", "Семейный"] },
    description: {
      uz: {
        text: "Hindistonning afsonaviy aktyori Rajinikanth bosh rollarda — oila va sadoqat haqida epik hikoya.",
        year: 2021,
        country: "Hindiston",
        duration: 178,
        genre: ["Jangari", "Drama", "Oilaviy"],
        director: "Siva"
      },
      ru: {
        text: "Легендарный индийский актёр Раджиникант в эпической истории о семье и преданности.",
        year: 2021,
        country: "Индия",
        duration: 178,
        genre: ["Боевик", "Драма", "Семейный"],
        director: "Сива"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Annaatthe - Treyler", ru: "Аннаатхе - Трейлер" }, like: '680', dislike: '25', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Jangari",
    typeCategory: ["action", "drama", "worldMovies"],
    filterCountry: "India",
    filterGenre: ["Jangari", "Drama", "Oilaviy"],
    like: '750',
    dislike: '',
    specs: { duration: 178, ageRating: "16+", year: 2021, countries: ["India"], languages: ["tam"] }
  },
  {
    id: 3003,
    categoryName: "worldMovies",
    title: { uz: "55", ru: "55" },
    homeImg: { uz: "/img/movie6.jpg", ru: "/img/movie6.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.4,
    ratingImdb: 6.5,
    ratingKinopoisk: 6.3,
    ageRestriction: 13,
    genre: { uz: ["Drama", "Hayotiy"], ru: ["Драма", "Жизненный"] },
    description: {
      uz: {
        text: "Yoshlar shaharda orzu va qiyinchiliklar orasida o'sishlari haqida hikoya.",
        year: 2024,
        country: "AQSh",
        duration: 95,
        genre: ["Drama", "Hayotiy"],
        director: "Shyam P. Madiraju"
      },
      ru: {
        text: "История о взрослении молодёжи в городе — мечты и трудности.",
        year: 2024,
        country: "США",
        duration: 95,
        genre: ["Драма", "Жизненный"],
        director: "Шьям П. Мадираджу"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "55 - Treyler", ru: "55 - Трейлер" }, like: '320', dislike: '8', typeTrailers: "drama" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["drama", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Drama"],
    like: '380',
    dislike: '',
    specs: { duration: 95, ageRating: "13+", year: 2024, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3004,
    categoryName: "worldMovies",
    title: { uz: "Qichqiriq 7", ru: "Крик 7" },
    homeImg: { uz: "/img/movie8.jpg", ru: "/img/movie8.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.7,
    ratingImdb: 7.5,
    ratingKinopoisk: 7.3,
    ageRestriction: 18,
    genre: { uz: ["Qo'rqinchli", "Triller"], ru: ["Ужасы", "Триллер"] },
    description: {
      uz: {
        text: "Qo'rquv uyga qaytadi — Ghostface qotil yana qurbonlarni ta'qib qiladi.",
        year: 2026,
        country: "AQSh",
        duration: 120,
        genre: ["Qo'rqinchli", "Triller"],
        director: "Kevin Williamson"
      },
      ru: {
        text: "Страх возвращается домой — убийца Ghostface снова преследует жертв.",
        year: 2026,
        country: "США",
        duration: 120,
        genre: ["Ужасы", "Триллер"],
        director: "Кевин Уильямсон"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Qichqiriq 7 - Treyler", ru: "Крик 7 - Трейлер" }, like: '920', dislike: '35', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Horror",
    typeCategory: ["horror", "thriller", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Qo'rqinchli", "Triller"],
    like: '1050',
    dislike: '',
    specs: { duration: 120, ageRating: "18+", year: 2026, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3005,
    categoryName: "worldMovies",
    title: { uz: "GOAT", ru: "GOAT" },
    homeImg: { uz: "/img/movie10.jpg", ru: "/img/movie10.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 7.0,
    ratingKinopoisk: 6.8,
    ageRestriction: 6,
    genre: { uz: ["Animatsiya", "Komediya", "Sport"], ru: ["Анимация", "Комедия", "Спорт"] },
    description: {
      uz: {
        text: "Hech qachon kichik orzularingiz uchun juda kichik emassiz — hayvonlar basketbol jamoasida.",
        year: 2025,
        country: "AQSh",
        duration: 88,
        genre: ["Animatsiya", "Komediya", "Sport"],
        director: "Nick Bruno"
      },
      ru: {
        text: "Вы никогда не слишком малы для больших мечтаний — животные в баскетбольной команде.",
        year: 2025,
        country: "США",
        duration: 88,
        genre: ["Анимация", "Комедия", "Спорт"],
        director: "Ник Бруно"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "GOAT - Treyler", ru: "GOAT - Трейлер" }, like: '580', dislike: '15', typeTrailers: "comedy" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Multfilimlar",
    typeCategory: ["animation", "comedy", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Animatsiya", "Komediya"],
    like: '620',
    dislike: '',
    specs: { duration: 88, ageRating: "6+", year: 2025, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3006,
    categoryName: "worldMovies",
    title: { uz: "Tishsiz 2: Bo'rilar Shahri", ru: "Морда 2: Город волков" },
    homeImg: { uz: "/img/movie18.jpg", ru: "/img/movie18.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.9,
    ratingKinopoisk: 6.7,
    ageRestriction: 16,
    genre: { uz: ["Jangari", "Drama", "Kriminal"], ru: ["Боевик", "Драма", "Криминал"] },
    description: {
      uz: {
        text: "Politsiya iti bilan birga shahardagi jinoyatlarga qarshi kurash.",
        year: 2024,
        country: "AQSh",
        duration: 105,
        genre: ["Jangari", "Drama", "Kriminal"],
        director: "Adam Gierasch"
      },
      ru: {
        text: "Борьба с преступностью в городе вместе с полицейской собакой.",
        year: 2024,
        country: "США",
        duration: 105,
        genre: ["Боевик", "Драма", "Криминал"],
        director: "Адам Гиераш"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Tishsiz 2 - Treyler", ru: "Морда 2 - Трейлер" }, like: '420', dislike: '18', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Jangari",
    typeCategory: ["action", "drama", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Jangari", "Drama"],
    like: '480',
    dislike: '',
    specs: { duration: 105, ageRating: "16+", year: 2024, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3007,
    categoryName: "worldMovies",
    title: { uz: "Yordam Yuboring", ru: "Отправьте помощь" },
    homeImg: { uz: "/img/movie12.jpg", ru: "/img/movie12.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.6,
    ratingImdb: 7.1,
    ratingKinopoisk: 6.9,
    ageRestriction: 18,
    genre: { uz: ["Triller", "Qo'rqinchli"], ru: ["Триллер", "Ужасы"] },
    description: {
      uz: {
        text: "Strategiya va rejalashtirish bo'limidan Linda Liddle — endi u boshliq. Sam Raimi rejissorligi.",
        year: 2025,
        country: "AQSh",
        duration: 98,
        genre: ["Triller", "Qo'rqinchli"],
        director: "Sam Raimi"
      },
      ru: {
        text: "Линда Лиддл из отдела стратегии и планирования — теперь она босс. Режиссёр Сэм Рэйми.",
        year: 2025,
        country: "США",
        duration: 98,
        genre: ["Триллер", "Ужасы"],
        director: "Сэм Рэйми"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Yordam Yuboring - Treyler", ru: "Отправьте помощь - Трейлер" }, like: '550', dislike: '22', typeTrailers: "action" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Horror",
    typeCategory: ["thriller", "horror", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Triller", "Qo'rqinchli"],
    like: '590',
    dislike: '',
    specs: { duration: 98, ageRating: "18+", year: 2025, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3008,
    categoryName: "worldMovies",
    title: { uz: "Hamnet", ru: "Хамнет" },
    homeImg: { uz: "/img/movie13.jpg", ru: "/img/movie13.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.8,
    ratingImdb: 7.8,
    ratingKinopoisk: 7.6,
    ageRestriction: 13,
    genre: { uz: ["Drama", "Romantik", "Tarix"], ru: ["Драма", "Романтика", "История"] },
    description: {
      uz: {
        text: "Yurakni ochiq tuting. Chloé Zhao rejissorligi — Maggie O'Farrell bestselleri asosida.",
        year: 2025,
        country: "AQSh",
        duration: 112,
        genre: ["Drama", "Romantik", "Tarix"],
        director: "Chloé Zhao"
      },
      ru: {
        text: "Держите сердце открытым. Режиссёр Клоэ Чжао — по бестселлеру Мэгги О'Фаррелл.",
        year: 2025,
        country: "США",
        duration: 112,
        genre: ["Драма", "Романтика", "История"],
        director: "Клоэ Чжао"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Hamnet - Treyler", ru: "Хамнет - Трейлер" }, like: '720', dislike: '14', typeTrailers: "romance" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Romantika",
    typeCategory: ["drama", "romance", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Romantik"],
    like: '780',
    dislike: '',
    specs: { duration: 112, ageRating: "13+", year: 2025, countries: ["USA"], languages: ["eng"] }
  },
  {
    id: 3009,
    categoryName: "worldMovies",
    title: { uz: "Mushuklar va Itlar", ru: "Кошки и собаки" },
    homeImg: { uz: "/img/movie16.jpg", ru: "/img/movie16.jpg" },
    movieMedia: {
      uz: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } },
      ru: { video: { type: "video", src: "/video/mainDetailvideo.mp4" } }
    },
    rating: 4.5,
    ratingImdb: 6.5,
    ratingKinopoisk: 6.3,
    ageRestriction: 6,
    genre: { uz: ["Komediya", "Oilaviy", "Animatsiya"], ru: ["Комедия", "Семейный", "Анимация"] },
    description: {
      uz: {
        text: "Ishlar jingalak bo'lishi mumkin! Maxfiy agentlar — itlar va mushuklar urushida.",
        year: 2025,
        country: "AQSh",
        duration: 90,
        genre: ["Komediya", "Oilaviy", "Animatsiya"],
        director: "Sean McNamara"
      },
      ru: {
        text: "Дела могут стать hairy! Секретные агенты — война собак и кошек.",
        year: 2025,
        country: "США",
        duration: 90,
        genre: ["Комедия", "Семейный", "Анимация"],
        director: "Шон Макнамара"
      }
    },
    trailersVideo: [{ id: 1, trailers: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" }, title: { uz: "Asosiy Treyler", ru: "Главный Трейлер" }, text: { uz: "Mushuklar va Itlar - Treyler", ru: "Кошки и собаки - Трейлер" }, like: '410', dislike: '11', typeTrailers: "comedy" }],
    watchVideo: { uz: "/video/video1.mp4", ru: "/video/video1.mp4" },
    seasons: null,
    actors: [1, 3, 2],
    category: "Komediya",
    typeCategory: ["comedy", "animation", "worldMovies"],
    filterCountry: "USA",
    filterGenre: ["Komediya", "Oilaviy"],
    like: '450',
    dislike: '',
    specs: { duration: 90, ageRating: "6+", year: 2025, countries: ["USA"], languages: ["eng"] }
  }
];
