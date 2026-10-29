'use strict';

const collections = require('../../config/collections');
const { readPath } = require('../../utils/get');
const { toFiniteNumber, blankToNull } = require('../../utils/keys');
const { projectionFrom, forEachBatch, findByIds } = require('./batch');

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const requireConnection = (connection) => {
  if (!connection || typeof connection.collection !== 'function') {
    throw new Error('shorts-reco requires the existing database connection');
  }
  return connection;
};

/**
 * @param {object|null|undefined} doc
 * @param {{ kind: string, fields: Record<string, string> }} spec
 */
const mapTrack = (doc, spec) => {
  if (!doc) return null;
  const fields = spec.fields;
  return {
    kind: spec.kind,
    id: toFiniteNumber(readPath(doc, fields.id)),
    artistId: blankToNull(readPath(doc, fields.artistId)),
    title: blankToNull(readPath(doc, fields.title)) || '',
    genre: readPath(doc, fields.genre),
    country: readPath(doc, fields.country),
    language: blankToNull(readPath(doc, fields.language)),
    musicId: fields.musicId ? toFiniteNumber(readPath(doc, fields.musicId)) : null,
    clipId: fields.clipId ? toFiniteNumber(readPath(doc, fields.clipId)) : null,
  };
};

/**
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createMusicSource = (connection) => {
  const db = requireConnection(connection);
  const { music, clips, concerts } = collections.existing;
  const specs = [music, clips, concerts];

  const loadKind = async (spec) => {
    const col = db.collection(spec.name);
    const projection = projectionFrom(spec.fields);
    const tracks = [];

    await forEachBatch(col, {
      projection,
      visitor: (docs) => {
        for (let i = 0; i < docs.length; i += 1) {
          const track = mapTrack(docs[i], spec);
          if (track && track.id != null) tracks.push(track);
        }
      },
    });

    return tracks;
  };

  return {
    /**
     * Full music, klip and konsert catalogs. Read-only.
     * @returns {Promise<object[]>}
     */
    async loadAllTracks() {
      const groups = await Promise.all(specs.map((spec) => loadKind(spec)));
      return groups.flat();
    },

    /**
     * @param {string} kind
     * @param {Array<number>} ids
     * @returns {Promise<Map<number, object>>}
     */
    async findTracksByIds(kind, ids) {
      const spec = specs.find((item) => item.kind === kind);
      if (!spec) return new Map();
      const docs = await findByIds(db.collection(spec.name), ids, {
        projection: projectionFrom(spec.fields),
        idField: spec.fields.id,
      });
      const map = new Map();
      for (let i = 0; i < docs.length; i += 1) {
        const track = mapTrack(docs[i], spec);
        if (track && track.id != null) map.set(track.id, track);
      }
      return map;
    },
  };
};

module.exports = {
  mapTrack,
  createMusicSource,
};
