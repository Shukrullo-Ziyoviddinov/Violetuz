'use strict';

const { ChatMessage } = require('./models');
const { isUserId, cleanText, toReply } = require('./thread');
const { publishEdit } = require('./live');
const { badRequest, notFound } = require('../utils/errors');

const normalizeId = (value) => String(value || '').trim().toLowerCase();

const isPlain = (row) => !row?.gif && !row?.animationId && row?.animated !== true;

const plainQuotesOf = (messageId) => ({
  'replyTo.messageId': { $regex: `^${messageId}$`, $options: 'i' },
  'replyTo.gif': { $in: [null, ''] },
  'replyTo.animationId': { $in: [null, ''] },
  'replyTo.animated': { $ne: true },
});

const editChatMessage = async (meId, messageId, rawText, rawQuote) => {
  const me = normalizeId(meId);
  const id = normalizeId(messageId);
  if (!isUserId(me)) throw badRequest('Hisob topilmadi');
  if (!isUserId(id)) throw notFound('Xabar topilmadi');
  const row = await ChatMessage.findById(id).lean();
  if (!row) throw notFound('Xabar topilmadi');
  const sender = normalizeId(row.senderId);
  const recipient = normalizeId(row.recipientId);
  if (me !== sender) throw notFound('Xabar topilmadi');
  if (!isPlain(row)) throw badRequest('Bu xabarni tahrirlab bo‘lmaydi');
  const text = cleanText(rawText);
  const related = [];
  const quote = row.replyTo;
  const quotePlain = Boolean(String(quote?.text || '').trim()) && isPlain(quote);
  if (quotePlain && typeof rawQuote === 'string') {
    const nextQuote = rawQuote.trim();
    if (nextQuote && nextQuote !== String(quote.text || '').trim()) {
      if (nextQuote.length > 2000) throw badRequest('Xabar juda uzun');
      const sourceId = String(quote.messageId || '').trim();
      let changedSource = false;
      if (isUserId(sourceId)) {
        const source = await ChatMessage.findById(sourceId).select('senderId text gif animationId animated').lean();
        if (source && normalizeId(source.senderId) === me && isPlain(source)) {
          await ChatMessage.updateOne({ _id: source._id }, { $set: { text: nextQuote } });
          await ChatMessage.updateMany(plainQuotesOf(String(source._id)), { $set: { 'replyTo.text': nextQuote } });
          related.push({ id: String(source._id), text: nextQuote });
          changedSource = true;
        }
      }
      if (!changedSource) {
        await ChatMessage.updateOne({ _id: row._id }, { $set: { 'replyTo.text': nextQuote } });
      }
    }
  }
  await ChatMessage.updateOne({ _id: row._id }, { $set: { text } });
  await ChatMessage.updateMany(plainQuotesOf(String(row._id)), { $set: { 'replyTo.text': text } });
  const saved = await ChatMessage.findById(row._id).lean();
  const payload = {
    id: String(row._id),
    text: String(saved?.text || text),
    replyTo: toReply(saved?.replyTo),
    related,
  };
  publishEdit(recipient, payload);
  return payload;
};

module.exports = { editChatMessage };
