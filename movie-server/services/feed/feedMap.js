const { pickLocalized, sortAt } = require('./feedQueries');

const FALLBACK_IMG = '/img/movie1.jpg';

const toFeedItem = ({
  type,
  catalogId,
  ownerType,
  ownerId,
  ownerName,
  ownerImage,
  title,
  cover,
  extra = {},
  doc,
}) => ({
  id: `${type}:${catalogId}:${ownerType}:${ownerId}`,
  type,
  catalogId,
  sortAt: sortAt(doc),
  sortKey: sortAt(doc),
  ownerType,
  ownerId,
  title: title || '',
  cover: cover || FALLBACK_IMG,
  ...(ownerType === 'actor'
    ? { actorId: ownerId, actorName: ownerName, actorImage: ownerImage || FALLBACK_IMG }
    : {
        artistId: ownerId,
        artistName: ownerName,
        artistImage: ownerImage || FALLBACK_IMG,
      }),
  ...extra,
});

const mapMovie = (doc, actor) => {
  const year = doc.specs?.year;
  const countries = Array.isArray(doc.specs?.countries)
    ? doc.specs.countries.filter(Boolean).join(', ')
    : '';
  const metaParts = [];
  if (year != null && year !== '') metaParts.push(`${year}-yil`);
  if (countries) metaParts.push(countries);

  return toFeedItem({
    type: 'movie',
    catalogId: doc.id,
    ownerType: 'actor',
    ownerId: actor.id,
    ownerName: pickLocalized(actor.name) || 'Movie actor',
    ownerImage: actor.image,
    title: pickLocalized(doc.title) || 'Movie',
    cover: pickLocalized(doc.homeImg),
    extra: {
      movieId: doc.id,
      like: doc.like,
      dislike: doc.dislike,
      createdAt: doc.createdAt || null,
      metaText: metaParts.join(' ') || '',
    },
    doc,
  });
};

const mapMusic = (doc, artist) =>
  toFeedItem({
    type: 'music',
    catalogId: doc.id,
    ownerType: 'artist',
    ownerId: artist.id,
    ownerName: artist.name || 'Music artist',
    ownerImage: artist.imgArtist || artist.img,
    title: doc.title || 'Music',
    cover: doc.img,
    extra: {
      trackId: doc.id,
      trackTitle: doc.title || 'Music',
      audio: doc.audio || '',
    },
    doc,
  });

const mapClipOrConcert = (doc, artist, type) =>
  toFeedItem({
    type,
    catalogId: doc.id,
    ownerType: 'artist',
    ownerId: artist.id,
    ownerName: artist.name || 'Music artist',
    ownerImage: artist.imgArtist || artist.img,
    title: doc.title || (type === 'konsert' ? 'Konsert' : 'Klip'),
    cover: doc.img,
    extra: {
      videoId: doc.id,
      wishlistType: type,
      videoKind: type === 'konsert' ? 'Konsert' : 'Klip',
      like: doc.like,
      dislike: doc.dislike,
      route: `/music/video/${doc.id}`,
      createdAt: doc.createdAt || null,
    },
    doc,
  });

const mapMovieShort = (doc, actor) =>
  toFeedItem({
    type: 'movieShorts',
    catalogId: doc.id,
    ownerType: 'actor',
    ownerId: actor.id,
    ownerName: pickLocalized(actor.name) || 'Movie actor',
    ownerImage: actor.image,
    title: pickLocalized(doc.description) || 'Shorts',
    cover: FALLBACK_IMG,
    extra: {
      shortsId: doc.id,
      videoId: doc.id,
      videoUrl: pickLocalized(doc.video),
      videoKind: 'Shorts',
      wishlistType: 'shorts',
      route: '/shorts',
    },
    doc,
  });

const mapMusicShort = (doc, artist) =>
  toFeedItem({
    type: 'musicshorts',
    catalogId: doc.id,
    ownerType: 'artist',
    ownerId: artist.id,
    ownerName: artist.name || 'Music artist',
    ownerImage: artist.imgArtist || artist.img,
    title: pickLocalized(doc.description) || 'Shorts',
    cover: FALLBACK_IMG,
    extra: {
      shortsId: doc.id,
      videoId: doc.id,
      videoUrl: pickLocalized(doc.video),
      videoKind: 'Shorts',
      wishlistType: 'shorts',
      route: '/music/shorts',
    },
    doc,
  });

module.exports = {
  mapMovie,
  mapMusic,
  mapClipOrConcert,
  mapMovieShort,
  mapMusicShort,
};
