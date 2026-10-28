/**
 * Hozir trendda — oxirgi 7 kunda eng ko‘p tinglangan qo‘shiqlar.
 * Hafta/oy top 10 limitiga bog‘lanmaydi. Oyna suriladi, yozuv o‘chmaydi.
 * Formula bu yerda emas — shared ranker + ListenEvent.
 *
 * @module recommendation-music/config/mostListenedMusic.config
 */

'use strict';

const mostListenedMusicConfig = Object.freeze({
  /** To‘liq ro‘yxat (music more). Qidiruv 6 tasini shundan kesadi. */
  topLimit: 20,
  topMaxLimit: 20,
  /** Rolling oyna (kun). 8-kun eski tinglov hisobdan tushadi. */
  windowDays: 7,
  /** Kirish chegarasi yo‘q — kamida bitta distinct tinglov. */
  minViews: 1,
  contentType: 'music',
});

module.exports = {
  mostListenedMusicConfig,
};
