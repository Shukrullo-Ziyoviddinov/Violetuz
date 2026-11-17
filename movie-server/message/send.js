'use strict';

const { ChatMessage } = require('./models');
const { cleanText, ensureConversation, isUserId, loadPeer, toClientMessage } = require('./thread');
const { publishChatMessage, toLiveMessage } = require('./live');
const { badRequest } = require('../utils/errors');

/**
 * Xabarni saqlaydi, keyin ikkala ochiq sahifaga yuboradi.
 */
const loadReply = async (conversationId, rawReply) => {
  const replyId = String(rawReply?.id || '').trim();
  if (!replyId || !isUserId(replyId)) return null;
  const source = await ChatMessage.findOne({
    _id: replyId,
    conversationId,
  }).select('senderId text').lean();
  if (!source) throw badRequest('Javob xabari topilmadi');
  return {
    messageId: String(source._id),
    senderId: String(source.senderId || ''),
    text: String(source.text || '').slice(0, 2000),
  };
};

const sendChatMessage = async (meId, peerId, rawText, rawReply = null) => {
  const me = String(meId || '').trim().toLowerCase();
  const peer = String(peerId || '').trim().toLowerCase();
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (me === peer) throw badRequest('O‘zingizga xabar yozilmaydi');
  await loadPeer(peer);
  const text = cleanText(rawText);
  const conversation = await ensureConversation(me, peer);
  const replyTo = await loadReply(conversation._id, rawReply);
  const row = await ChatMessage.create({
    conversationId: conversation._id,
    senderId: me,
    recipientId: peer,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  const item = toClientMessage(row);
  try {
    publishChatMessage(peer, item);
    publishChatMessage(me, item);
  } catch (_err) {
    // Saqlangan xabar qoladi. Ochiq sahifa keyin o‘qib oladi.
  }
  return toLiveMessage(item);
};

module.exports = {
  sendChatMessage,
};
