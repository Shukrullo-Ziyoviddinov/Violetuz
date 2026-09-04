/**
 * Recommendation engine — shared JSDoc types (no runtime exports).
 *
 * Field mapping for this project:
 *   category  → movie.categoryName
 *   genres    → movie.filterGenre (string[])
 *   country   → movie.filterCountry (string)
 *   actors    → movie.actors (number[] | string[])
 *
 * @module recommendation/types
 */

'use strict';

/**
 * @typedef {'genre'|'country'|'actor'|'genre_country'|'genre_actor'|string} DimensionType
 */

/**
 * Minimal movie shape used by the scoring engine (projection, not full Movie doc).
 * @typedef {Object} Movie
 * @property {number|string} id
 * @property {string} categoryName
 * @property {string[]} [filterGenre]
 * @property {string} [filterCountry]
 * @property {Array<number|string>} [actors]
 * @property {number} [rating]
 * @property {number} [ratingImdb]
 * @property {number} [ratingKinopoisk]
 * @property {number} [popularityScore]
 * @property {number} [releaseYear]
 * @property {{ year?: number }} [specs]
 * @property {string|number} [like]
 */

/**
 * @typedef {Object} WatchEvent
 * @property {string} userId
 * @property {number|string} movieId
 * @property {string} category
 * @property {number} [completionRate]  // 0..1
 * @property {boolean} [liked]
 * @property {Date|string} [watchedAt]
 */

/**
 * One affinity cell for a user × category × dimension value.
 * @typedef {Object} UserAffinity
 * @property {string} userId
 * @property {string} category
 * @property {DimensionType} dimensionType
 * @property {string} dimensionValue
 * @property {number} affinityScore
 * @property {Date|string} [updatedAt]
 */

/**
 * Precomputed recommendation row.
 * @typedef {Object} UserRecommendation
 * @property {string} userId
 * @property {string} category
 * @property {number|string} movieId
 * @property {number} score
 * @property {Date|string} [generatedAt]
 */

/**
 * Generic affinity dimension — scoring engine loops over these.
 * New dimensions (director, language, …) = add one object, no if/else branches.
 *
 * @typedef {Object} AffinityDimension
 * @property {DimensionType} type
 * @property {string} [weightKey]  // key in scoringWeights, e.g. 'genre' | 'comboGenreCountry'
 * @property {(movie: Movie) => string[]} extractValues
 * @property {boolean} [isCombo]
 */

/**
 * Lookup map: dimensionType → dimensionValue → affinityScore
 * @typedef {Object.<string, Object.<string, number>>} AffinityMap
 */

/**
 * @typedef {Object} ScoreBreakdown
 * @property {number} genre
 * @property {number} country
 * @property {number} actor
 * @property {number} comboGenreCountry
 * @property {number} comboGenreActor
 * @property {number} popularity
 * @property {number} rating
 * @property {number} recency
 * @property {number} watchedPenalty
 * @property {number} final
 * @property {boolean} [coldStart]
 * @property {Object.<string, number>} [byType]
 */

/**
 * @typedef {Object} ScoredMovie
 * @property {Movie} movie
 * @property {number} score
 * @property {ScoreBreakdown} [breakdown]
 * @property {boolean} [coldStart]
 * @property {number} [alpha]
 * @property {number} [experienceCount]
 * @property {number} [personalizedScore]
 * @property {number} [trendingScore]
 * @property {number} [normalizedPersonalizedScore]
 * @property {number} [normalizedTrendingScore]
 * @property {string} [trendingSource]
 */

/**
 * @typedef {Object} RecommendationResult
 * @property {string} userId
 * @property {string} category
 * @property {ScoredMovie[]} items
 * @property {'cache'|'realtime'|'cold_start'} source
 * @property {Date|string} [generatedAt]
 */

/**
 * @typedef {Object} DecayConfig
 * @property {number} halfLifeDays
 * @property {number} minScore
 * @property {number} maxScore
 * @property {number} watchBoost
 * @property {number} likedBoost
 * @property {number} completionWeight
 */

/**
 * @typedef {Object} DiversityConfig
 * @property {number} maxSharePerActor
 * @property {number} maxSharePerCountry
 * @property {number} repeatPenalty
 * @property {'range'|'absolute'} [penaltyScale]
 * @property {number} windowSize
 * @property {number} maxRepeatsInWindow
 */

/**
 * @typedef {Object} MovieFieldMapping
 * @property {string} category
 * @property {string} genres
 * @property {string} country
 * @property {string} actors
 */

/**
 * @typedef {Object} DimensionTypeIds
 * @property {string} genre
 * @property {string} country
 * @property {string} actor
 * @property {string} genreCountry
 * @property {string} genreActor
 */

/**
 * @typedef {Object} CategoryTrendingScore
 * @property {string} category
 * @property {string} movieId
 * @property {number} viewCountRecent
 * @property {number} avgWatchDuration
 * @property {number} likeCount
 * @property {number} completionRateAvg
 * @property {number} trendingScore
 * @property {Date} [updatedAt]
 */

/**
 * @typedef {Object} ProgressConfig
 * @property {number} minWatchedSeconds
 * @property {number} shortFilmCompleteRatio
 * @property {number} affinityMinDelta
 */

/**
 * @typedef {Object} BlendConfig
 * @property {'linear'|'exponential'} strategy
 * @property {number} confidenceThreshold
 * @property {number} confidenceK
 * @property {number} qualityMinCompletion
 * @property {'minmax'|'none'} [normalizeMode]
 * @property {number} [personalNormCap]
 */

/**
 * @typedef {Object} TrendingConfig
 * @property {number} windowDays
 * @property {number} precomputeIntervalMs
 * @property {number} wViews
 * @property {number} wAvgDuration
 * @property {number} wLikes
 * @property {number} wCompletion
 * @property {boolean} usePopularityFallback
 * @property {boolean} [invalidateUserCacheWhenNewer]
 * @property {number|null} [userCacheMaxAgeMs]
 */

/**
 * @typedef {Object} ScoringWeightsConfig
 * @property {number} genre
 * @property {number} country
 * @property {number} actor
 * @property {number} comboGenreCountry
 * @property {number} comboGenreActor
 * @property {number} popularity
 * @property {number} rating
 * @property {number} recency
 * @property {number} watchedPenalty
 * @property {number} duplicateWatchCap
 * @property {ProgressConfig} progress
 * @property {{ ttlDays?: number|null }} [watchEvent]
 * @property {DecayConfig} decay
 * @property {number} topN
 * @property {number} candidatePoolSize
 * @property {BlendConfig} blend
 * @property {TrendingConfig} trending
 * @property {DiversityConfig} diversity
 * @property {MovieFieldMapping} movieFields
 * @property {DimensionTypeIds} dimensionTypes
 * @property {string} comboSeparator
 */

module.exports = {};
