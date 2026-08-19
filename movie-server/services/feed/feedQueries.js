const Movie = require('../../models/Movie.model');
const Music = require('../../models/Music.model');
const Clip = require('../../models/Clip.model');
const Concert = require('../../models/Concert.model');
const ShortVideo = require('../../models/ShortVideo.model');
const MusicShort = require('../../models/MusicShort.model');
const Actor = require('../../models/Actor.model');
const Artist = require('../../models/Artist.model');
const { FEED_PER_TYPE_LIMIT } = require('../../constants/feed.constants');

const actorIdMatchers = (rawId) => {
  const str = String(rawId).trim();
  const num = Number(str);
  if (Number.isInteger(num) && String(num) === str) {
    return [num, str];
  }
  return [str];
};

const pickLocalized = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value.uz || value.ru || '').trim();
};

const sortAt = (doc) => {
  const oid = doc?._id;
  if (oid && typeof oid.getTimestamp === 'function') {
    return oid.getTimestamp().getTime();
  }
  return 0;
};

const latestByAutoId = (Model, filter, fields) =>
  Model.find(filter)
    .select(fields)
    .sort({ id: -1 })
    .limit(FEED_PER_TYPE_LIMIT)
    .lean();

const loadActorsByIds = async (ids) => {
  const nums = ids
    .map((id) => Number(id))
    .filter((n) => Number.isInteger(n));
  if (!nums.length) return new Map();
  const rows = await Actor.find({ id: { $in: nums } })
    .select('id name image')
    .lean();
  return new Map(rows.map((a) => [String(a.id), a]));
};

const loadArtistsByIds = async (ids) => {
  const strs = ids.map((id) => String(id).trim()).filter(Boolean);
  if (!strs.length) return new Map();
  const rows = await Artist.find({ id: { $in: strs } })
    .select('id name img imgArtist')
    .lean();
  return new Map(rows.map((a) => [String(a.id), a]));
};

const fetchMoviesForActor = (actorId) =>
  latestByAutoId(
    Movie,
    { actors: { $in: actorIdMatchers(actorId) } },
    'id title homeImg like dislike'
  );

const fetchMovieShortsForActor = async (actorId) => {
  const movies = await Movie.find({ actors: { $in: actorIdMatchers(actorId) } })
    .select('id')
    .sort({ id: -1 })
    .limit(40)
    .lean();
  const movieIds = movies.map((m) => m.id).filter((id) => id != null);
  if (!movieIds.length) return [];
  return latestByAutoId(
    ShortVideo,
    { movieId: { $in: movieIds } },
    'id movieId video description'
  );
};

const fetchMusicForArtist = (artistId) =>
  latestByAutoId(Music, { artistId: String(artistId) }, 'id title img audio artistId');

const fetchClipsForArtist = (artistId) =>
  latestByAutoId(Clip, { artistId: String(artistId) }, 'id title img like dislike artistId type');

const fetchConcertsForArtist = (artistId) =>
  latestByAutoId(
    Concert,
    { artistId: String(artistId) },
    'id title img like dislike artistId type'
  );

const fetchMusicShortsForArtist = (artistId) =>
  latestByAutoId(
    MusicShort,
    { artistId: String(artistId) },
    'id video description artistId musicId'
  );

module.exports = {
  pickLocalized,
  sortAt,
  loadActorsByIds,
  loadArtistsByIds,
  fetchMoviesForActor,
  fetchMovieShortsForActor,
  fetchMusicForArtist,
  fetchClipsForArtist,
  fetchConcertsForArtist,
  fetchMusicShortsForArtist,
};
