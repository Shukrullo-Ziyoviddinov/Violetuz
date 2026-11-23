'use strict';

const mongoose = require('mongoose');
const { ChatMessage } = require('./models');
const { isUserId } = require('./thread');
const { publishDelete } = require('./live');
const { badRequest, notFound } = require('../utils/errors');

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const removeChatMessage = async (meId, messageId, forPeer) => {
  const me = normalizeId(meId);
  const id = normalizeId(messageId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (!isUserId(id)) throw notFound('Xabar topilmadi');
  const row = await ChatMessage.findById(id).select('senderId recipientId').lean();
  if (!row) throw notFound('Xabar topilmadi');
  const sender = normalizeId(row.senderId);
  const recipient = normalizeId(row.recipientId);
  if (me !== sender && me !== recipient) throw notFound('Xabar topilmadi');
  if (forPeer) {
    await ChatMessage.deleteOne({ _id: row._id });
    const other = me === sender ? recipient : sender;
    publishDelete(other, { id: String(row._id) });
    return { id: String(row._id), forPeer: true };
  }
  await ChatMessage.updateOne(
    { _id: row._id },
    { $addToSet: { hiddenFor: new mongoose.Types.ObjectId(me) } }
  );
  return { id: String(row._id), forPeer: false };
};

module.exports = { removeChatMessage };
