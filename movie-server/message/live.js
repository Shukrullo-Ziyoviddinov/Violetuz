'use strict';

/**
 * Ochiq chat sahifasiga saqlangan xabar.
 * Sahifa yangilanmaydi.
 */

const clients = new Map();

const toLiveMessage = (row) => ({
  id: String(row._id || row.id || ''),
  conversationId: String(row.conversationId || ''),
  senderId: String(row.senderId || ''),
  recipientId: String(row.recipientId || ''),
  text: String(row.text || ''),
  createdAt: row.createdAt || null,
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
  attachStream,
};
