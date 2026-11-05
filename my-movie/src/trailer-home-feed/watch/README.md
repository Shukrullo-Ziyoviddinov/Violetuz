# Trailer played-interval accounting (stage 3)

The pure tracker measures playback. bindTrailerWatch adapts native media events, 250ms samples and visibility changes to cumulative progress reports. useTrailerWatch connects the shared/mini player and local trailer modals to separate account/guest persistence after authentication resolves. It does not update movie watch history or existing similar-trailers behavior.

Create one tracker with a known, finite `durationSec` per trailer and playback
session. Do not reuse it for another video. If duration changes, a later adapter
must explicitly handle that change rather than silently mixing denominators.

Call `note({ event, currentTime, nowMs, playbackRate })` with numeric values.
`nowMs` is monotonic milliseconds (`performance.now()`); media time is in seconds.
The result and `snapshot()` contain copied played intervals, real watched seconds,
total played media seconds (including replays), unique watched media seconds,
rewatched media seconds and coverage in both 0..1 and 0..100 units.

## Player adapter contract

- On actual `playing`, send `playing`, then `sample` approximately every 250ms.
  A play-button click alone is not actual playback.
- Send terminal `pause`, `waiting`, `ended` and `hidden` events with the current
  media position and clock. These close a plausible final played interval and
  stop counting. A stationary playhead never earns time.
- Before a progress drag, setting `currentTime`, or a 10-second skip, flush a
  `sample` at the OLD position; send `seeking` before mutation and `seeked` after
  landing. Both boundaries discard discontinuities. Resume with `playing` only
  when actual playback resumes. Native `seeking` should also be handled as a
  safety boundary. Never treat the skipped interval as played.
- Before changing speed, flush at the OLD speed, then send `ratechange` with the
  new speed at the same position using a later clock timestamp. Normal samples
  then use that speed. A native `ratechange` alone may close a short preceding
  interval using the previously known speed. Unannounced rate changes discard
  their crossing interval rather than guessing.
- Hidden/background playback does not count toward interest. On visibility
  return send `visible`, then `playing` if video is actually running. Resume from
  the new position; do not fill the time spent hidden.
- A loop is a discontinuity: sample/finish the old pass, then start a new pass.
  Sampling gaps above the configured limit are discarded, not interpolated.
- Duplicate/stale timestamps are ignored. Invalid samples break the baseline.
  Missing seek events are additionally guarded by rate/elapsed plausibility.

At 2x, 30 real seconds can cover 60 media seconds (100% of a 60-second trailer).
Playing 0–15, skipping, then playing 30–60 covers 45 seconds (75%). Replaying an
interval increases played/rewatched seconds but does not inflate unique coverage.
Reaching the final frame alone does not mark the trailer complete.

Sampling is a client-side measurement, not proof of viewing or an anti-fraud
boundary. The progress API validates and deduplicates cumulative reports; recommendation features cap engagement. Clock
tolerance accommodates browser scheduling; it cannot distinguish an unreported
tiny seek from playback. Correct seek/rate event wiring remains necessary.

## Durable progress and final intervals

Account snapshots are synchronously written to a separate localStorage outbox
before network transmission. Keys include the account and playback-session IDs;
new cumulative reports replace older reports for that same session. A confirmed
server response deletes only the exact snapshot sent, preserving newer writes.
The persistent playback provider retries on startup, online, visibility/storage
changes and every 15 seconds, even with no active trailer. Requests time out after
15 seconds. Logout/account changes abort transmission; previous-account entries
remain until their owner signs in. The server also checks expectedAccountId against
the authenticated cookie to prevent cross-tab account changes from misattributing
queued reports. Guest history never enters the account outbox.

Local storage must be available and have free quota. Clearing browser site data
also clears pending reports; no browser-only outbox can survive that operation.
Failed storage writes leave the current adapter snapshot eligible for retry.

Shared source changes and player close dispatch trailer-watch-before-replace
before changing identity, src or the media node. The adapter closes the last
played fraction immediately and writes the snapshot synchronously. Local modal
media detaches through the same boundary. Cleanup only samples an unchanged owned
source; a replaced source can never fill the preceding trailer's intervals.

A 404 from the progress endpoint discards only the unchanged missing-trailer snapshot and continues to other videos. Network, authentication, throttling and server errors retain reports for retry. Newer snapshots and records belonging to a changed account remain untouched.

