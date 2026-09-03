import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsLoggedIn,
  selectAuthReady,
  selectProfile,
} from '../store/slices/userSlice';
import {
  hydrateLikesFromServer,
  setLikesStatus,
  clearLikes,
} from '../store/slices/likesSlice';
import {
  fetchReactions,
  fetchLikeHistory,
  replaceReactionsRequest,
} from '../api/reactionApi';
import { mapServerReactionsToStore } from '../reactions/reactionKeys';

const buildMigrateItems = (state) => {
  const items = [];
  const reactions = state?.reactions || {};
  Object.entries(reactions).forEach(([key, value]) => {
    if (value !== 'like' && value !== 'dislike') return;
    if (key.startsWith('persist:movie_')) {
      items.push({
        id: key.slice('persist:movie_'.length),
        type: 'movie',
        value,
      });
    } else if (key.startsWith('persist:video_')) {
      items.push({
        id: key.slice('persist:video_'.length),
        type: 'klip',
        value,
      });
    } else if (key.startsWith('persist:triller-')) {
      items.push({
        id: key.slice('persist:triller-'.length),
        type: 'triller',
        value,
      });
    } else if (key.startsWith('trailer:')) {
      items.push({
        id: key.slice('trailer:'.length),
        type: 'movieTriller',
        value,
      });
    }
  });
  (state?.shortsLikedIds || []).forEach((id) => {
    items.push({ id, type: 'shorts', value: 'like' });
  });
  return items;
};

const ReactionsBootstrap = () => {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);
  const likesState = useAppSelector((s) => s.likes);
  const migratedRef = useRef(false);
  const wasLoggedInRef = useRef(false);
  const likesRef = useRef(likesState);
  likesRef.current = likesState;
  const prevProfileIdRef = useRef(profile?.id || null);

  useEffect(() => {
    if (!authReady) return undefined;

    if (!isLoggedIn) {
      if (wasLoggedInRef.current) {
        dispatch(clearLikes());
      }
      wasLoggedInRef.current = false;
      migratedRef.current = false;
      return undefined;
    }

    wasLoggedInRef.current = true;

    // Aktiv account (profile.id) o'zgarganda likes/dislikes ham qayta yuklaymiz.
    const currentProfileId = profile?.id || null;
    if (prevProfileIdRef.current !== currentProfileId) {
      migratedRef.current = false;
      dispatch(clearLikes());
      prevProfileIdRef.current = currentProfileId;
    }
    let cancelled = false;

    (async () => {
      dispatch(setLikesStatus('loading'));
      try {
        let data = await fetchReactions();
        if (cancelled) return;
        let items = Array.isArray(data?.items) ? data.items : [];

        const local = likesRef.current;
        const hasLocal =
          Object.keys(local.reactions || {}).length > 0 ||
          (local.shortsLikedIds || []).length > 0;

        if (items.length === 0 && hasLocal && !migratedRef.current) {
          migratedRef.current = true;
          const migrated = await replaceReactionsRequest(buildMigrateItems(local));
          if (cancelled) return;
          items = Array.isArray(migrated?.items) ? migrated.items : [];
          const history = Array.isArray(migrated?.history)
            ? migrated.history
            : (await fetchLikeHistory())?.history || [];
          dispatch(
            hydrateLikesFromServer({
              ...mapServerReactionsToStore(items),
              history,
            })
          );
          return;
        }

        const historyData = await fetchLikeHistory();
        if (cancelled) return;
        dispatch(
          hydrateLikesFromServer({
            ...mapServerReactionsToStore(items),
            history: Array.isArray(historyData?.history) ? historyData.history : [],
          })
        );
      } catch {
        if (!cancelled) dispatch(setLikesStatus('error'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, profile?.id, dispatch]);

  return null;
};

export default ReactionsBootstrap;
