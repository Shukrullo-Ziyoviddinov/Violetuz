/**
 * Bildirishnomalar bo‘limi.
 * Boshqa kod shu yerdan model va turlarni oladi.
 */

'use strict';

const models = require('./models');
const constants = require('./constants');
const { sendNotification } = require('./send');

module.exports = {
  ...models,
  ...constants,
  sendNotification,
};
