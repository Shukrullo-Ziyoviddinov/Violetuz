export const FOLLOWING_STORAGE_KEY = 'violet_following_artists';

export const FOLLOW_TYPES = ['actor', 'artist', 'channel', 'user'];

export const normalizeFollowType = (type) => (FOLLOW_TYPES.includes(type) ? type : null);

export const followButtonType = (entityType) =>
  entityType === 'actor' || entityType === 'channel' || entityType === 'user' ? entityType : 'artist';

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
        type: normalizeFollowType(x.type),
      };
    }
    return { id: String(x), type: null };
  });

const userFollowRow = (row) => {
  const snap = row.snapshot && typeof row.snapshot === 'object' ? row.snapshot : {};
  const username = String(snap.username || '').trim().replace(/^@+/, '');
  return {
    id: `user-${row.id}`,
    followId: row.id,
    entityType: 'user',
    name: snap.name || username || '',
    image: snap.avatar || '',
    type: username ? `@${username}` : 'Foydalanuvchi',
  };
};

/** Foydalanuvchi obunalari yoki obunachilari — snapshotdan. */
export const mapUserFollowRows = (rows = []) =>
  uniqueById(
    (Array.isArray(rows) ? rows : [])
      .filter((row) => row && row.type === 'user' && row.id != null)
      .map(userFollowRow)
  );

export const isOwnUserFollow = (person, profileId) =>
  person?.entityType === 'user' &&
  profileId != null &&
  profileId !== '' &&
  String(person.followId) === String(profileId);

/** Ko‘rayotgan odam ro‘yxatda bo‘lsa, o‘zini tepaga chiqaradi. Qolgan tartib saqlanadi. */
export const pinViewerFirst = (people = [], profileId) => {
  if (profileId == null || profileId === '' || !Array.isArray(people) || people.length < 2) {
    return people;
  }
  const index = people.findIndex((person) => isOwnUserFollow(person, profileId));
  if (index <= 0) return people;
  const next = people.slice();
  const [viewer] = next.splice(index, 1);
  next.unshift(viewer);
  return next;
};

/** Profil sahifasi — obuna bo'lgan aktyor/artist/kanal/odam ro'yxati */
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

  const followedChannels = uniqueById(
    (Array.isArray(following) ? following : [])
      .filter((row) => row && typeof row === 'object' && row.type === 'channel' && row.id != null)
      .map((row) => {
        const snap = row.snapshot && typeof row.snapshot === 'object' ? row.snapshot : {};
        return {
          id: `channel-${row.id}`,
          followId: row.id,
          entityType: 'channel',
          name: snap.name || '',
          image: snap.avatar || '/img/newlogo.jpg',
          subscribers: snap.subscribers ?? 0,
          type: 'Kanal',
        };
      })
  );

  return [...followedActors, ...followedArtists, ...followedChannels, ...mapUserFollowRows(following)];
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

/** Feed header — following snapshot (to‘liq katalog shart emas) */
export const getFeedHeaderFromFollowingItems = (followingItems = [], lang = 'uz') => {
  const list = Array.isArray(followingItems) ? followingItems : [];
  return list
    .map((row) => {
      if (!row || row.id == null) return null;
      const snap = row.snapshot && typeof row.snapshot === 'object' ? row.snapshot : {};
      if (row.type === 'actor') {
        const nameObj = snap.name && typeof snap.name === 'object' ? snap.name : null;
        return {
          key: `actor-${row.id}`,
          followId: row.id,
          entityType: 'actor',
          name:
            (lang === 'ru' ? nameObj?.ru : nameObj?.uz) ||
            nameObj?.uz ||
            nameObj?.ru ||
            (typeof snap.name === 'string' ? snap.name : '') ||
            '',
          image: snap.image || '/img/movie1.jpg',
        };
      }
      if (row.type === 'artist') {
        return {
          key: `artist-${row.id}`,
          followId: row.id,
          entityType: 'artist',
          name: snap.name || '',
          image: snap.imgArtist || snap.img || '/img/movie1.jpg',
        };
      }
      if (row.type === 'channel') {
        return {
          key: `channel-${row.id}`,
          followId: row.id,
          entityType: 'channel',
          name: snap.name || '',
          image: snap.avatar || '/img/newlogo.jpg',
        };
      }
      return null;
    })
    .filter(Boolean);
};
