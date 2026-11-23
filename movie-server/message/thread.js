'use strict';

const mongoose = require('mongoose');
const User = require('../models/User.model');
const { ChatConversation, ChatMessage } = require('./models');
const { badRequest, notFound } = require('../utils/errors');
const { publishRead } = require('./live');

const USER_ID_RE = /^[a-f0-9]{24}$/i;
const TEXT_MAX = 2000;

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const isUserId = (value) => USER_ID_RE.test(normalizeId(value))
  && mongoose.Types.ObjectId.isValid(normalizeId(value));

const pairKeyFor = (leftId, rightId) => [normalizeId(leftId), normalizeId(rightId)].sort().join(':');

const toPublicPeer = (user) => ({
  id: String(user._id),
  name: String(user.name || '').trim(),
  username: String(user.username || '').trim(),
  avatar: String(user.avatar || '').trim(),
});

const toReply = (value) => {
  const text = String(value?.text || '').trim();
  if (!text) return null;
  return {
    id: String(value.messageId || value.id || ''),
    senderId: String(value.senderId || ''),
    text,
    ...(value.animated || value.animationId ? { animated: true } : {}),
    ...(value.animationId ? { animationId: String(value.animationId) } : {}),
    ...(value.gif ? { gif: String(value.gif) } : {}),
  };
};

const toClientMessage = (row) => ({
  id: String(row._id || row.id || ''),
  conversationId: String(row.conversationId || ''),
  senderId: String(row.senderId || ''),
  recipientId: String(row.recipientId || ''),
  text: String(row.text || ''),
  animated: row.animated === true || Boolean(row.animationId),
  ...(row.animationId ? { animationId: String(row.animationId) } : {}),
  ...(row.gif ? { gif: String(row.gif) } : {}),
  createdAt: row.createdAt || null,
  readAt: row.readAt || null,
  replyTo: toReply(row.replyTo),
});

const loadPeer = async (peerId) => {
  const id = String(peerId || '').trim();
  if (!isUserId(id)) throw notFound('Foydalanuvchi topilmadi');
  const user = await User.findById(id).select('name username avatar').lean();
  if (!user) throw notFound('Foydalanuvchi topilmadi');
  return user;
};

const findConversation = (meId, peerId) => ChatConversation.findOne({
  pairKey: pairKeyFor(meId, peerId),
}).lean();

const ensureConversation = async (meId, peerId) => {
  const pairKey = pairKeyFor(meId, peerId);
  const existing = await ChatConversation.findOne({ pairKey }).lean();
  if (existing) return existing;
  try {
    const created = await ChatConversation.create({
      pairKey,
      members: [meId, peerId],
    });
    return created.toObject();
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const again = await ChatConversation.findOne({ pairKey }).lean();
    if (!again) throw err;
    return again;
  }
};

const listMessages = async (conversationId, meId) => {
  if (!conversationId) return [];
  const rows = await ChatMessage.find({
    conversationId,
    hiddenFor: { $nin: [meId] },
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(50)
    .select('conversationId senderId recipientId text animated animationId gif createdAt readAt replyTo')
    .lean();
  const replyIds = [...new Set(rows
    .map((row) => String(row.replyTo?.messageId || '').trim())
    .filter((id) => isUserId(id)))];
  if (replyIds.length) {
    const alive = await ChatMessage.find({ _id: { $in: replyIds } }).select('_id').lean();
    const aliveIds = new Set(alive.map((row) => String(row._id).toLowerCase()));
    const missing = replyIds.filter((id) => !aliveIds.has(id.toLowerCase()));
    if (missing.length) {
      await ChatMessage.updateMany(
        { conversationId, 'replyTo.messageId': { $in: missing } },
        { $unset: { replyTo: 1 } }
      );
      rows.forEach((row) => {
        const quotedId = String(row.replyTo?.messageId || '').trim().toLowerCase();
        if (quotedId && !aliveIds.has(quotedId)) row.replyTo = undefined;
      });
    }
  }
  return rows.reverse().map(toClientMessage);
};

const markThreadRead = async (meId, conversationId) => {
  if (!conversationId) return null;
  const readAt = new Date();
  const result = await ChatMessage.updateMany(
    { conversationId, recipientId: meId, readAt: null },
    { $set: { readAt } }
  );
  if (!result?.modifiedCount) return null;
  return readAt;
};

const openThread = async (meId, peerId) => {
  const me = normalizeId(meId);
  const peer = normalizeId(peerId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (me === peer) throw badRequest('O‘zingiz bilan suhbat ochilmaydi');
  const person = await loadPeer(peer);
  const conversation = await findConversation(me, peer);
  const messages = await listMessages(conversation?._id, me);
  const readAt = await markThreadRead(me, conversation?._id);
  if (readAt) publishRead(peer, { userId: me, readAt });
  return {
    peer: toPublicPeer(person),
    messages,
  };
};

const toInboxCard = (conversation, peer, last, unread) => ({
  id: String(conversation._id),
  peer: toPublicPeer(peer),
  text: String(last?.text || ''),
  createdAt: last?.createdAt || null,
  unread: Number(unread) || 0,
});

const listInbox = async (meId) => {
  const me = normalizeId(meId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  const conversations = await ChatConversation.find({ members: me }).lean();
  const cards = [];
  for (const conversation of conversations) {
    const peerId = (conversation.members || [])
      .map((id) => normalizeId(id))
      .find((id) => id && id !== me);
    if (!peerId) continue;
    const person = await User.findById(peerId).select('name username avatar').lean();
    if (!person) continue;
    const last = await ChatMessage.findOne({
      conversationId: conversation._id,
      hiddenFor: { $nin: [me] },
    })
      .sort({ createdAt: -1 })
      .select('text createdAt')
      .lean();
    const unread = await ChatMessage.countDocuments({
      conversationId: conversation._id,
      recipientId: me,
      readAt: null,
      hiddenFor: { $nin: [me] },
    });
    cards.push(toInboxCard(conversation, person, last, unread));
  }
  cards.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  return cards;
};

const cleanText = (value) => {
  if (typeof value !== 'string') throw badRequest('Xabar bo‘sh');
  const text = value.trim();
  if (!text) throw badRequest('Xabar bo‘sh');
  if (text.length > TEXT_MAX) throw badRequest('Xabar juda uzun');
  return text;
};

module.exports = {
  isUserId,
  pairKeyFor,
  toPublicPeer,
  toClientMessage,
  loadPeer,
  ensureConversation,
  listMessages,
  markThreadRead,
  openThread,
  toInboxCard,
  listInbox,
  cleanText,
};
