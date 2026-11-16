'use strict';

/**
 * Sayt bo'ylab onlayn holat.
 * Chatga kirish shart emas: ochiq oyna bo'lsa odam onlayn.
 */

const OFFLINE_GRACE_MS = 4000;
const ID_RE = /^[a-f0-9]{24}$/;

const connections = new Map();
const subscribers = new Map();
const watches = new Map();
const offlineTimers = new Map();

const keyOf = (userId) => String(userId || '').trim().toLowerCase();

const isPresenceId = (userId) => ID_RE.test(keyOf(userId));

const isOnline = (userId) => {
  const bucket = connections.get(keyOf(userId));
  return Boolean(bucket?.size);
};

const writeEvent = (res, payload) => {
  res.write(`event: presence\ndata: ${JSON.stringify(payload)}\n\n`);
};

const publish = (targetId, online) => {
  const watchers = subscribers.get(targetId);
  if (!watchers?.size) return;
  const payload = { userId: targetId, online: online === true };
  for (const watcherId of [...watchers]) {
    const bucket = connections.get(watcherId);
    if (!bucket?.size) continue;
    for (const res of [...bucket]) {
      try {
        writeEvent(res, payload);
      } catch (_err) {
        bucket.delete(res);
      }
    }
  }
};

const watchPresence = (watcherId, targetId) => {
  const watcher = keyOf(watcherId);
  const target = keyOf(targetId);
  if (!isPresenceId(watcher) || !isPresenceId(target) || watcher === target) {
    return isOnline(target);
  }
  let targets = watches.get(watcher);
  if (!targets) {
    targets = new Set();
    watches.set(watcher, targets);
  }
  targets.add(target);
  let watchers = subscribers.get(target);
  if (!watchers) {
    watchers = new Set();
    subscribers.set(target, watchers);
  }
  watchers.add(watcher);
  return isOnline(target);
};

const unwatchPresence = (watcherId, targetId) => {
  const watcher = keyOf(watcherId);
  const target = keyOf(targetId);
  watches.get(watcher)?.delete(target);
  if (watches.get(watcher)?.size === 0) watches.delete(watcher);
  subscribers.get(target)?.delete(watcher);
  if (subscribers.get(target)?.size === 0) subscribers.delete(target);
};

const sendWatched = (userId, res) => {
  const targets = watches.get(keyOf(userId));
  if (!targets?.size) return;
  for (const targetId of targets) {
    try {
      writeEvent(res, { userId: targetId, online: isOnline(targetId) });
    } catch (_err) {
      break;
    }
  }
};

const markOffline = (userId) => {
  offlineTimers.delete(userId);
  if (isOnline(userId)) return;
  publish(userId, false);
};

const addConnection = (userId, res) => {
  const key = keyOf(userId);
  if (!key || !res) return () => {};
  const pending = offlineTimers.get(key);
  if (pending) {
    clearTimeout(pending);
    offlineTimers.delete(key);
  }
  let bucket = connections.get(key);
  const wasOffline = !bucket?.size;
  if (!bucket) {
    bucket = new Set();
    connections.set(key, bucket);
  }
  bucket.add(res);
  if (wasOffline) publish(key, true);
  return () => {
    bucket.delete(res);
    if (bucket.size) return;
    connections.delete(key);
    const timer = setTimeout(() => markOffline(key), OFFLINE_GRACE_MS);
    if (typeof timer.unref === 'function') timer.unref();
    offlineTimers.set(key, timer);
  };
};

const attachPresenceStream = (userId, req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write('retry: 3000\n\n');

  const remove = addConnection(userId, res);
  sendWatched(userId, res);
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
  isPresenceId,
  isOnline,
  watchPresence,
  unwatchPresence,
  attachPresenceStream,
};
