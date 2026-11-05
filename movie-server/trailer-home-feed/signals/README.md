# Interest signals — stage 5

The collector and feature reader are isolated from all existing recommendation,
movie progress, trailer playback and reaction-writing code.

## Actions and deduplication

Authenticated `POST /api/trailer-home-signals` accepts `movieId`, `trailerId`,
`eventId`, `type`, `surface`. Action types are `impression`, `open`, `openMovie`.
Surfaces are `home`, `channel`, `similar`, `trailer-page`. A validated movie/trailer
pair must exist. Identity comes from authentication, timestamps from the server.

Create one random `eventId` per actual action and preserve it for retries. A unique
`userId/eventId` index in `trailer_home_signal_actions` prevents replaying the same
event, even across midnight. Concurrent duplicate-key errors are safe no-ops.
New actual opens may create separate receipts but collapse to one feature per
viewer/trailer/type/UTC day. No running points counter is incremented.

An impression requires at least 50% visible area and 1000ms of foreground exposure.
It awards zero interest points; it is a denominator/exposure signal. Rendering or
mounting a card is not an impression. A future DOM adapter must measure continuous
foreground visibility and reset its timer when the card leaves view/page hides.
The API's input checks do not prove that a client measured visibility honestly.

`openMovie` is emitted only on explicit navigation from a trailer to its parent
movie. It is not emitted for merely opening the trailer, navigating elsewhere or
autoplay, and does not mark a movie watched. Opening and qualifying an impression
are separate actions: do not synthesize an impression from every open.

## Read-only watch and reaction features

`GET /api/trailer-home-signals/:movieId/:trailerId` returns today's deduplicated
action features, lifetime retained trailer watch summary and current reaction.
Watch flags are computed from the separate stage-4 persisted sessions, never from
client-supplied `meaningfulWatch`/`completion` claims or a playhead maximum.

Initial configurable thresholds:

- Meaningful: at least 25% union coverage and 3 real seconds; for short videos the
  real-time minimum is reduced to the time needed for that fraction at the allowed
  maximum speed. 1x/1.5x/2x watches therefore remain valid.
- Completion: at least 90% coverage and meaningful viewing.
- Rewatch: meaningful viewing plus at least 10% additional played coverage. Its
  contribution is capped, not multiplied by repeat count.

Existing `user_reactions` is read only using type **`movieTriller`** and target
**`movieId-trailerId`**. This is the canonical type used by the existing trailer
LikeButton; `movie`, `triller` and seed `like`/`dislike` count strings are not the
viewer's reaction. Removing a like yields no reaction contribution; replacing it
with dislike replaces the choice rather than accumulating points. Guest reaction
state is `none`, matching the current authentication-required LikeButton.

`deriveSignalState` recomputes boolean features and bounded contributions. A
dislike takes precedence for this trailer; it does not penalize all its actors,
genres or country. Impression-only and early-exit behavior does not establish a
negative genre preference. No affinity table is updated in this stage.

The returned `interestScore` is a bounded current feature score, **not** an event
delta, lifetime sum or daily trend observation. Repeated reads must never be added
together. Watch is lifetime/session-union state, actions are today's UTC features,
reaction is current state. Stage 6 must build time-windowed trend observations
with explicit timestamps/denominators; it must not insert lifetime watch state as
a new daily watch merely because this endpoint was read again.

## Guest and integration boundaries

Frontend `createTrailerSignalAction` and `saveTrailerSignal` prepare and persist
the action. Guests use an independent `violet_trailer_home_signal_v1:` namespace
with 30-day / 600-event retention; account errors never fall back to it and login
never imports it. A retry ID is remembered only while its local receipt remains;
a future offline queue must expire stale actions rather than replay them after
that retention horizon. Account receipts have no TTL. Keep the unique indexes
installed before concurrent production writes.

The frontend/backend protocol files are intentionally identical distributions
for independent deployment; keep them synchronized when changing the contract.
Frontend guest reads return local action/watch features without fabricating an
account score. Later guest recommendations can evaluate validated local history.

No observers, click handlers, player hooks, navigation/reaction hooks or home feed
are wired in this stage. The API and explicit collectors are ready for integration.
Existing like/dislike writes and all existing algorithms remain unchanged.
