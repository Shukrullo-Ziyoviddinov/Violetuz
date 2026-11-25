'use strict';

const mongoose = require('mongoose');
const { ChatMessage } = require('./models');
const { isUserId } = require('./thread');
const { publishDelete } = require('./live');
const { dropStoredVideo } = require('./view');
const { badRequest, notFound } = require('../utils/errors');

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const removeChatMessage = async (meId, messageId, forPeer) => {
  const me = normalizeId(meId);
  const id = normalizeId(messageId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (!isUserId(id)) throw notFound('Xabar topilmadi');
  const row = await ChatMessage.findById(id).select('conversationId senderId recipientId video').lean();
  if (!row) throw notFound('Xabar topilmadi');
  const sender = normalizeId(row.senderId);
  const recipient = normalizeId(row.recipientId);
  if (me !== sender && me !== recipient) throw notFound('Xabar topilmadi');
  if (forPeer) {
    const goneId = String(row._id);
    await ChatMessage.updateMany(
      {
        conversationId: row.conversationId,
        'replyTo.messageId': { $regex: `^${goneId}$`, $options: 'i' },
      },
      { $unset: { replyTo: 1 } }
    );
    const other = me === sender ? recipient : sender;
    publishDelete(other, { id: goneId });
    await dropStoredVideo(row.video);
    await ChatMessage.deleteOne({ _id: row._id });
    return { id: goneId, forPeer: true };
  }
  await ChatMessage.updateOne(
    { _id: row._id },
    { $addToSet: { hiddenFor: new mongoose.Types.ObjectId(me) } }
  );
  return { id: String(row._id), forPeer: false };
};

module.exports = { removeChatMessage };
