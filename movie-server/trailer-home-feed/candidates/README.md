# Candidate gathering — stage 8

This stage retrieves four source pools and their deduplicated union. It does NOT
build the final home feed, apply experience-based source quotas, paginate, schedule
jobs or wire any player/UI. Existing movie/similar-trailer/channel algorithms are
unchanged. No writes occur here.

## Entry points

- `buildCandidatePools({ catalog, profile, trendSnapshot, exposureSnapshot,
  sessionSeed, nowMs, excludeKeys })` is the pure builder.
- `createCandidateService({ readCatalog, readProfile, readTrending, readExposure? })`
  supports injected, read-only data sources. Missing optional exposure data is
  reported as unknown. Actual reader failures propagate rather than silently
  becoming zero measurements.
- `collectAccountTrailerCandidates(userId, options)` and
  `collectGuestTrailerCandidates(history, options)` explicitly wire the earlier
  read-only profile/trend/catalog services. Guest personalization reads only the
  provided private history; general trend/exposure currently comes from accounts.
  These convenience functions perform on-demand reads, not a shared snapshot/cache
  transaction. Later feed/cache integration may reuse the injected services with
  one catalog snapshot and cached global metrics to avoid repeated database reads.

A server-owned stable session seed (16–128 alphanumeric/underscore/hyphen chars)
is required. Do not generate a new seed on every page request: keep it across the
session and generate another for a new session. Hash-based tie breaking is stable
for unchanged inputs. This is not a stored feed snapshot; changing measurements
can still change pools, so later pagination must retain the actual session feed.

## Four sources

1. Personal: positive stage-7 metadata match. A matching trailer from another
   channel is eligible. No taste produces an empty personal pool, not fake matches.
2. Trending: positive eligible stage-6 scores from a valid current snapshot.
   Future, missing or older-than-30-minute snapshots are unavailable. No lifetime
   views or seed counts are substituted.
3. Fresh: a real non-future `uploadedAt` within 30 days, with 7-day half-life.
   Release year, numeric ID and missing dates are not upload timestamps. Unknown
   dates can still enter other sources, especially exploration.
4. Exploration: all otherwise eligible trailers, with no minimum movie rating.
   Qualified impression counts prioritize underexposed entries; per-channel
   exposure is averaged across catalog inventory so volume alone is not credit.
   Equal priorities rotate with session seed. Missing/stale/invalid exposure data
   uses neutral seeded rotation and null counts, never invented zero exposure.

Measured zero means a successful, current, complete exposure snapshot had no row
for that trailer. Duplicate snapshot rows use max rather than sum. The default
reader counts unique account/trailer/UTC-day qualified impressions over 30 days,
deduplicating repeated event IDs/opens/surfaces. It reports
`scope: "account-impressions"`; guest-local exposure is not falsely claimed as
global data. `open` is not counted as an impression.

## Channel coverage before truncation

Each source groups its eligible items by canonical `channelId` before taking its
configured limit (160 personal / 100 trend / 80 fresh / 100 exploration). One item
is taken from each channel in a round before taking another from those channels.
Personal/trend/fresh channels are prioritized by their best source candidate;
exploration prioritizes underexposure and seeded channel rotation.

The normal per-source channel cap is 12. If sparse catalog inventory would leave
the pool short, balanced rounds may relax that cap ONLY after every available
eligible channel had an opportunity. This lets a one-channel catalog fill its
pool without pretending it contains many channels. Diagnostics expose relaxation.
Unknown ownership is one shared null bucket, never a made-up channel per entry.

If there are more eligible channels than slots, not every channel can appear in
one pool. Discovery rotates equal-priority channels between session seeds; this
is an opportunity mechanism, not a guarantee that every item appears in every
session. High-quality personal/trending sources keep their relevance priority.

The union interleaves source traversal, deduplicates by movie/trailer key, preserves
ALL source membership/scores, and applies channel rounds again before the global
400-candidate cap. It does not simply append exploration last and truncate it.
Returned pools are intersected with the retained union for consistent membership.
Union traversal is NOT the final recommendation order.

`profile.excludedTrailerKeys` and explicit `excludeKeys` are applied to every
source before selection. Channel-cap relaxation never brings an excluded trailer
back. Additional completion cooldowns and final per-window actor/country/genre/
movie/channel rules will be handled in stage 9.

## Output

`candidates` retain catalog metadata and add `sources`, `sourceScores` and measured
exposure (or null). `pools` contain source-specific scores/order. `sourceStats`
reports eligible counts, selected counts, channels, cap relaxation and counts
after the global cap. `sourceStatus` and `exposureScope` expose missing sources.
All four scores are bounded priorities for their own sources; exploration priority
is discovery opportunity, not a claim of measured user interest.

Tests: `node trailer-home-feed/tests/candidates.test.js`. Fixtures include unequal
channel sizes, many-channel truncation, one-channel inventory, cross-channel
matching, cold start, measured/unknown exposure, rotation, source overlap, hard
exclusions and the global cap.
