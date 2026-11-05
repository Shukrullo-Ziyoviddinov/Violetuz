# Personal trailer taste — stage 7

Read-only, on-demand profile construction. No existing movie affinity/progress
write functions, similar-trailer algorithm or channel chronological ordering is
called or changed. No new player integration, feed route, background job or
candidate filtering is registered in this stage.

## API

- `buildPersonalTaste({ catalog, sessions, actions, reactions, moviePrior, nowMs })`
  is a pure builder for ONE viewer's validated/scoped history.
- `scoreTrailerTaste(trailer, profile)` returns an average weighted metadata match
  and its dimension components. It does not select, mix or diversify candidates.
- `createPersonalTasteService({ readCatalog, readAccountData, readMovieMetadata })`
  provides separately scoped `.account(userId)` and `.guest(history)` builders.
- `accountPersonalTaste(userId, options)` and `guestPersonalTaste(history, options)`
  explicitly wire real read-only repositories. Importing the module remains free
  of Mongoose/database side effects.

Profile `dimensions` and `trailerDimensions` contain sorted `{ value, score }`
arrays for genre, country, actor, genreCountry and genreActor, normalized to 0..1.
Combination tokens are unambiguous JSON pairs `[genre,country]` / `[genre,actor]`.
Matching averages a candidate's dimension values so a large cast does not receive
a higher score simply by having more actor IDs. Missing dimension matches are 0.
The matching helper returns 0 for a currently excluded disliked trailer; final
cooldown/eligibility enforcement still belongs to candidate/ranking stages.

## Trailer evidence

The catalog supplies parent `filterGenre`, `filterCountry`, `actors`. Client
genre/country/actor claims are ignored. `channelId` is retained in the catalog,
but it is NOT a required personal match: another channel's matching trailer gets
the same metadata score. Candidate/channel coverage rules are later stages.

Use the last 180 days with a 30-day half-life. Watch coverage is derived from the
stage-4 played ranges, not the maximum playhead or number of page opens. Session
IDs are deduplicated. First receipt time anchors cumulative sessions; changing
`updatedAt` does not turn old full coverage into a fresh complete watch.

Partial sessions on different days may jointly achieve a meaningful/completion
milestone. The first crossing establishes its time. Already-achieved milestones
do not refresh when someone later watches only one second. A new meaningful daily
watch can refresh meaningful interest; actual repeated watching has bounded credit.

Each signal type contributes its strongest decayed observation per trailer,
rather than growing on every read/retry/open. Impressions contribute nothing.
Reactions use the existing canonical `movieTriller` / `movieId-trailerId` current
state. Removing a like removes its like contribution. Dislike removes that
trailer's positive contribution and supplies a cooldown exclusion key, but does
not subtract from all its genre/country/actor affinities.

For dimension learning, one movie contributes at most its strongest trailer's
positive evidence (configured cap 2.5). Multiple trailers or sessions of that film
therefore do not multiply genre/cast credit. Its credit is divided among unique
tokens per dimension. Different positively viewed films may reinforce the same
values, with a per-value cap. This profile is recomputed, not added to an existing
affinity table.

## Movie taste as a bounded prior

Account movie affinity and quality history are read only from existing
`recommendation_user_affinity`, `recommendation_user_movie_progress` and current
`user_reactions` movie likes. Trailer events never enter these collections.

A distinct quality movie needs at least 300 watched seconds and 30% completion,
or a current movie like. Distinct IDs are deduplicated and decayed with a 45-day
half-life; initial confidence saturates at 20 effective quality movies. Raw
affinity rows without supporting history do not activate a prior. Missing/future
timestamps and non-positive scores do not become fabricated evidence.

Existing `genre_country` (`country::genre`) and `genre_actor` (`genre::actor`)
keys are translated on read. Repeated cells across categories use their maximum
decayed score, not their sum. Source data and source scoring weights are unchanged.

`movieShare = 0.35 * movieConfidence * (1 - trailerConfidence)`

Trailer confidence is the decayed count of distinct meaningfully watched trailers
divided by the final confidence-anchor count (currently 20), capped at 1. Replaying
one trailer does not become twenty distinct experiences. There must be usable
movie dimension cells; an empty prior cannot dilute trailer taste. The movie share
is never renormalized upward when trailer evidence is absent. As trailer evidence
grows, the prior fades toward zero. Configuration values remain tuning hypotheses.

`confidence` exposes trailer, movie-prior and combined values. `sourceShares` are
dimension blend weights, not proof that either source has usable content;
`hasPersonalTaste` indicates actual availability. Feed source allocation is not
implemented here and must account for that availability in the later mixer.

## Guest boundary

Guests use only their supplied bounded private histories: up to 200 trailer
sessions, 600 actions and 200 movie history entries. A guest movie completion
record must meet 30%; if seconds are provided they must also meet 300 seconds.
The legacy guest movie format does not always retain seconds, so completion-only
records are accepted for a private, confidence-limited prior, not global trends.
Movie dimensions are always loaded by ID from server metadata, not from local
history fields. Future timestamps and invalid records are ignored.

No account history or reactions are read by the guest path; the current LikeButton
requires login, so guest reactions are not invented. Guest inputs affect only that
guest's profile, never global trend or account/movie tables. Logging in does not
import this data. Frontend guest progress receipts now preserve `createdAt` as
well as `updatedAt`; legacy local receipts use their existing timestamp rather
than inventing the time they were read.

Tests: `node trailer-home-feed/tests/personalTaste.test.js`. All account tests
use read-only injected repositories; no live database mutations are performed.
