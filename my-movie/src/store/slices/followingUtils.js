export const FOLLOWING_STORAGE_KEY = 'violet_following_artists';

export const sameFollowId = (a, b) => String(a) === String(b);

export const loadLegacyFollowingIds = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FOLLOWING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.items)) {
      return parsed.items.map((x) => (typeof x === 'object' ? x.id : x)).filter((id) => id != null);
    }
    if (parsed && Array.isArray(parsed.ids)) return parsed.ids;
    return [];
  } catch {
    return [];
  }
};

const uniqueById = (list) => {
  const seen = new Set();
  return list.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/** following: id[] yoki { id, type }[] */
const normalizeEntries = (following = []) =>
  (Array.isArray(following) ? following : []).map((x) => {
    if (x != null && typeof x === 'object' && x.id != null) {
      return {
        id: String(x.id),
        type: x.type === 'actor' || x.type === 'artist' ? x.type : null,
      };
    }
    return { id: String(x), type: null };
  });

/** Profil sahifasi — obuna bo'lgan aktyor/artist ro'yxati */
export const getFollowedPeople = (following = [], lang = 'uz', actorsList = [], artistsList = []) => {
  const entries = normalizeEntries(following);
  const actors = Array.isArray(actorsList) ? actorsList : [];
  const artists = Array.isArray(artistsList) ? artistsList : [];

  const wantActor = (id) =>
    entries.some((e) => e.id === String(id) && (e.type === 'actor' || e.type == null));
  const wantArtist = (id) =>
    entries.some((e) => e.id === String(id) && (e.type === 'artist' || e.type == null));

  const followedActors = uniqueById(
    actors
      .filter((actor) => wantActor(actor.id))
      .map((actor) => ({
        id: `actor-${actor.id}`,
        followId: actor.id,
        entityType: 'actor',
        name:
          (lang === 'ru' ? actor?.name?.ru : actor?.name?.uz) ||
          actor?.name?.uz ||
          actor?.name?.ru ||
          '',
        image: actor.image || '/img/movie1.jpg',
        subscribers: actor.subscribers ?? 0,
        type: 'Movie actor',
      }))
  );

  const followedArtists = uniqueById(
    artists
      .filter((artist) => wantArtist(artist.id))
      .map((artist) => ({
        id: `artist-${artist.id}`,
        followId: artist.id,
        entityType: 'artist',
        name: artist.name || '',
        image: artist.imgArtist || artist.img || '/img/movie1.jpg',
        subscribers: artist.subscribers ?? 0,
        type: 'Music artist',
      }))
  );

  return [...followedActors, ...followedArtists];
};

/** Feed header — obuna bo'lganlar avatari */
export const getFeedHeaderFollowedPeople = (
  following,
  lang = 'uz',
  actorsList = [],
  artistsList = []
) => {
  const entries = normalizeEntries(following);
  const actors = Array.isArray(actorsList) ? actorsList : [];
  const artists = Array.isArray(artistsList) ? artistsList : [];

  const wantActor = (id) =>
    entries.some((e) => e.id === String(id) && (e.type === 'actor' || e.type == null));
  const wantArtist = (id) =>
    entries.some((e) => e.id === String(id) && (e.type === 'artist' || e.type == null));

  const followedActors = actors
    .filter((actor) => wantActor(actor.id))
    .map((actor) => ({
      key: `actor-${actor.id}`,
      followId: actor.id,
      entityType: 'actor',
      name:
        (lang === 'ru' ? actor?.name?.ru : actor?.name?.uz) ||
        actor?.name?.uz ||
        actor?.name?.ru ||
        '',
      image: actor.image || '/img/movie1.jpg',
    }));

  const followedArtists = artists
    .filter((artist) => wantArtist(artist.id))
    .map((artist) => ({
      key: `artist-${artist.id}`,
      followId: artist.id,
      entityType: 'artist',
      name: artist.name || '',
      image: artist.imgArtist || artist.img || '/img/movie1.jpg',
    }));

  return [...followedActors, ...followedArtists];
};
