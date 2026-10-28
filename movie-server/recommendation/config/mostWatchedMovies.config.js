/**
 * Hozir trendda — oxirgi 7 kunda eng ko‘p ko‘rilgan kinolar.
 * Hafta/oy top 10 limitiga bog‘lanmaydi. Oyna suriladi, yozuv o‘chmaydi.
 * Formula bu yerda emas — weekly o‘qish + shared ranker.
 *
 * @module recommendation/config/mostWatchedMovies.config
 */

'use strict';

const mostWatchedMoviesConfig = Object.freeze({
  /** To‘liq ro‘yxat (recommended). Qidiruv bir qatorni shundan kesadi. */
  topLimit: 20,
  topMaxLimit: 20,
  /** Rolling oyna (kun). 8-kun eski tomosha hisobdan tushadi. */
  windowDays: 7,
  /** Kirish chegarasi yo‘q — kamida bitta distinct tomosha. */
  minViews: 1,
});

module.exports = {
  mostWatchedMoviesConfig,
};
