'use strict';

const mongoose = require('mongoose');
const { ChatMessage } = require('./models');
const { isUserId } = require('./thread');
const { publishReact } = require('./live');
const { badRequest, notFound } = require('../utils/errors');

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const asObjectId = (value) => new mongoose.Types.ObjectId(normalizeId(value));

const hiddenFrom = (row, userId) => (row?.hiddenFor || []).some((item) => normalizeId(item) === userId);

const cleanEmoji = (value) => {
  const emoji = String(value || '').trim();
  if (!emoji) return '';
  if (emoji.length > 32) throw badRequest('Reaksiya noto‘g‘ri');
  return emoji;
};

const loadOwnMessage = async (meId, messageId) => {
  const me = normalizeId(meId);
  const id = normalizeId(messageId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (!isUserId(id)) throw notFound('Xabar topilmadi');
  const row = await ChatMessage.findById(id).lean();
  if (!row) throw notFound('Xabar topilmadi');
  const sender = normalizeId(row.senderId);
  const recipient = normalizeId(row.recipientId);
  if (me !== sender && me !== recipient) throw notFound('Xabar topilmadi');
  if (hiddenFrom(row, me)) throw notFound('Xabar topilmadi');
  return { row, me, sender, recipient };
};

const reactChatMessage = async (meId, messageId, rawEmoji, rawEmojiId) => {
  const { row, me, sender, recipient } = await loadOwnMessage(meId, messageId);
  const emoji = cleanEmoji(rawEmoji);
  const emojiId = String(rawEmojiId || '').trim().slice(0, 32);
  const mine = (row.reactions || []).find((item) => normalizeId(item.userId) === me);
  const remove = !emoji || mine?.emoji === emoji;
  const user = asObjectId(me);
  await ChatMessage.updateOne({ _id: row._id }, { $pull: { reactions: { userId: user } } });
  const at = new Date();
  if (!remove) {
    await ChatMessage.updateOne(
      { _id: row._id },
      { $push: { reactions: { userId: user, emoji, emojiId, at } } }
    );
  }
  const peer = me === sender ? recipient : sender;
  const payload = {
    id: String(row._id),
    userId: me,
    emoji: remove ? '' : emoji,
    ...(remove || !emojiId ? {} : { emojiId }),
    at: remove ? null : at.toISOString(),
  };
  try {
    publishReact(peer, payload);
  } catch (_err) {
    // Reaksiya saqlangan. Jonli yuborish yiqilsa ham javob qaytadi.
  }
  return payload;
};

module.exports = { reactChatMessage };
