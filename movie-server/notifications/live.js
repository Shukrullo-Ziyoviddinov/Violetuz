/**
 * Ochiq sahifaga xabar.
 * Yozuv saqlangach shu foydalanuvchining ochiq ulanishlariga ketadi.
 */

'use strict';

const clients = new Map();

const toLiveItem = (row) => ({
  id: String(row._id || row.id || ''),
  type: row.type,
  actor: {
    id: String(row.actor?.id || ''),
    name: String(row.actor?.name || ''),
    username: String(row.actor?.username || ''),
    avatar: String(row.actor?.avatar || ''),
  },
  readAt: row.readAt || null,
  createdAt: row.createdAt || null,
});

const addClient = (userId, res) => {
  const key = String(userId || '').trim();
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

const publishNotification = (userId, item) => {
  const bucket = clients.get(String(userId || '').trim());
  if (!bucket?.size || !item) return 0;
  const payload = `event: notification\ndata: ${JSON.stringify(item)}\n\n`;
  let sent = 0;
  for (const res of [...bucket]) {
    try {
      res.write(payload);
      sent += 1;
    } catch (_err) {
      bucket.delete(res);
    }
  }
  if (!bucket.size) clients.delete(String(userId || '').trim());
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
  toLiveItem,
  addClient,
  publishNotification,
  attachStream,
};
