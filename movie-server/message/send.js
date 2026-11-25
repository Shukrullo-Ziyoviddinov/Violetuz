'use strict';

const { ChatMessage } = require('./models');
const { cleanText, ensureConversation, isUserId, loadPeer, toClientMessage } = require('./thread');
const { publishChatMessage, toLiveMessage } = require('./live');
const { badRequest } = require('../utils/errors');
const { R2_PUBLIC_URL } = require('../config/env');

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
  }).select('senderId text animated animationId gif video').lean();
  const sourceText = clip(source?.text, 2000) || (source?.video?.url ? 'Video' : '');
  if (!sourceText) return null;
  const sourceAnimationId = animationIdOf(source?.animationId);
  const sourceGif = gifOf(source?.gif);
  return {
    messageId: String(source._id),
    senderId: String(source.senderId || ''),
    text: sourceText,
    ...(source.animated || sourceAnimationId ? { animated: true } : {}),
    ...(sourceAnimationId ? { animationId: sourceAnimationId } : {}),
    ...(sourceGif ? { gif: sourceGif } : {}),
  };
};

const ANIMATION_ID_RE = /^[0-9]{1,12}$/;

const animationIdOf = (value) => {
  const id = String(value || '').trim();
  return ANIMATION_ID_RE.test(id) ? id : '';
};

const gifOf = (value) => {
  const name = String(value || '').trim();
  if (!name || name.length > 180) return '';
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return '';
  if (!/\.(mp4|mov)$/i.test(name)) return '';
  return name;
};

const VIDEO_MAX_SECONDS = 60;

const chatVideoKey = (url, base) => {
  if (!base || !url.startsWith(`${base}/`) || url.includes('?') || url.includes('#')) return '';
  try {
    const key = decodeURIComponent(url.slice(base.length + 1));
    if (!key.startsWith('chatVideos/') || key.includes('..') || key.includes('\\') || key.includes('//')) return '';
    return key;
  } catch {
    return '';
  }
};

const videoOf = (raw) => {
  if (raw == null || raw === false) return null;
  if (typeof raw !== 'object') throw badRequest('Video noto‘g‘ri');
  const url = String(raw.url || '').trim();
  const base = String(R2_PUBLIC_URL || '').replace(/\/+$/, '');
  const key = chatVideoKey(url, base);
  if (!key || !/\.(mp4|webm|mov)$/i.test(key)) throw badRequest('Video manzili noto‘g‘ri');
  const posterUrl = String(raw.poster || '').trim();
  const posterKey = posterUrl ? chatVideoKey(posterUrl, base) : '';
  if (posterUrl && (!posterKey || !/\.jpe?g$/i.test(posterKey))) throw badRequest('Video manzili noto‘g‘ri');
  const duration = Number(raw.duration);
  const start = Number(raw.start) || 0;
  if (!Number.isFinite(duration) || duration <= 0 || duration > VIDEO_MAX_SECONDS) {
    throw badRequest('Video 1 daqiqadan oshmasligi kerak');
  }
  if (!Number.isFinite(start) || start < 0 || start + duration > VIDEO_MAX_SECONDS + 0.05) {
    throw badRequest('Video 1 daqiqadan oshmasligi kerak');
  }
  return {
    url,
    duration: Math.round(duration * 10) / 10,
    start: Math.round(start * 10) / 10,
    viewOnce: raw.viewOnce === true,
    ...(posterUrl ? { poster: posterUrl } : {}),
  };
};

const sendChatMessage = async (meId, peerId, rawText, rawReply = null, rawAnimated = false, rawAnimationId = '', rawGif = '', rawVideo = null) => {
  const me = String(meId || '').trim().toLowerCase();
  const peer = String(peerId || '').trim().toLowerCase();
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (me === peer) throw badRequest('O‘zingizga xabar yozilmaydi');
  await loadPeer(peer);
  const video = videoOf(rawVideo);
  const text = video && !String(rawText || '').trim() ? '' : cleanText(rawText);
  const animationId = video ? '' : animationIdOf(rawAnimationId);
  const gif = animationId || video ? '' : gifOf(rawGif);
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
    ...(gif ? { gif } : {}),
    ...(video ? { video } : {}),
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
