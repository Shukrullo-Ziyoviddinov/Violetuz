'use strict';

const { deepFreeze } = require('../utils/freeze');

/**
 * Existing collections are read-only. Field paths live only in this file.
 *
 * Intentionally absent (this module must not read them):
 * description, video, musics.videoId, categoryName, categoryNameMusic,
 * specs, specs.countries, movieSauntrik, movieSauntrikVideo, genre.uz, genre.ru.
 *
 * Country vocabularies are not mapped:
 * movies.filterCountry uses values such as "USA" and "Britain";
 * music / clips / concerts / artists use values such as "usa" and "britaniya".
 *
 * Song-link fields that already exist on the catalogs:
 * music.clipId, clips.musicId, concerts.musicId.
 * Seed data currently leaves them null, so sync falls back to artist + title.
 */
const collections = deepFreeze({
  existing: {
    shortsVideos: {
      name: 'shortsVideos',
      type: 'movieShorts',
      fields: {
        id: 'id',
        type: 'type',
        movieId: 'movieId',
        musicId: 'musics.musicId',
      },
    },
    musicShorts: {
      name: 'musicShorts',
      type: 'musicshorts',
      fields: {
        id: 'id',
        type: 'type',
        musicId: 'musicId',
        artistId: 'artistId',
        movieId: 'movieId',
        contentType: 'contentType',
      },
    },
    movies: {
      name: 'movies',
      fields: {
        id: 'id',
        filterGenre: 'filterGenre',
        filterCountry: 'filterCountry',
        typeCategory: 'typeCategory',
        actors: 'actors',
        franchiseMovieIds: 'franchiseMovieIds',
      },
    },
    artists: {
      name: 'artists',
      fields: {
        id: 'id',
        genres: 'genres',
        country: 'country',
      },
    },
    music: {
      name: 'music',
      kind: 'music',
      fields: {
        id: 'id',
        artistId: 'artistId',
        title: 'title',
        genre: 'genre',
        country: 'country',
        language: 'language',
        clipId: 'clipId',
      },
    },
    clips: {
      name: 'clips',
      kind: 'klip',
      fields: {
        id: 'id',
        artistId: 'artistId',
        title: 'title',
        genre: 'genre',
        country: 'country',
        language: 'language',
        musicId: 'musicId',
      },
    },
    concerts: {
      name: 'concerts',
      kind: 'konsert',
      fields: {
        id: 'id',
        artistId: 'artistId',
        title: 'title',
        genre: 'genre',
        country: 'country',
        language: 'language',
        musicId: 'musicId',
      },
    },
  },
  reco: {
    shortCatalog: 'reco_short_catalog',
    songLinks: 'reco_song_links',
    watchState: 'reco_watch_state',
    events: 'reco_events',
    userProfiles: 'reco_user_profiles',
    feedSessions: 'reco_feed_sessions',
    shortStats: 'reco_short_stats',
  },
});

module.exports = collections;
