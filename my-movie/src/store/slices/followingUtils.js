import { actors } from '../../data/actors';
import { artists } from '../../dataMusic/artists';

export const FOLLOWING_STORAGE_KEY = 'violet_following_artists';

export const sameFollowId = (a, b) => String(a) === String(b);

export const loadLegacyFollowingIds = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FOLLOWING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

/** Profil sahifasi — obuna bo'lgan aktyor/artist ro'yxati */
export const getFollowedPeople = (ids = [], lang = 'uz') => {
  const normalized = new Set(ids.map((id) => String(id)));

  const followedActors = uniqueById(
    actors
      .filter((actor) => normalized.has(String(actor.id)))
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
      .filter((artist) => normalized.has(String(artist.id)))
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
export const getFeedHeaderFollowedPeople = (ids, lang = 'uz') => {
  const normalized = new Set(ids.map((id) => String(id)));

  const followedActors = actors
    .filter((actor) => normalized.has(String(actor.id)))
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
    .filter((artist) => normalized.has(String(artist.id)))
    .map((artist) => ({
      key: `artist-${artist.id}`,
      followId: artist.id,
      entityType: 'artist',
      name: artist.name || '',
      image: artist.imgArtist || artist.img || '/img/movie1.jpg',
    }));

  return [...followedActors, ...followedArtists];
};
