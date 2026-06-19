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
import { anonslar } from './anonslar';

export const movies = [
  {
    id: 1,
    categoryName: "movies",
    title: {
      uz: "Inception",
      ru: "Начало"
    },
    titleImg: {
      uz: "/img/titleimg_preview_rev_1.png",
      ru: "/img/titleimg_preview_rev_1.png"
    },
    homeImg: {
      uz: "/img/movie1.jpg",
      ru: "/img/movie1.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/video4.5.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 4.8,
    ratingImdb: 8.4,
    ratingKinopoisk: 8.2,
    ratingNetflix: 8.7,
    ageRestriction: 16,
    genre: {
      uz: ["Jangari", "Drama", "Triller"],
      ru: ["Боевик", "Драма", "Триллер"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Inception filmining asosiy treyleri",
          ru: "Главный трейлер фильма Начало"
        },
        like: '405',
        dislike: '11',
        typeTrailers: "action"
        
      }
    ],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/rumovie.mp4"
    },
    seasons: [
      {
        seasonNumber: 1,
        title: { uz: "Mavsum 1", ru: "Сезон 1" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },          
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 2,
        title: { uz: "Mavsum 2", ru: "Сезон 2" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 3,
        title: { uz: "Mavsum 3", ru: "Сезон 3" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 4,
        title: { uz: "Mavsum 4", ru: "Сезон 4" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      }

    ],
    actors: [1, 3, 2, 4, 5, 6, 7, 8, 9, 10, 'jah-khalib'],
    category: "Jangari",
    typeCategory: ["action", "drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Jangari", "Drama", "Qo'rqinchli"],
    type: "movie",
    like: '300',
    dislike: '',
    specs: {
      duration: 148,
      ageRating: "16+",
      year: 2010,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    },
    scenes: [
      "/img/movie-4.5-5.jpg",
      "/img/movie-4.5-5.jpg",
      "/img/movie-4.5-9.jpg",
      "/img/movie-4.5-6.avif",
      "/img/movie-4.5-3.jpg"
    ],
    clips: [
      {
        id: 1,
        src: "/video/Lady_Gaga,_Bruno_Mars_Die_With_A_Smile_Official_Music_Video.mp4",
        title: {
          uz: "Die With A Smile — Lady Gaga va Bruno Mars",
          ru: "Die With A Smile — Lady Gaga и Bruno Mars"
        }
      },
      {
        id: 2,
        src: "/video/Zivert - Life   Премьера клипа.mp4",
        title: {
          uz: "Zivert — Life (premyera klip)",
          ru: "Zivert — Life (премьера клипа)"
        }
      },
      {
        id: 3,
        src: "/video/The Amateur _ Official Trailer.mp4",
        title: {
          uz: "The Amateur — rasmiy treyler",
          ru: "The Amateur — официальный трейлер"
        }
      }
    ]
  },
  {
    id: 2,
    categoryName: "movies",
    title: {
      uz: "Qora Ritsar",
      ru: "Темный рыцарь"
    },
    titleImg: {
      uz: "/img/titliimg22_preview_rev_1.png",
      ru: "/img/titleimg_preview_rev_1.png"
    },
    homeImg: {
      uz: "/img/movie2.jpg",
      ru: "/img/movie2.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/video_4-5ulcham.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 4.9,
    ratingImdb: 9.0,
    ratingKinopoisk: 8.9,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Jangari", "Drama", "Kriminal"],
      ru: ["Боевик", "Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi. Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi. Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi. Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi. Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции. Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции. Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции. Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "O'rgimchakk odam film",
          ru: "Главный трейлер фильма Темный рыцарь"
        },
        like: '12',
        dislike: '54',
        typeTrailers: "action"
      }
    ],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },

    seasons: [
      {
        seasonNumber: 1,
        title: { uz: "Mavsum 1", ru: "Сезон 1" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 2,
        title: { uz: "Mavsum 2", ru: "Сезон 2" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 3,
        title: { uz: "Mavsum 3", ru: "Сезон 3" },
        episodes: [
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 4,
        title: { uz: "Mavsum 4", ru: "Сезон 4" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
        ]
      }
    ],
    actors: [1, 3, 2],
    category: "Doramalar",
    typeCategory: ["action", "drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Jangari", "Drama", "Detektiv"],
    type: "movie",
    like: '344',
    dislike: '',
    specs: {
      duration: 152,
      ageRating: "18+",
      year: 2008,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    },
    scenes: [
      "/img/movie-4.5-5.jpg",
      "/img/movie-4.5-5.jpg",
      "/img/movie-4.5-9.jpg",
      "/img/movie-4.5-6.avif",
      "/img/movie-4.5-3.jpg"
    ],
    clips: [
      {
        id: 1,
        src: "/video/Lady_Gaga,_Bruno_Mars_Die_With_A_Smile_Official_Music_Video.mp4",
        title: {
          uz: "Die With A Smile — Lady Gaga va Bruno Mars",
          ru: "Die With A Smile — Lady Gaga и Bruno Mars"
        }
      },
      {
        id: 2,
        src: "/video/Zivert - Life   Премьера клипа.mp4",
        title: {
          uz: "Zivert — Life (premyera klip)",
          ru: "Zivert — Life (премьера клипа)"
        }
      },
      {
        id: 3,
        src: "/video/The Amateur _ Official Trailer.mp4",
        title: {
          uz: "The Amateur — rasmiy treyler",
          ru: "The Amateur — официальный трейлер"
        }
      }
    ]
  },
  {
    id: 3,
    categoryName: "movies",
    title: {
      uz: "Dilwale",
      ru: "Дилвале"
    },
    homeImg: {
      uz: "/img/movie3.jpg",
      ru: "/img/movie3.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/4-5video.mp4"
        }
      }
    },
    rating: 4.5,
    ratingImdb: 7.8,
    ratingKinopoisk: 7.5,
    ratingNetflix: 4.0,
    ageRestriction: 13,
    genre: {
      uz: ["Romantik", "Jangari", "Komediya"],
      ru: ["Романтика", "Боевик", "Комедия"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Dilwale filmining asosiy treyleri",
          ru: "Главный трейлер фильма Дилвале"
        },
        like: '',
        dislike: '',
        typeTrailers: "romance"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    seasons: [
      {
        seasonNumber: 1,
        title: { uz: "Mavsum 1", ru: "Сезон 1" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 2,
        title: { uz: "Mavsum 2", ru: "Сезон 2" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" },
          { uz: "/video/The Amateur _ Official Trailer.mp4", ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 3,
        title: { uz: "Mavsum 3", ru: "Сезон 3" },
        episodes: [
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" },
          { ru: "/video/rumovie.mp4" }
        ]
      },
      {
        seasonNumber: 4,
        title: { uz: "Mavsum 4", ru: "Сезон 4" },
        episodes: [
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
          { uz: "/video/The Amateur _ Official Trailer.mp4"},
        ]
      }
    ],
    category: "Romantika",
    typeCategory: ["romance", "action", "comedy", "hindi", "bollywood"],
    filterCountry: "India",
    filterGenre: ["Romantika", "Jangari", "Komediya"],
    like: '',
    dislike: '',
    specs: {
      duration: 154,
      ageRating: "13+",
      year: 2015,
      countries: ["India"],
      languages: ["hindi", "eng", "uz"]
    },
    scenes: [
      "/img/movie-4.5-5.jpg",
      "/img/movie-4.5-5.jpg",
      "/img/movie-4.5-9.jpg",
      "/img/movie-4.5-6.avif",
      "/img/movie-4.5-3.jpg"
    ],
    clips: [
      {
        id: 1,
        src: "/video/Lady_Gaga,_Bruno_Mars_Die_With_A_Smile_Official_Music_Video.mp4",
        title: {
          uz: "Die With A Smile — Lady Gaga va Bruno Mars",
          ru: "Die With A Smile — Lady Gaga и Bruno Mars"
        }
      },
      {
        id: 2,
        src: "/video/Zivert - Life   Премьера клипа.mp4",
        title: {
          uz: "Zivert — Life (premyera klip)",
          ru: "Zivert — Life (премьера клипа)"
        }
      },
      {
        id: 3,
        src: "/video/The Amateur _ Official Trailer.mp4",
        title: {
          uz: "The Amateur — rasmiy treyler",
          ru: "The Amateur — официальный трейлер"
        }
      }
    ]
  },
  {
    id: 4,
    categoryName: "movies",
    title: {
      uz: "3 Ahmoq",
      ru: "3 идиота"
    },
    homeImg: {
      uz: "/img/movie4.jpg",
      ru: "/img/movie4.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 4.7,
    ratingImdb: 8.2,
    ratingKinopoisk: 8.0,
    ratingNetflix: 4.5,
    ageRestriction: 12,
    genre: {
      uz: ["Komediya", "Drama"],
      ru: ["Комедия", "Драма"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "3 Ahmoq filmining asosiy treyleri",
          ru: "Главный трейлер фильма 3 идиота"
        },
        like: '',
        dislike: '',
        typeTrailers: "comedy"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Komediya",
    typeCategory: ["comedy", "drama", "hindi", "bollywood"],
    filterCountry: "India",
    filterGenre: ["Komediya", "Drama"],
    like: '',
    dislike: '',
    specs: {
      duration: 170,
      ageRating: "12+",
      year: 2009,
      countries: ["India"],
      languages: ["hindi", "eng", "uz"]
    }
  },
  {
    id: 5,
    categoryName: "movies",
    title: {
      uz: "Interstellar",
      ru: "Интерстеллар"
    },
    homeImg: {
      uz: "/img/movie5.jpg",
      ru: "/img/movie5.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 4.9,
    ageRestriction: 16,
    genre: {
      uz: ["Drama", "Fantastika", "Sarguzasht"],
      ru: ["Драма", "Фантастика", "Приключения"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Interstellar filmining asosiy treyleri",
          ru: "Главный трейлер фильма Интерстеллар"
        },
        like: '',
        dislike: '',
        typeTrailers: "drama"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Fantastika",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "Korea",
    filterGenre: ["Drama", "Fantastika", "Sarguzasht"],
    like: '',
    dislike: '',
    specs: {
      duration: 169,
      ageRating: "16+",
      year: 2014,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 6,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "Korea",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 7,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama"],
    filterCountry: "Russia",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 8,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama"],
    filterCountry: "Qozog'eston",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 9,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    categoryName: "movies",
    typeCategory: ["Romantika",],
    filterCountry: "Italiya",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 10,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["Romantika",],
    filterCountry: "Germaniya",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 11,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "Jangare"],
    filterCountry: "Xitoy",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 12,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "Komediya"],
    filterCountry: "Tailand",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 13,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["Komediya", "Sarguzasht"],
    filterCountry: "Fransiya",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 14,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 16,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["Sarguzasht", "Qo'rqinchli"],
    filterCountry: "Russia",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 17,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 18,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["Romantika", "Komediya"],
    filterCountry: "Uzbekiston",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 19,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 20,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 21,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 22,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 23,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 24,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 25,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 26,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 27,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie6.jpg",
      ru: "/img/movie6.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 28,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie15.jpg",
      ru: "/img/movie15.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 29,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie12.jpg",
      ru: "/img/movie12.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 31,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie5.jpg",
      ru: "/img/movie5.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 32,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie16.jpg",
      ru: "/img/movie16.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: "Ikki qamalgan odam bir necha yil davomida bog'lanishadi.",
      ru: "Два заключенных сближаются в течение ряда лет."
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "hollywood"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
  {
    id: 33,
    categoryName: "movies",
    title: {
      uz: "Shawshank Qutqarilishi",
      ru: "Побег из Шоушенка"
    },
    homeImg: {
      uz: "/img/movie12.jpg",
      ru: "/img/movie12.jpg"
    },
    movieMedia: {
      uz: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      },
      ru: {
        video: {
          type: "video",
          src: "/video/mainDetailvideo.mp4"
        }
      }
    },
    rating: 5.0,
    ratingImdb: 8.5,
    ratingKinopoisk: 8.3,
    ratingNetflix: 4.8,
    ageRestriction: 18,
    genre: {
      uz: ["Drama", "Kriminal"],
      ru: ["Драма", "Криминал"]
    },
    description: {
      uz: {
        text: "Malakali o'g'ri, agar u inceptionning mumkin bo'lmagan vazifasini bajarishga qodir bo'lsa, qutqarish imkoniyatiga ega bo'ladi.",
        year: 2010,
        country: "AQSh",
        duration: 148,
        genre: ["Jangari", "Drama", "Triller"],
        director: "Christopher Nolan"
      },
      ru: {
        text: "Опытный вор получает шанс на искупление, если сможет выполнить невозможную задачу инцепции.",
        year: 2010,
        country: "США",
        duration: 148,
        genre: ["Боевик", "Драма", "Триллер"],
        director: "Кристофер Нолан"
      }
    },
    trailersVideo: [
      {
        id: 1,
        trailers: {
          uz: "/video/video1.mp4",
          ru: "/video/video1.mp4"
        },
        title: {
          uz: "Asosiy Treyler",
          ru: "Главный Трейлер"
        },
        text: {
          uz: "Filmining asosiy treyleri",
          ru: "Главный трейлер фильма"
        },
        like: '',
        dislike: '',
        typeTrailers: "action"
      }
    ],
    actors: [1, 3, 2],
    watchVideo: {
      uz: "/video/video1.mp4",
      ru: "/video/video1.mp4"
    },
    category: "Doramalar",
    typeCategory: ["drama", "horror"],
    filterCountry: "USA",
    filterGenre: ["Drama", "Detektiv"],
    like: '',
    dislike: '',
    specs: {
      duration: 142,
      ageRating: "18+",
      year: 1994,
      countries: ["USA"],
      languages: ["eng", "ru", "uz"]
    }
  },
];

// Faqat mavjud kinolardan foydalanish - fake kinolar yaratilmaydi
export const allMovies = [...movies, ...koreaDrama, ...kinolar, ...worldMovies, ...animations, ...turkishSeries, ...russianMovies, ...tvSeries, ...actionMovies, ...horrorMovies, ...anime, ...adventureMovies, ...romanceMovies, ...retroMovies, ...uzbekMovies, ...anonslar];
export const recommendedMovies = [...movies]; // Barcha mavjud kinolar (fake kinolar yo'q)
