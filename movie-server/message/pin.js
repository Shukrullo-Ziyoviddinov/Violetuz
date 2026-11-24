'use strict';

const mongoose = require('mongoose');
const { ChatMessage } = require('./models');
const { isUserId } = require('./thread');
const { publishPin } = require('./live');
const { badRequest, notFound } = require('../utils/errors');

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const asObjectId = (value) => new mongoose.Types.ObjectId(normalizeId(value));

const hiddenFrom = (row, userId) => (row?.hiddenFor || []).some((item) => normalizeId(item) === userId);

const pinPayload = (row, at, pinned) => ({
  id: String(row._id),
  pinned,
  at: at ? new Date(at).toISOString() : null,
  text: String(row.text || ''),
  animated: row.animated === true || Boolean(row.animationId),
  ...(row.animationId ? { animationId: String(row.animationId) } : {}),
  ...(row.gif ? { gif: String(row.gif) } : {}),
});

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

const setPin = async (row, userId, at) => {
  const user = asObjectId(userId);
  await ChatMessage.updateOne({ _id: row._id }, { $pull: { pinnedFor: { userId: user } } });
  await ChatMessage.updateOne({ _id: row._id }, { $push: { pinnedFor: { userId: user, at } } });
};

const pinChatMessage = async (meId, messageId, forPeer) => {
  const { row, me, sender, recipient } = await loadOwnMessage(meId, messageId);
  const at = new Date();
  await setPin(row, me, at);
  const peer = me === sender ? recipient : sender;
  const share = forPeer === true && isUserId(peer) && !hiddenFrom(row, peer);
  if (share) {
    await setPin(row, peer, at);
    try {
      publishPin(peer, pinPayload(row, at, true));
    } catch (_err) {
      // Qadash saqlangan. Jonli yuborish yiqilsa ham javob qaytadi.
    }
  }
  return pinPayload(row, at, true);
};

const unpinChatMessage = async (meId, messageId) => {
  const { row, me } = await loadOwnMessage(meId, messageId);
  await ChatMessage.updateOne(
    { _id: row._id },
    { $pull: { pinnedFor: { userId: asObjectId(me) } } }
  );
  return { id: String(row._id), pinned: false };
};

module.exports = { pinChatMessage, unpinChatMessage };
