const Movie = require('../models/Movie.model');
const Actor = require('../models/Actor.model');
const Music = require('../models/Music.model');
const Album = require('../models/Album.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Artist = require('../models/Artist.model');
const { searchContentByQuery } = require('../utils/searchAlgorithm');

const searchAll = async (query, contentLang = 'uz') => {
  const [actors, movies, music, albums, clips, concerts, musicArtists] = await Promise.all([
    Actor.find().lean(),
    Movie.find().lean(),
    Music.find().lean(),
    Album.find().lean(),
    Clip.find().lean(),
    Concert.find().lean(),
    Artist.find().lean(),
  ]);

  return searchContentByQuery(query, contentLang, 40, {
    actors,
    movies,
    music,
    albums,
    clips,
    concerts,
    musicArtists,
  });
};

module.exports = {
  searchAll,
};
