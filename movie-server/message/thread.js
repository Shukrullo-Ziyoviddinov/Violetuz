'use strict';

const mongoose = require('mongoose');
const User = require('../models/User.model');
const { ChatConversation, ChatMessage } = require('./models');
const { badRequest, notFound } = require('../utils/errors');

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

const toClientMessage = (row) => ({
  id: String(row._id || row.id || ''),
  conversationId: String(row.conversationId || ''),
  senderId: String(row.senderId || ''),
  recipientId: String(row.recipientId || ''),
  text: String(row.text || ''),
  createdAt: row.createdAt || null,
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

const listMessages = async (conversationId) => {
  if (!conversationId) return [];
  const rows = await ChatMessage.find({ conversationId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(50)
    .select('conversationId senderId recipientId text createdAt')
    .lean();
  return rows.reverse().map(toClientMessage);
};

const markThreadRead = async (meId, conversationId) => {
  if (!conversationId) return;
  await ChatMessage.updateMany(
    { conversationId, recipientId: meId, readAt: null },
    { $set: { readAt: new Date() } }
  );
};

const openThread = async (meId, peerId) => {
  const me = normalizeId(meId);
  const peer = normalizeId(peerId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (me === peer) throw badRequest('O‘zingiz bilan suhbat ochilmaydi');
  const person = await loadPeer(peer);
  const conversation = await findConversation(me, peer);
  const messages = await listMessages(conversation?._id);
  await markThreadRead(me, conversation?._id);
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
    const last = await ChatMessage.findOne({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .select('text createdAt')
      .lean();
    const unread = await ChatMessage.countDocuments({
      conversationId: conversation._id,
      recipientId: me,
      readAt: null,
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
