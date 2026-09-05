/**
 * JSDoc typedefs for the music recommendation engine.
 *
 * @module recommendation-music/types
 */

'use strict';

/**
 * @typedef {'music'|'album'|'clip'|'concert'} MusicContentType
 *
 * @typedef {Object} MusicContent
 * @property {number|string} id
 * @property {MusicContentType} contentType
 * @property {string} contentKey — `${contentType}:${id}`
 * @property {string} categoryNameMusic
 * @property {string} [genre]
 * @property {string} [country]
 * @property {string} [language]
 * @property {string|number} [artistId]
 * @property {string|number} [like]
 * @property {number} [year]
 * @property {number} [releaseYear]
 * @property {number} [rating]
 * @property {number} [durationSec]
 *
 * @typedef {Object} AffinityDimension
 * @property {string} type
 * @property {string} weightKey
 * @property {boolean} [isCombo]
 * @property {(content: MusicContent) => string[]} extractValues
 *
 * @typedef {Object.<string, Object.<string, number>>} AffinityMap
 *
 * @typedef {Object} ScoredMusic
 * @property {MusicContent} content
 * @property {number} score
 * @property {boolean} [coldStart]
 * @property {Object} [breakdown]
 *
 * @typedef {Object} MusicScoringWeightsConfig
 * @property {number} genre
 * @property {number} country
 * @property {number} language
 * @property {number} artist
 * @property {number} comboGenreCountry
 * @property {number} comboGenreArtist
 * @property {number} comboLanguageCountry
 * @property {number} popularity
 * @property {number} rating
 * @property {number} recency
 * @property {number} listenedPenalty
 * @property {number} duplicateListenCap
 * @property {Object} progress
 * @property {Object} decay
 * @property {string[]} likeEnabledTypes
 * @property {number} topN
 * @property {Object} diversity
 * @property {Object} contentFields
 * @property {string[]} contentTypes
 * @property {Object} dimensionTypes
 * @property {string} comboSeparator
 */

module.exports = {};
