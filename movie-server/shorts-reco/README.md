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
  "final": true,
  "viewId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "seq": 1,
  "ts": "2026-08-10T00:00:00.000Z"
}
```

`shortId` may be the numeric id or the catalog id (`movieShorts:1`, `musicshorts:10001`). A numeric id that matches both types is not found. `liked`, `commented`, `shared`, `completionsDelta`, `final`, `viewId`, `seq`, and `ts` may be omitted. An omitted flag keeps the previous value. An omitted `final` means `true`.

`viewId` is a new uuid each time a short is opened. `seq` starts at 1 and increases inside that `viewId`. A later event with a lower or equal `seq` for the same `viewId` is ignored. A new `viewId` is a new viewing.

| Status | Meaning |
| --- | --- |
| 200 | `{ success, shortId, score }` |
| 204 | No user, duplicate `eventId`, stale `seq`, or more than 20 events for that short in one minute |
| 400 | `{ success: false, message, errors }` |
| 404 | The short is not in `reco_short_catalog` |

One user and one short keep a single watch aggregate. The same `eventId` does not score again. `final: false` can only raise the score. A skip (`-1`) is stored when `final: true` and no earlier event in that aggregate already has a higher pass ratio. Like, comment, and share count on the event that carries them, including `final: false`.

`completions` increases only by `completionsDelta`. A `passRatio` of 0.9 or more still scores as one completion, so the two are not added together. An event with no `viewId` still stores one completion when `passRatio` is at least 0.9, which keeps older clients working.

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

Send `sessionId` and `position` on the next request. The first request may also send `focus` (the opened short id). A new session then starts with that short, so the player index matches the feed. Items through `position` stay as they were. The next 3 stay frozen. Items after `frozenUntil` are rebuilt only when the profile version changed and at least 5 seconds have passed since the last rebuild. If the tail after the frozen range is shorter than `limit`, it is filled anyway. An unchanged profile returns the stored list. A short is not repeated inside one session. Scrolled items stay in the session so the player can move back.

Cold start (no user, or fewer than 3 watches) alternates movie and music shorts. One or two watches also mix in a profile pick every 3rd item.

### `GET /api/shorts-reco/shelf?type=movieShorts&block=0&limit=10`

Page cards only. `type` is `movieShorts` or `musicshorts`. `block` is the row index (0–20). `limit` defaults to 10 and is capped at 10.

The score is the same profile score as the feed. The row keeps one type, drops shorts seen in the last 7 days, and does not follow the feed's slot order. Block 0 is the strongest matches. The next block continues that list, so a short is not repeated on the next row. Fewer than 10 cards means the type ran out. Opening a card and scrolling still uses `GET /feed`.

## Collections

Existing collections are read only. New collections use the `reco_` prefix.

| Collection | Role |
| --- | --- |
| `reco_short_catalog` | One row per short. `shortId` is `type:numericId` |
| `reco_song_links` | Song groups (`catalogRef`, else artist + normalized title) |
| `reco_watch_state` | One aggregate per user and short. `isProvisional`, `lastViewId`, `lastSeq`, `lastEventAt`, `recentEventAts` |
| `reco_events` | Accepted `eventId`s. TTL 7 days |
| `reco_user_profiles` | Long-term weights, session window, anchor multipliers, `version` |
| `reco_feed_sessions` | Frozen feed. TTL 2 days. `builtWithProfileVersion`, `lastRebuildAt` |
| `reco_short_stats` | Views, completions, likes, comments, shares |

Indexes are created on those collections only. `reco_feed_sessions.updatedAt` expires after 2 days. `reco_events.createdAt` expires after 7 days.

Anchor halving is stored on the profile as `anchorMultipliers`, `anchorLocks`, `anchorFatigue`, and `anchorPinned`, so a later feed request does not halve the same anchor again.

## Config

Tunables live in `config/index.js`. Field names for existing documents live in `config/collections.js`.

Knobs used most often:

- `catalogSyncIntervalMinutes` (15)
- `feedBatchSize` (20), `slotsPerCycle` (10), `frozenAhead` (3)
- `progressMilestones` (0.4, 0.7), `maxEventsPerShortPerMinute` (20), `eventRateWindowMs` (60000)
- `feedRebuildMinIntervalSeconds` (5), `provisionalScoring` (true)
- `repeatAfterDays` (7), `maxRepeatsPer10` (2)
- `coldStartMinViews` (3), `coldStartProfileEvery` (3), `exploreShare` (0.15)
- `levels` for weak / medium / strong / very strong
- `anchorHalveFactor` (0.5)
- `eventsTtlDays` (7), `feedSessionTtlDays` (2)

Country and genre strings are stored as they are. Movies (`USA`, `Britain`) and music (`usa`, `britaniya`) are not mapped onto each other. The same is true for genre vocabularies.

Song groups prefer `music.clipId`, `clips.musicId`, and `concerts.musicId`. Otherwise the same artist and normalized title are grouped, and only when at least two kinds are present. `songLinkArtistOnly` stays false. A title match does not join a group that is already linked by catalog ids.

`language` is stored as `musicLanguage` and is not used by the rules.

Old watch rows without `isProvisional` count as finished watches. Old profiles without `version` count as version 0. Old feed sessions without `builtWithProfileVersion` count as version 0.

`version` increases when a watch is saved. Saving anchor multipliers on a feed request does not increase it. A session-window row is updated in place by `shortId`. Fatigue ignores a watch while `isProvisional` is true. `lastSeenAt` is set on every accepted event, so the 7-day gap starts immediately, while the open session still keeps the scrolled shorts.

## Client contract

The player is not part of this module. A client that wants the feed to move while a short is open should do the following.

- Create a new `viewId` each time a short is opened. Send `seq` starting at 1, increasing by 1 for that `viewId`.
- Send `final: false` once when playback reaches 0.4, once at 0.7, and `completionsDelta: 1` once when the short finishes. Do not send other ratios just to hit those marks; a like can arrive at any ratio.
- Send like, comment, and share or save immediately with `final: false`.
- When the viewer leaves the short (next, leave the page, or the app goes to the background), send `final: true` with `playedMsDelta` since the last send and `completionsDelta: 0` if there is no new completion. Use `sendBeacon` or `fetch` with `keepalive` on page hide.
- Do not send an event for a skip under 1500 ms that has no like, comment, or share.
- Count real playback time. Do not count seeks. Do not send events while the page is hidden.
- Call `GET /feed` when the on-screen short changes and again near the end of the loaded list. Pass the same `sessionId` and the new `position`. The first call may pass `focus` so the opened short is first. Keep items through the on-screen short and the next 3. Replace only the tail.

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
