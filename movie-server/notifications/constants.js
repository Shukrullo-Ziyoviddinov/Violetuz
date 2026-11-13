/**
 * Hozir ishlaydigan yagona tur: kimdir foydalanuvchiga obuna bo‘lsa.
 * Qolgan sozlama tugmalari keyin qo‘shiladi.
 */
const NOTIFICATION_TYPES = Object.freeze(['subscriber']);

/** Sozlamada shu kalit yoqilsa, subscriber xabari ketadi. */
const SUBSCRIBER_SETTING_KEY = 'subscribers';

/** Tur qaysi sozlama maydoniga qaraydi. Hozir faqat obunachilar. */
const TYPE_SETTING_FIELD = Object.freeze({
  subscriber: SUBSCRIBER_SETTING_KEY,
});

module.exports = {
  NOTIFICATION_TYPES,
  SUBSCRIBER_SETTING_KEY,
  TYPE_SETTING_FIELD,
};
