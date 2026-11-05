# Trailer home feed

The implemented stages provide the catalog, isolated progress/signals, trend, personal taste,
candidate gathering, final ranking and account/guest home endpoints. The movie
home renders an independent image-card trailer row. No feed jobs are registered.

## Boundaries

- Content comes from movie `trailersVideo` entries. Identity is the pair
  `movieId` and `trailerId`; a trailer ID alone is not globally unique.
- Genre, country, actors and channel come from the parent movie's `filterGenre`,
  `filterCountry`, `actors` and `channelId` respectively.
- Existing movie taste may be read as a confidence-controlled prior. Trailer
  events must never update movie progress, movie affinity or movie watch events.
- This module does not change `recommendation/`, `home-feed/`,
  `recommendation-triller/`, `similar-trailers/` or channel chronological lists.
- Guest and account ranking rules are identical. Guest history stays separate;
  signing in does not automatically import it.

## Configuration contract

`config/trailerHomeFeedWeights.js` exports recursively frozen configuration.
All values are initial hypotheses to evaluate, not validated optimum weights.
Durations have units in their names; shares and normalized penalties use 0..1.

Confidence counts distinct meaningfully watched trailers. Later stages must
define and validate meaningful viewing from actual played intervals, accounting
for playback speed and seeks. Opening a page, receiving duplicate reports or
reaching the end by seeking does not increment this count. The mixture interpolates
between confidence anchors and clamps beyond the final anchor. A movie-taste
prior must also respect movie-history confidence and available personal signals.

Candidate limits apply before ranking. Exploration must rotate across eligible,
underexposed channels before global truncation; final diversity cannot recover
channels already dropped from the pool. Missing channel IDs must not be treated
as a separate invented channel for every trailer.

Source shares are target proportions over a feed, not a promise that every source
has enough candidates. Redistribute unavailable slots across available sources;
never generate synthetic popularity, duplicate identities or empty placeholders.
Dislike exclusion and cooldowns apply before diversity relaxation. If too few
eligible items remain, return fewer items rather than reintroducing exclusions.

Trend rates need exposure denominators and a global prior for small samples.
Do not interpret a missing metric as a measured zero or reuse lifetime views as
recent interest. Guest participation requires a stable anonymous identity,
deduplication and abuse controls; it is not permission to count arbitrary events.

Positive engagement is capped per viewer/trailer/day. Rewatches may add bounded
interest but never inflate unique coverage. An early exit or seek alone is not
a negative preference. A dislike targets its trailer, not the parent movie's
entire genre, country or actor set.

## Catalog API

`buildTrailerCatalog(movies)` is a pure mapper. `readTrailerCatalog()` reads a
projection from the existing Movie collection and invokes that mapper. The model
is loaded only when the reader is called; importing the module does not load
Mongoose. Tests may inject `readTrailerCatalog({ movieModel })`.

Each entry includes `key` (`movieId-trailerId`, matching existing trailer view
keys), both IDs, original `trailerIndex`, localized title/video, `trillerimg`,
parent movie title, channel and dimension tokens. Genre, country and actors are
unique trimmed string arrays. Channel ownership is always taken from the movie;
unknown ownership remains `null`. An absent trailer image falls back to the
parent's existing home image.

IDs must be positive safe integers (numeric strings are accepted). A valid video
source in at least one language is required. Malformed entries and duplicate
movie/trailer pairs are skipped. No language, channel, popularity, rating, release
year or category filter is applied. Output preserves input order; the database
reader uses movie ID order for deterministic reads, not recommendation ranking.

`uploadedAt` is an ISO timestamp or `null`. A valid trailer `createdAt`, then
`uploadedAt`, takes precedence over the parent's corresponding timestamps.
`uploadTimeSource`, `trailerUploadedAt` and `movieUploadedAt` preserve provenance.
No timestamp is inferred from release year, IDs or current time. Current movie
trailer subdocuments do not define upload timestamps, so existing records normally
use the parent movie timestamp. Adding independently persisted trailer timestamps
would require a separate schema change.

Catalog tests: `node trailer-home-feed/tests/catalog.test.js` (no database needed).

## Home endpoints

- `GET /api/trailer-home-feed`: authenticated account from the session cookie.
- `POST /api/trailer-home-feed/guest`: bounded `sessions`, `actions`, `movieHistory`
  arrays; read-only request history, never imported into account collections.
- Both return `{ success, data: { generatedAt, items } }`, up to 40 cards, with
  identity, localized titles and thumbnail only. No scores, taste or video URLs.
- Responses are private/no-store; rate limit is 30 requests/minute/IP. Discovery
  uses a fresh server-owned random seed per request. There is no pagination yet.
- Existing server JSON limit remains 256 KB. Frontend caps guest payload at
  200 KB, trimming oldest entries in the request without changing local stores.
- `HomeTrailerSection` waits for auth resolution, aborts stale requests on auth
  change/unmount, shows placeholders during loading and hides empty/failed rows.
  Cards use the independent TrailerHomeCard and link to the existing movie trailer route.

See `progress/README.md` for the session protocol, collection and authenticated
progress endpoints, and `signals/README.md` for action receipts and read-only
watch/reaction feature evaluation. `trending/README.md` documents the independent
trend formula, timestamps, small-sample safeguards and guest-data boundary.
`taste/README.md` describes the separate personal profile and read-only movie prior.
`candidates/README.md` documents four-source retrieval, early channel coverage,
exposure scope and stable discovery rotation.
The home UI uses HorizontalScroll and dedicated .triller-card-style card CSS. Player watch sampling is wired to shared/mini and modal players through watch/useTrailerWatch. Impression/action reporting remains
a separate module; existing view/reaction reporting is preserved without duplicate card events.
Importing the root module still has no database or network side effects.
