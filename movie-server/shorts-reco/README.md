# Shorts recommendation

Isolated feed for `shortsVideos` (`movieShorts`) and `musicShorts` (`musicshorts`). It does not change movie, music, or home-feed ranking.

The router is mounted at `/shorts-reco` on both `/api` and `/api/v1`.

## API

Auth is optional (`optionalAuth`). The user id is `String(req.authUser._id)`. With no user, `POST /events` is ignored and `GET /feed` is a cold start.

### `POST /api/shorts-reco/events`

```json
{
  "eventId": "33333333-3333-4333-8333-333333333333",
  "shortId": 1,
  "passRatio": 0.95,
  "playedMsDelta": 4000,
  "completionsDelta": 1,
  "liked": false,
  "commented": false,
  "shared": false,
  "ts": "2026-08-10T00:00:00.000Z"
}
```

`shortId` may be the numeric id or the catalog id (`movieShorts:1`, `musicshorts:10001`). A numeric id that matches both types is not found. `liked`, `commented`, `shared`, `completionsDelta`, and `ts` may be omitted. An omitted flag keeps the previous value.

| Status | Meaning |
| --- | --- |
| 200 | `{ success, shortId, score }` |
| 204 | No user, or this `eventId` was already stored |
| 400 | `{ success: false, message, errors }` |
| 404 | The short is not in `reco_short_catalog` |

One user and one short keep a single watch aggregate. The same `eventId` does not score again.

### `GET /api/shorts-reco/feed?sessionId=&position=0&limit=20`

`position` is the short currently on screen (default 0). `limit` defaults to 20 and is capped at 20.

```json
{
  "success": true,
  "sessionId": "…",
  "frozenUntil": 3,
  "items": [
    {
      "shortId": "movieShorts:1",
      "slot": "explore",
      "anchorKey": null,
      "type": "movieShorts",
      "contentType": null,
      "movieId": 1,
      "artistId": "a",
      "musicKey": null,
      "repeat": false,
      "short": { "id": 1, "type": "movieShorts", "video": "…" }
    }
  ]
}
```

`short` is the stored source row, attached so the client can play it. Scoring does not read `description`, `video`, or the other fields excluded from catalog sync. A missing source row yields `"short": null`.

Send `sessionId` and `position` on the next request. Items through `position` stay as they were. The next 3 stay frozen. Items after `frozenUntil` are rebuilt. A short is not repeated inside one session.

Cold start (no user, or fewer than 3 watches) alternates movie and music shorts. One or two watches also mix in a profile pick every 3rd item.

## Collections

Existing collections are read only. New collections use the `reco_` prefix.

| Collection | Role |
| --- | --- |
| `reco_short_catalog` | One row per short. `shortId` is `type:numericId` |
| `reco_song_links` | Song groups (`catalogRef`, else artist + normalized title) |
| `reco_watch_state` | One aggregate per user and short |
| `reco_events` | Accepted `eventId`s. TTL 7 days |
| `reco_user_profiles` | Long-term weights, session window, anchor multipliers |
| `reco_feed_sessions` | Frozen feed. TTL 2 days |
| `reco_short_stats` | Views, completions, likes, comments, shares |

Indexes are created on those collections only. `reco_feed_sessions.updatedAt` expires after 2 days. `reco_events.createdAt` expires after 7 days.

Anchor halving is stored on the profile as `anchorMultipliers`, `anchorLocks`, `anchorFatigue`, and `anchorPinned`, so a later feed request does not halve the same anchor again.

## Config

Tunables live in `config/index.js`. Field names for existing documents live in `config/collections.js`.

Knobs used most often:

- `catalogSyncIntervalMinutes` (15)
- `feedBatchSize` (20), `slotsPerCycle` (10), `frozenAhead` (3)
- `repeatAfterDays` (7), `maxRepeatsPer10` (2)
- `coldStartMinViews` (3), `coldStartProfileEvery` (3), `exploreShare` (0.15)
- `levels` for weak / medium / strong / very strong
- `anchorHalveFactor` (0.5)
- `eventsTtlDays` (7), `feedSessionTtlDays` (2)

Country and genre strings are stored as they are. Movies (`USA`, `Britain`) and music (`usa`, `britaniya`) are not mapped onto each other. The same is true for genre vocabularies.

Song groups prefer `music.clipId`, `clips.musicId`, and `concerts.musicId`. Otherwise the same artist and normalized title are grouped, and only when at least two kinds are present. `songLinkArtistOnly` stays false. A title match does not join a group that is already linked by catalog ids.

`language` is stored as `musicLanguage` and is not used by the rules.

## Sync and tests

From the repository root, with `movie-server/.env` pointing at the database:

```bash
node movie-server/shorts-reco/scripts/syncCatalog.js
```

The server also calls `startCatalogSync()` after the database connects. That creates indexes and rebuilds the catalog on the same interval.

Tests do not need a database:

```bash
node movie-server/shorts-reco/tests/run.js
```

`tests/http.test.js` is the HTTP integration test. It uses an in-memory connection, posts one event, and reads a frozen feed.
