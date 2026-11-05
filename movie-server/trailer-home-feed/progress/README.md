# Progress persistence — stage 4

`POST /api/trailer-home-progress` requires authentication and a cumulative report:

```json
{
  "movieId": 8001,
  "trailerId": 2,
  "sessionId": "one-stable-uuid-per-playback-session",
  "durationSec": 60,
  "intervals": [[0, 15], [30, 60]],
  "realWatchedSeconds": 30,
  "totalPlayedSeconds": 45
}
```

This example represents 45 media seconds at 1.5x: 30 real seconds and 75% unique
coverage. Client coverage/rewatch/unique counters are not trusted; they are derived
from interval unions. Reports contain cumulative snapshots, never deltas.

`GET /api/trailer-home-progress/:movieId/:trailerId` returns only the authenticated
account's summary: coverage, normalized intervals, real/played seconds and session
count. Reports cannot specify a different account. Guests cannot write to this API.
No route lists other accounts' histories or updates any movie/recommendation table.

The independent `trailer_home_progress_sessions` collection has a unique
`userId/movieId/trailerId/sessionId` index. Deploy this index before accepting
concurrent traffic (normal Mongoose model index initialization). No live database
or existing records are changed by this implementation task.

Retries retain their original session ID. Identical and older snapshots do not
add time or update last activity. Optimistic version checks and unique creation
handle overlapping requests; a bounded contention failure returns 409 and callers
may retry the same report. Contradictory non-cumulative intervals are rejected.
Starting a genuinely new playback tracker/reset requires a new session ID. Reusing
an old session ID with another duration is rejected. Session records have no TTL:
forgetting idempotency state could cause old retries to look like new watches.

Different sessions add real watch/played time but coverage is the union of
normalized media positions. This is fractional coverage of the trailer across
sessions, not an assertion that different language versions have identical cuts.
Per-session raw seconds/ranges remain available. Duration/content-version-aware
ranking can use those records later. Client-supplied duration cannot be verified
against media bytes at this stage; report bounds are not proof of human viewing.

Frontend `saveTrailerProgress` chooses account API or guest storage explicitly.
Auth readiness must be resolved first. Account failures do not fall back to guest
history. Logging in does not import guest reports. A later player integration must
bind queued reports to their original identity/session and cancel them on account
changes, not submit a previous viewer's session under current cookies.

Guest storage uses a separate `violet_trailer_home_progress_v1:` key namespace,
one key per playback session, retaining the latest 200 sessions. Coverage/totals
refer to that retained local window, not lifetime viewing. Independent tabs use
different session IDs, avoiding a single shared-history overwrite. Simultaneous
writes to the same session across tabs are not supported; one session belongs to
one tracker. Storage corruption/denial is handled without uploading guest history.

The small protocol validator is distributed in both frontend and server trees so
each can deploy independently. Keep the two protocol-v1 files identical when
changing the report contract. Limits currently accept playback up to 4x; the
validated report contains no recommendation points or meaningful-watch threshold.

Player sampling, retries/offline queues, impressions, reaction signals, trend and
affinity updates are not connected in this stage. Existing player behavior and
movie/similar-trailer algorithms remain unchanged.
