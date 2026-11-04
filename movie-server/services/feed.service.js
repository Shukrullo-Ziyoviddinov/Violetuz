const Following = require('../models/Following.model');
const { FEED_PAGE_SIZE, FEED_MAX_ITEMS } = require('../constants/feed.constants');
const { attachFeedLikeCounts } = require('../utils/reactionCounts');
const {
  loadChannelsByIds,
  loadArtistsByIds,
  fetchMoviesForChannel,
  fetchMusicForArtist,
  fetchClipsForArtist,
  fetchConcertsForArtist,
} = require('./feed/feedQueries');
const {
  mapMovie,
  mapMusic,
  mapClipOrConcert,
} = require('./feed/feedMap');

const matchesCategory = (itemType, category) => {
  if (!category || category === 'all') return true;
  return itemType === category;
};

const mapRowsWithChannel = async (rows, mapRow) => {
  const channels = await loadChannelsByIds(rows.map((doc) => doc.channelId));
  return rows.map((doc) => mapRow(doc, channels.get(String(doc.channelId || '').trim()) || null));
};

const parseCategory = (raw) => {
  const v = String(raw || 'all').trim().toLowerCase();
  if (['all', 'movie', 'music', 'klip', 'konsert'].includes(v)) return v;
  return 'all';
};

const parsePaging = (query = {}) => {
  const limitRaw = parseInt(query.limit, 10);
  const offsetRaw = parseInt(query.offset, 10);
  const limit = Number.isInteger(limitRaw)
    ? Math.min(FEED_PAGE_SIZE, Math.max(1, limitRaw))
    : FEED_PAGE_SIZE;
  const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
};

const buildPoolForUser = async (userId, category) => {
  const follows = await Following.find({ userId })
    .select('type targetId')
    .lean();

  const channelIds = follows.filter((f) => f.type === 'channel').map((f) => f.targetId);
  const artistIds = follows.filter((f) => f.type === 'artist').map((f) => f.targetId);

  const [channelsMap, artistsMap] = await Promise.all([
    loadChannelsByIds(channelIds),
    loadArtistsByIds(artistIds),
  ]);

  const wantMovies = category === 'all' || category === 'movie';
  const wantMusic = category === 'all' || category === 'music';
  const wantKlip = category === 'all' || category === 'klip';
  const wantKonsert = category === 'all' || category === 'konsert';

  const tasks = [];

  for (const channelId of channelIds) {
    const channel = channelsMap.get(String(channelId).trim());
    if (!channel) continue;

    if (wantMovies) {
      tasks.push(
        fetchMoviesForChannel(channelId).then((rows) => rows.map((doc) => mapMovie(doc, channel)))
      );
    }
  }

  for (const artistId of artistIds) {
    const artist = artistsMap.get(String(artistId));
    if (!artist) continue;

    if (wantMusic) {
      tasks.push(
        fetchMusicForArtist(artistId).then((rows) =>
          mapRowsWithChannel(rows, (doc, channel) => mapMusic(doc, artist, channel))
        )
      );
    }
    if (wantKlip) {
      tasks.push(
        fetchClipsForArtist(artistId).then((rows) =>
          mapRowsWithChannel(rows, (doc, channel) => mapClipOrConcert(doc, artist, 'klip', channel))
        )
      );
    }
    if (wantKonsert) {
      tasks.push(
        fetchConcertsForArtist(artistId).then((rows) =>
          mapRowsWithChannel(rows, (doc, channel) => mapClipOrConcert(doc, artist, 'konsert', channel))
        )
      );
    }
  }

  const chunks = await Promise.all(tasks);
  const seen = new Set();
  const pool = [];
  for (const list of chunks) {
    for (const item of list) {
      const dedupeKey = `${item.type}:${item.catalogId}`;
      if (seen.has(dedupeKey)) continue;
      if (!matchesCategory(item.type, category)) continue;
      seen.add(dedupeKey);
      pool.push(item);
    }
  }

  pool.sort((a, b) => {
    const byTime = (b.sortAt || 0) - (a.sortAt || 0);
    if (byTime !== 0) return byTime;
    return (Number(b.catalogId) || 0) - (Number(a.catalogId) || 0);
  });
  return pool.slice(0, FEED_MAX_ITEMS);
};

const listFeed = async (userId, query = {}) => {
  if (!userId) {
    return { items: [], offset: 0, limit: FEED_PAGE_SIZE, hasMore: false, total: 0 };
  }

  const category = parseCategory(query.type);
  const { limit, offset } = parsePaging(query);
  const capped = await buildPoolForUser(userId, category);
  const slice = capped.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  const hasMore = nextOffset < capped.length;
  const items = await attachFeedLikeCounts(slice, userId);

  return {
    items,
    offset,
    limit,
    hasMore,
    total: capped.length,
  };
};

module.exports = {
  listFeed,
  parseCategory,
};
