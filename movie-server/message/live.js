'use strict';

/**
 * Ochiq chat sahifasiga saqlangan xabar.
 * Sahifa yangilanmaydi.
 */

const clients = new Map();

const toLiveReply = (value) => {
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

const toLiveMessage = (row) => ({
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
  replyTo: toLiveReply(row.replyTo),
});

const streamKey = (userId) => String(userId || '').trim().toLowerCase();

const addClient = (userId, res) => {
  const key = streamKey(userId);
  if (!key || !res) return () => {};
  let bucket = clients.get(key);
  if (!bucket) {
    bucket = new Set();
    clients.set(key, bucket);
  }
  bucket.add(res);
  return () => {
    bucket.delete(res);
    if (!bucket.size) clients.delete(key);
  };
};

const publishTyping = (userId, payload) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  const from = streamKey(payload?.userId);
  if (!bucket?.size || !from) return 0;
  const body = { userId: from, typing: payload?.typing === true };
  const data = `event: typing\ndata: ${JSON.stringify(body)}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(data);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const publishRead = (userId, payload) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  const from = streamKey(payload?.userId);
  if (!bucket?.size || !from || !payload?.readAt) return 0;
  const body = { userId: from, readAt: payload.readAt };
  const data = `event: read\ndata: ${JSON.stringify(body)}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(data);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const publishEdit = (userId, payload) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  const id = String(payload?.id || '').trim();
  const text = String(payload?.text || '').trim();
  if (!bucket?.size || !id || !text) return 0;
  const body = {
    id,
    text,
    replyTo: payload?.replyTo || null,
    related: Array.isArray(payload?.related) ? payload.related : [],
  };
  const data = `event: edit\ndata: ${JSON.stringify(body)}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(data);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const publishPin = (userId, payload) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  const id = String(payload?.id || '').trim();
  if (!bucket?.size || !id) return 0;
  const data = `event: pin\ndata: ${JSON.stringify(payload)}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(data);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const publishReact = (userId, payload) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  const id = String(payload?.id || '').trim();
  if (!bucket?.size || !id) return 0;
  const data = `event: react\ndata: ${JSON.stringify(payload)}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(data);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const publishDelete = (userId, payload) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  const id = String(payload?.id || '').trim();
  if (!bucket?.size || !id) return 0;
  const data = `event: delete\ndata: ${JSON.stringify({ id })}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(data);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const publishChatMessage = (userId, item) => {
  const key = streamKey(userId);
  const bucket = clients.get(key);
  if (!bucket?.size || !item?.id) return 0;
  const payload = `event: chat\ndata: ${JSON.stringify(toLiveMessage(item))}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(payload);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(key);
  return sent;
};

const attachStream = (userId, req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write('retry: 3000\n\n');

  const remove = addClient(userId, res);
  let beat = null;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(beat);
    remove();
  };
  beat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_err) {
      close();
    }
  }, 25000);
  if (typeof beat.unref === 'function') beat.unref();
  req.on('close', close);
  res.on('close', close);
  res.on('error', close);
};

module.exports = {
  toLiveMessage,
  addClient,
  publishChatMessage,
  publishTyping,
  publishRead,
  publishEdit,
  publishPin,
  publishReact,
  publishDelete,
  attachStream,
};
