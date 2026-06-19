/**
 * VideoBanner ma'lumotlari.
 * type: "movie" → refId kinoning id si, titleImg va reytinglar movies.js dan olinadi.
 * type: "music" → refId klip/konsert/albom/musiqaning id si, titleImage va nameImg data dan.
 * Video bosilganda refId bo'yicha tegishli sahifaga yo'naltiriladi.
 */
export const banners = [
  {
    id: 1,
    type: "movie",
    refId: 1,
    video: "/video/mainDetailvideo.mp4",
  },
  {
    id: 2,
    type: "music",
    refId: 301,
    video: "/video/Lady_Gaga,_Bruno_Mars_Die_With_A_Smile_Official_Music_Video.mp4",
    titleImage: { uz: "/img/titleimg_preview_rev_1.png", ru: "/img/titleimg_preview_rev_1.png" },
    nameImg: "/img/titliimg22_preview_rev_1.png"
  },
  {
    id: 3,
    type: "music",
    refId: 303,
    video: "/video/Zivert - Life   Премьера клипа.mp4",
    titleImage: { uz: "/img/titleimg_preview_rev_1.png", ru: "/img/titleimg_preview_rev_1.png" },
    nameImg: "/img/titliimg22_preview_rev_1.png"
  },
  {
    id: 4,
    type: "music",
    refId: 304,
    video: "/video/Zivert - Life   Премьера клипа.mp4",
    titleImage: { uz: "/img/titleimg_preview_rev_1.png", ru: "/img/titleimg_preview_rev_1.png" },
    nameImg: "/img/titliimg22_preview_rev_1.png"
  },
  {
    id: 6,
    type: "movie",
    refId: 1,
    video: "/video/mainDetailvideo.mp4",
  },
];
