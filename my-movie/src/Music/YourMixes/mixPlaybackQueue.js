const sameId = (a, b) => String(a) === String(b);

const shuffleList = (list) => {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
};

/**
 * Mix navbati.
 * repeat: oxiriga yetganda boshidan.
 * shuffle: har bir qo'shiq bir marta, tartib aralash. Navbat tugasa va repeat yoqilsa yangi aralash.
 * @returns {object|null|undefined} qo'shiq, to'xtash (null), yoki mix rejimi yoqilmagan (undefined)
 */
export const takeMixTrack = (cfg, memory, currentId, direction) => {
  if (!cfg || (!cfg.repeat && !cfg.shuffle)) return undefined;
  const tracks = Array.isArray(cfg.tracks) ? cfg.tracks : [];
  if (!tracks.length) return null;

  const signature = `${cfg.shuffle ? 1 : 0}:${cfg.repeat ? 1 : 0}:${tracks.map((track) => track.id).join(',')}`;
  if (memory.signature !== signature) {
    memory.signature = signature;
    memory.queue = [];
    memory.history = [];
    memory.cycleReady = false;
    memory.lastPlayed = null;
  }

  if (memory.lastPlayed != null && !sameId(memory.lastPlayed, currentId)) {
    memory.history = [];
    memory.queue = [];
    memory.cycleReady = false;
    memory.lastPlayed = currentId;
  }

  const current = tracks.find((track) => sameId(track.id, currentId)) || null;
  const finish = (track) => {
    if (track) memory.lastPlayed = track.id;
    return track;
  };

  if (direction === 'prev') {
    const previous = memory.history.pop();
    if (previous) {
      if (cfg.shuffle && current) memory.queue.unshift(current);
      return finish(previous);
    }
    if (cfg.shuffle) return null;
    const index = tracks.findIndex((track) => sameId(track.id, currentId));
    if (index > 0) return finish(tracks[index - 1]);
    if (cfg.repeat) return finish(tracks[tracks.length - 1]);
    return null;
  }

  if (cfg.shuffle) {
    if (!memory.queue.length) {
      if (memory.cycleReady && !cfg.repeat) return null;
      const freshCycle = memory.cycleReady;
      const pool = freshCycle
        ? tracks
        : tracks.filter((track) => !sameId(track.id, currentId));
      const nextQueue = shuffleList(pool.length ? pool : tracks);
      if (freshCycle && nextQueue.length > 1 && sameId(nextQueue[0].id, currentId)) {
        const hold = nextQueue[0];
        nextQueue[0] = nextQueue[1];
        nextQueue[1] = hold;
      }
      memory.queue = nextQueue;
      memory.cycleReady = true;
      if (freshCycle) memory.history = [];
    }
    if (!memory.queue.length) return null;
    if (current) memory.history.push(current);
    return finish(memory.queue.shift());
  }

  const index = tracks.findIndex((track) => sameId(track.id, currentId));
  const nextIndex = index + 1;
  if (nextIndex >= tracks.length) {
    if (!cfg.repeat) return null;
    if (current) memory.history.push(current);
    return finish(tracks[0]);
  }
  if (current) memory.history.push(current);
  return finish(tracks[nextIndex]);
};
