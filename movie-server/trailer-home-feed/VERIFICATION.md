# Acceptance verification

Checked 2026-11-06. Configuration weights were not changed.

## Automated checks

- Server: 94 tests across catalog, progress, signals, trend, personal taste,
  candidates, final ranking and HTTP routes; all passed.
- Frontend: 70 tests across played intervals, guest/account persistence, signals,
  feed transport and home rendering; all passed.
- Playback tests cover 1x/1.5x/2x, speed changes, progress scrubbing, 10-second
  skips, pause/buffering, hidden tabs and replay without duplicate coverage.
- Account/guest tests cover scoped identity, no guest upload on account requests,
  aborted stale requests, idempotent reports and separate movie/trailer histories.
- Ranking tests cover cold/warm/established shares, multi-channel windows,
  exact-key deduplication, cooldowns, dislike exclusions and sparse relaxation.

## Local catalog acceptance run

Run from `movie-server`: `node scripts/verifyTrailerHomeFeed.js`.
This script reads local `data/movie.json`; it does not connect to production or
read/write user data. It uses 30 deterministic seeds and checks hard exclusions,
unique identities and explicit relaxation of channel/movie rules.

Observed catalog: 140 trailers from 140 movies, one known channel, no missing
images, and 140 missing upload timestamps. Every run returned 40 distinct
trailers from that channel. All 39 adjacent pairs necessarily shared the channel;
the ranker explicitly recorded those relaxed constraints. No movie repetition
relaxation was needed. With no supplied engagement or timestamps, all 40 items
came from exploration; no personal taste, trend or publication date was invented.

This is a local-data finding. MongoDB may have `createdAt` values absent from
seed JSON; the offline result does not establish production timestamp coverage.
Multiple-channel behavior is covered by synthetic tests, not this one-channel
catalog. This is correctness validation, not recommendation-quality evaluation.

## Before tuning weights from real outcomes

Player played-interval tracking is now attached to shared/mini and modal trailer players. Dedicated adapter tests cover speed changes, seeks, hidden tabs, source ownership and account isolation. Card/action reporting remains separate; existing view and reaction behavior is preserved. Do not tune using missing measurements as zeros.

Evaluate new viewers, low-history viewers and established viewers separately.
Compare qualified-impression-to-meaningful-watch rate, actual coverage and real
watch seconds, trailer-to-movie transitions, channel exposure share, repeated
content and constraint relaxation rates. Disclose sample counts, time windows
and uncertainty; compare one config change at a time against a baseline. Keep
exact-key deduplication, identity isolation and hard exclusions invariant.

Guest ingestion tests exercise signed anonymous identity, playback tickets, elapsed-time checks, origin/account rejection, stable identity across sessions, retry deduplication, identity creation throttling and HTTP-to-trending flow with an in-memory progress model. Live MongoDB/browser end-to-end verification remains separate.

Four-row Home verification: one shared request supplies four groups of ten in ranked order, with links to /recommended/trailers. Continuation tests cover 455 unique identities across pages, fixed per-session seeds, replayed/concurrent cursors, account scope, session expiration/eviction and diversity across page boundaries. Frontend tests cover Home-to-recommendations reuse, continuation deduplication, expired-session refresh and aborted requests on account changes. Browser/live MongoDB verification remains separate.
