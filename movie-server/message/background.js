'use strict';

const { ChatBackgroundImage, ChatBackgroundChoice } = require('./models');
const { badRequest } = require('../utils/errors');

const toImage = (row) => ({
  id: row.id,
  image: row.image,
  isDefault: row.isDefault === true,
  order: row.order,
});

const toChoice = (row, fallback) => ({
  backgroundId: row ? row.backgroundId : fallback.id,
  image: row ? row.image : fallback.image,
  isDefault: !row,
});

async function defaultImage() {
  const marked = await ChatBackgroundImage.findOne({ isDefault: true })
    .select('id image isDefault order')
    .lean();
  if (marked) return marked;
  return ChatBackgroundImage.findOne()
    .sort({ order: 1, id: 1 })
    .select('id image isDefault order')
    .lean();
}

async function listBackgrounds() {
  const rows = await ChatBackgroundImage.find()
    .sort({ order: 1, id: 1 })
    .select('id image isDefault order')
    .lean();
  return rows.map(toImage);
}

async function getMyBackground(userId) {
  const choice = await ChatBackgroundChoice.findOne({ userId })
    .select('backgroundId image')
    .lean();
  if (choice) return toChoice(choice, null);
  const fallback = await defaultImage();
  if (!fallback) throw badRequest('Chat fonlari hali qo‘shilmagan');
  return toChoice(null, fallback);
}

async function saveMyBackground(userId, backgroundId) {
  const id = Number(backgroundId);
  if (!Number.isInteger(id)) throw badRequest('Fon raqami noto‘g‘ri');
  const image = await ChatBackgroundImage.findOne({ id })
    .select('id image')
    .lean();
  if (!image) throw badRequest('Bunday fon yo‘q');
  const saved = await ChatBackgroundChoice.findOneAndUpdate(
    { userId },
    { $set: { backgroundId: image.id, image: image.image } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  )
    .select('backgroundId image')
    .lean();
  return toChoice(saved, null);
}

module.exports = {
  listBackgrounds,
  getMyBackground,
  saveMyBackground,
};
