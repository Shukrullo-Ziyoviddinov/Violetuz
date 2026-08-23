/**
 * Qidiruv uchun Mongo projection — og'ir maydonlar (description, seasons, trailers) chiqarilmaydi.
 */

const MOVIE_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  title: 1,
  homeImg: 1,
  category: 1,
  ageRestriction: 1,
  filterCountry: 1,
  filterGenre: 1,
  categoryName: 1,
  'specs.year': 1,
  'specs.countries': 1,
};

const ACTOR_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  name: 1,
  image: 1,
  'bio.text': 1,
};

const ARTIST_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  name: 1,
  img: 1,
  imgArtist: 1,
};

const MUSIC_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  title: 1,
  img: 1,
  artistId: 1,
  artist: 1,
  genre: 1,
  country: 1,
  type: 1,
  year: 1,
};

const CLIP_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  title: 1,
  img: 1,
  artistId: 1,
  genre: 1,
  country: 1,
  type: 1,
  year: 1,
};

const CONCERT_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  title: 1,
  img: 1,
  artistId: 1,
  genre: 1,
  country: 1,
  type: 1,
  year: 1,
};

const ALBUM_SEARCH_PROJECTION = {
  _id: 0,
  id: 1,
  title: 1,
  img: 1,
  artist: 1,
  artistId: 1,
  genre: 1,
  country: 1,
  type: 1,
  year: 1,
  'songs.title': 1,
  'songs.artist': 1,
};

module.exports = {
  MOVIE_SEARCH_PROJECTION,
  ACTOR_SEARCH_PROJECTION,
  ARTIST_SEARCH_PROJECTION,
  MUSIC_SEARCH_PROJECTION,
  CLIP_SEARCH_PROJECTION,
  CONCERT_SEARCH_PROJECTION,
  ALBUM_SEARCH_PROJECTION,
};
