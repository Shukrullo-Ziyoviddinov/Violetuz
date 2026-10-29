'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { musicKey } = require('../utils/keys');
const { minutesToMs, nowDate } = require('../utils/time');
const { createReadSources } = require('../repositories/source');
const { createCatalogRepo, chunkRecords } = require('../repositories/catalog.repo');
const { createSongLinksRepo } = require('../repositories/songLinks.repo');
const { buildSongGroups, resolveSongGroup } = require('./songLinks.service');
const { buildCatalogRecord } = require('./catalogRecord');

const musicKind = collections.existing.music.kind;
const allowedContentTypes = new Set(config.contentTypes);

/**
 * @param {Console|null|undefined} logger
 */
const wrapLogger = (logger) => {
  const base = logger || console;
  const write = (level, message, meta) => {
    if (typeof base[level] !== 'function') return;
    if (meta === undefined) base[level](message);
    else base[level](message, meta);
  };

  return {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
};

/**
 * @param {object[]} tracks
 * @returns {Map<string, Map<number, object>>}
 */
const indexTracks = (tracks) => {
  const byKind = new Map();
  for (let i = 0; i < tracks.length; i += 1) {
    const track = tracks[i];
    const key = musicKey(track.kind, track.id);
    if (!key) continue;
    let byId = byKind.get(track.kind);
    if (!byId) {
      byId = new Map();
      byKind.set(track.kind, byId);
    }
    byId.set(track.id, track);
  }
  return byKind;
};

/**
 * @param {Map<string, Map<number, object>>} trackIndex
 * @param {string|null|undefined} kind
 * @param {number|null|undefined} id
 * @returns {object|null}
 */
const lookupTrack = (trackIndex, kind, id) => {
  if (!kind || id == null) return null;
  const byId = trackIndex.get(kind);
  if (!byId) return null;
  return byId.get(id) || null;
};

/**
 * @param {Map<string, Map<number, object>>} trackIndex
 * @param {object} short
 * @returns {string|null}
 */
const shortMusicKey = (trackIndex, short) => {
  if (short.role === 'movie') return musicKey(musicKind, short.musicId);
  if (!allowedContentTypes.has(short.contentType)) return null;
  const track = lookupTrack(trackIndex, short.contentType, short.musicId);
  return track ? musicKey(track.kind, track.id) : musicKey(short.contentType, short.musicId);
};

/**
 * @param {{
 *   connection: import('mongoose').Connection|import('mongodb').Db,
 *   logger?: Console,
 *   sources?: object,
 *   catalogRepo?: object,
 *   songLinksRepo?: object,
 * }} options
 */
const createCatalogSync = (options) => {
  const logger = wrapLogger(options.logger);
  const sources = options.sources || createReadSources(options.connection);
  const catalogRepo = options.catalogRepo || createCatalogRepo(options.connection);
  const songLinksRepo = options.songLinksRepo || createSongLinksRepo(options.connection);
  let timer = null;
  let running = false;

  const syncOnce = async () => {
    const started = Date.now();
    const tracks = await sources.music.loadAllTracks();
    const grouped = buildSongGroups(tracks, {
      songLinkArtistOnly: config.songLinkArtistOnly,
    });
    const trackIndex = indexTracks(tracks);
    const groupWrite = await songLinksRepo.bulkUpsert(grouped.groups);

    const movieShorts = await sources.shorts.loadMovieShorts();
    const musicShorts = await sources.shorts.loadMusicShorts();
    const movieIds = [];
    const artistIds = [];

    for (let i = 0; i < movieShorts.length; i += 1) {
      if (movieShorts[i].movieId != null) movieIds.push(movieShorts[i].movieId);
    }
    for (let i = 0; i < musicShorts.length; i += 1) {
      const short = musicShorts[i];
      if (short.movieId != null) movieIds.push(short.movieId);
      if (short.artistId) artistIds.push(short.artistId);
    }

    const movies = await sources.movies.findByIds(movieIds);
    const artists = await sources.artists.findByIds(artistIds);
    const records = [];
    let skippedShorts = 0;
    let typeMismatches = 0;
    let invalidContentType = 0;

    const consume = (short) => {
      try {
        if (short.sourceType && short.sourceType !== short.type) typeMismatches += 1;
        if (short.role === 'music' && short.contentType && !allowedContentTypes.has(short.contentType)) {
          invalidContentType += 1;
        }

        const key = shortMusicKey(trackIndex, short);
        const kind = key ? key.slice(0, key.indexOf(':')) : null;
        const track = lookupTrack(trackIndex, kind, short.musicId);
        const movie = short.movieId == null ? null : movies.get(short.movieId) || null;
        const artist = short.role === 'music' && short.artistId
          ? artists.get(short.artistId) || null
          : null;
        const record = buildCatalogRecord({
          short,
          movie,
          track,
          artist,
          songGroupId: resolveSongGroup(grouped.byMusicKey, key),
        });

        if (!record) {
          skippedShorts += 1;
          return;
        }
        records.push(record);
      } catch (error) {
        skippedShorts += 1;
        logger.warn(
          'shorts-reco skipped a short during catalog sync',
          error && error.message ? error.message : error
        );
      }
    };

    for (let i = 0; i < movieShorts.length; i += 1) consume(movieShorts[i]);
    for (let i = 0; i < musicShorts.length; i += 1) consume(musicShorts[i]);

    const readCount = movieShorts.length + musicShorts.length;
    if (readCount > 0 && records.length === 0) {
      throw new Error('shorts-reco catalog sync produced no records from a non-empty short set');
    }

    const addedAt = nowDate();
    let catalogUpserted = 0;
    let catalogModified = 0;
    const seen = [];
    const chunks = chunkRecords(records);
    for (let i = 0; i < chunks.length; i += 1) {
      const written = await catalogRepo.bulkUpsert(chunks[i], addedAt);
      catalogUpserted += written.upserted;
      catalogModified += written.modified;
      for (let j = 0; j < chunks[i].length; j += 1) seen.push(chunks[i][j].shortId);
    }

    const catalogRemoved = await catalogRepo.removeExcept(seen);
    const songLinksRemoved = await songLinksRepo.removeExcept(
      grouped.groups.map((group) => group.songGroupId)
    );

    const summary = {
      skipped: false,
      movieShorts: movieShorts.length,
      musicShorts: musicShorts.length,
      catalogUpserted,
      catalogModified,
      catalogRemoved,
      songGroups: grouped.groups.length,
      songLinksUpserted: groupWrite.upserted,
      songLinksModified: groupWrite.modified,
      songLinksRemoved,
      typeMismatches,
      invalidContentType,
      skippedShorts,
      elapsedMs: Date.now() - started,
    };
    logger.info('shorts-reco catalog sync finished', summary);
    return summary;
  };

  const runOnce = async () => {
    if (running) {
      logger.warn('shorts-reco catalog sync skipped because a run is already active');
      return { skipped: true };
    }
    running = true;
    try {
      return await syncOnce();
    } finally {
      running = false;
    }
  };

  const start = () => {
    if (timer) return;
    const run = () => {
      runOnce().catch((error) => {
        logger.error(
          'shorts-reco catalog sync failed',
          error && error.message ? error.message : error
        );
      });
    };
    run();
    timer = setInterval(run, minutesToMs(config.catalogSyncIntervalMinutes));
    if (typeof timer.unref === 'function') timer.unref();
  };

  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  return { runOnce, start, stop };
};

module.exports = {
  createCatalogSync,
};
