'use strict';

const { ChatMessage } = require('./models');
const { isUserId } = require('./thread');
const { publishDelete } = require('./live');
const r2Service = require('../services/r2Service');
const { badRequest, notFound } = require('../utils/errors');

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const dropVideoFile = async (url) => {
  const key = r2Service.resolveObjectKey(url);
  if (!key || !key.startsWith('chatVideos/')) return;
  try {
    await r2Service.deleteObject(key);
  } catch {
    /* Xabar baribir yo‘qoladi. */
  }
};

const viewChatVideo = async (meId, messageId) => {
  const me = normalizeId(meId);
  const id = normalizeId(messageId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (!isUserId(id)) throw notFound('Xabar topilmadi');
  const row = await ChatMessage.findById(id)
    .select('conversationId senderId recipientId video')
    .lean();
  if (!row?.video?.url || row.video.viewOnce !== true) throw notFound('Xabar topilmadi');
  const sender = normalizeId(row.senderId);
  const recipient = normalizeId(row.recipientId);
  if (me !== recipient || me === sender) throw notFound('Xabar topilmadi');
  const goneId = String(row._id);
  await dropVideoFile(row.video.url);
  await ChatMessage.updateMany(
    {
      conversationId: row.conversationId,
      'replyTo.messageId': { $regex: `^${goneId}$`, $options: 'i' },
    },
    { $unset: { replyTo: 1 } }
  );
  publishDelete(sender, { id: goneId });
  await ChatMessage.deleteOne({ _id: row._id });
  return { id: goneId };
};

module.exports = { viewChatVideo };
