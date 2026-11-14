'use strict';

const { ChatMessage } = require('./models');
const { cleanText, ensureConversation, isUserId, loadPeer, toClientMessage } = require('./thread');
const { publishChatMessage, toLiveMessage } = require('./live');
const { badRequest } = require('../utils/errors');

/**
 * Xabarni saqlaydi, keyin ikkala ochiq sahifaga yuboradi.
 */
const sendChatMessage = async (meId, peerId, rawText) => {
  const me = String(meId || '').trim().toLowerCase();
  const peer = String(peerId || '').trim().toLowerCase();
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (me === peer) throw badRequest('O‘zingizga xabar yozilmaydi');
  await loadPeer(peer);
  const text = cleanText(rawText);
  const conversation = await ensureConversation(me, peer);
  const row = await ChatMessage.create({
    conversationId: conversation._id,
    senderId: me,
    recipientId: peer,
    text,
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
