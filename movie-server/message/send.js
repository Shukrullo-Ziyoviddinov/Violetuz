'use strict';

const { ChatMessage } = require('./models');
const { cleanText, ensureConversation, isUserId, loadPeer, toClientMessage } = require('./thread');
const { publishChatMessage, toLiveMessage } = require('./live');
const { badRequest } = require('../utils/errors');

/**
 * Xabarni saqlaydi, keyin ikkala ochiq sahifaga yuboradi.
 */
const clip = (value, max) => String(value || '').trim().slice(0, max);

const loadReply = async (conversationId, rawReply) => {
  const replyId = clip(rawReply?.id || rawReply?.messageId, 64);
  if (!replyId || !isUserId(replyId)) return null;
  const source = await ChatMessage.findOne({
    _id: replyId,
    conversationId,
  }).select('senderId text animated animationId').lean();
  const sourceText = clip(source?.text, 2000);
  if (!sourceText) return null;
  const sourceAnimationId = animationIdOf(source?.animationId);
  return {
    messageId: String(source._id),
    senderId: String(source.senderId || ''),
    text: sourceText,
    ...(source.animated || sourceAnimationId ? { animated: true } : {}),
    ...(sourceAnimationId ? { animationId: sourceAnimationId } : {}),
  };
};

const ANIMATION_ID_RE = /^[0-9]{1,12}$/;

const animationIdOf = (value) => {
  const id = String(value || '').trim();
  return ANIMATION_ID_RE.test(id) ? id : '';
};

const sendChatMessage = async (meId, peerId, rawText, rawReply = null, rawAnimated = false, rawAnimationId = '') => {
  const me = String(meId || '').trim().toLowerCase();
  const peer = String(peerId || '').trim().toLowerCase();
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (me === peer) throw badRequest('O‘zingizga xabar yozilmaydi');
  await loadPeer(peer);
  const text = cleanText(rawText);
  const animationId = animationIdOf(rawAnimationId);
  const animated = Boolean(animationId) || (rawAnimated === true && text.length <= 32 && !/\p{L}/u.test(text));
  const conversation = await ensureConversation(me, peer);
  const replyTo = await loadReply(conversation._id, rawReply);
  let row = await ChatMessage.create({
    conversationId: conversation._id,
    senderId: me,
    recipientId: peer,
    text,
    ...(animated ? { animated: true } : {}),
    ...(animationId ? { animationId } : {}),
    ...(replyTo ? { replyTo } : {}),
  });
  if (replyTo && !clip(row.replyTo?.text, 2000)) {
    row = await ChatMessage.findByIdAndUpdate(
      row._id,
      { $set: { replyTo } },
      { returnDocument: 'after' }
    );
  }
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
