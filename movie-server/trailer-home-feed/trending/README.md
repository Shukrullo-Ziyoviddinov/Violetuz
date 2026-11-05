# General trailer trend — stage 6

This module reads only the dedicated trailer catalog/progress/actions and existing
`movieTriller` reactions. It never uses movie watch events, seed count strings,
global lifetime views or the existing movie/similar-trailers scoring functions.
No database writes, routes, scheduler or live feed wiring are added here.

## Entry points

- `buildTrendObservations({ catalog, actions, sessions, reactions, nowMs })` builds
  private viewer/trailer/UTC-day observations from server-owned source documents.
- `scoreTrailerTrending({ catalog, observations, nowMs })` computes public ranking
  rows without leaking viewer IDs. Pure functions do not mutate input.
- `createTrendingService({ readCatalog, readAccounts, readTrustedGuests? })` allows
  repository injection and testing. Source failures propagate; partial data is
  not silently treated as measured zero.
- `computeTrailerTrending({ nowMs? })` explicitly reads MongoDB and calculates an
  on-demand snapshot. Importing the root module does not load Mongoose or connect.

The configured 15-minute refresh interval is intended for later cache/job wiring;
it is not currently scheduled. All trailers/channels are returned, including
zero-score rows. Candidate limits and channel diversity belong to later stages.

## Time attribution and deduplication

Use the last 7 days and exponential decay with a 48-hour half-life. Only server
timestamps inside the requested window qualify; missing/invalid/future timestamps
are ignored instead of receiving an invented current timestamp.

Actions are deduplicated by account/event ID and collapsed to type/day. Each day
is one opportunity per viewer/trailer, regardless of opens, surfaces or sessions.
A qualified impression, actual open, played session or canonical reaction can
establish an opportunity. Direct playback is observable without inventing a card
impression. `impressionViewerDays` separately counts actual recorded impressions.

Session union coverage comes from stage 4. Its timestamp is **createdAt**, the
first server receipt, not `updatedAt`. A cumulative session's old coverage must
not become fresh just because a retry or a later snapshot touched that document.
All of a session's current cumulative evidence is conservatively attributed to
its first receipt/day. Multi-day sessions are not split: existing snapshots do
not retain a timestamp for every played segment. Old sessions outside the window
are excluded even if recently updated. For exact activity-by-minute analytics,
a future separately timestamped segment ledger would be needed. Sessions whose
latest update is after the requested cutoff are also excluded rather than used
to claim historical point-in-time reconstruction.

Reactions are current canonical rows of type `movieTriller`, with their actual
`updatedAt`. A removed like disappears; a replaced dislike does not retain the
old like vote. No reaction writes or affinity writes occur here.

One viewer/trailer/day contributes at most the configured maximum (currently 1).
Confidence and meaningful audience counts additionally deduplicate the viewer
across the WHOLE window, using their maximum decayed contribution. One viewer
returning for seven days is still one distinct viewer, not seven people. The
earliest observation timestamp anchors a daily cohort, so repeated actions do not
refresh all its old evidence.

## Scoring and small samples

For each trailer, calculate decayed opportunity mass, union coverage, completion,
positive reactions, dislikes, movie navigation and distinct meaningful viewers.
Coverage/completion/conversion rates use observed opportunity denominators;
uninterested qualified exposures therefore do not create fake positive interest.

All trailers share a measured global prior for each rate. With prior mass `P`
(initially 20), observed mass `n` and observed numerator `x`:

`smoothedRate = (x + P * observedGlobalRate) / (n + P)`

There is no fabricated prior if the source window is empty. A shared prior avoids
inverting equally exposed candidates' conversion ordering. The prior is not a
claim that a particular viewer watched anything; raw counts remain separate.

Distinct audience evidence confidence is `distinctDecayedMass / (mass + P)`.
Unique meaningful audience contributes `meaningfulDistinctMass / (mass + P)`.
The remaining components are smoothed coverage, completion, likes and movie
navigation, with weights in `trailerHomeFeedWeights.trending`. A configured dislike
penalty is subtracted; the result is multiplied by evidence confidence and clamped
to 0..1. No cohort min-max scaling promotes a single lucky sample to score 1.

Initial eligibility requires 3 distinct viewers and 2 distinct meaningful viewers.
Insufficient evidence yields score 0, not removal from the catalog. Fresh and
exploration sources will give these trailers discovery opportunities. Likewise,
impression/open-only evidence cannot earn trend via the global prior: actual
positive evidence and meaningful audience are required.

## Guest boundary

The default reader now includes server-accepted guest playback from the separate
trailer_home_guest_progress_sessions collection. sources.guests is verified-reader.
Guest viewer IDs use a separate namespace from accounts. Existing local histories
are never uploaded as global votes; only playback measured after the live server
handshake participates. Guest impressions, reactions and conversions are not
invented when no such measurements exist.

POST /api/trailer-home-guest-progress/session issues a six-hour signed playback
ticket and a signed HttpOnly anonymous identity cookie (180 days). The ticket binds
the guest, movie, trailer, duration and session ID. POST to the base path requires
both cookie and ticket, validates cumulative played intervals and caps real watch
time by server elapsed time plus a two-second scheduling tolerance. Catalog
membership is checked on start and report. Server timestamps are authoritative.
Account cookies/authorization and browser requests from unapproved origins are
rejected. Limits are 120 requests/minute/IP, 120 reports/minute/guest and 10 new
anonymous identities/hour/IP. Rate limits use the existing process-local store.

The guest collection uses optimistic cumulative merges and a unique identity index;
retries do not add views. Trend aggregation caps contributions per viewer/trailer/day
and counts a stable cookie across multiple playback sessions as one viewer.
Guest records expire after 30 days, exceeding the seven-day trend window and token
lifetime. Login neither imports guest history into accounts nor uploads old local
history. Offline/failed handshakes keep local personalization available but provide
no global guest evidence for that session. Slow handshakes only count subsequent
playback. Cookies and client measurements are not proof of distinct humans or
actual viewing; these are bounded ingestion checks, not complete bot prevention.

## Checks

`node trailer-home-feed/tests/trending.test.js` covers popularity/recency,
small-sample behavior, repeated viewing, impressions, conversions, reaction
replacement, all-channel inclusion, source failures and guest-source boundaries.
No live database is needed for these tests.
