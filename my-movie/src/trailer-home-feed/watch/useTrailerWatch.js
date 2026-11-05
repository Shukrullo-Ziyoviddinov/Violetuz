import { useEffect } from 'react';
import { useStore } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { selectAuthReady, selectIsLoggedIn, selectProfile } from '../../store/slices/userSlice';
import { saveTrailerProgress } from '../progress/trailerProgressApi';
import { bindTrailerWatch } from './bindTrailerWatch';
import { attachAccountProgressSync, queueAccountProgress } from '../progress/accountProgressSync';
import { createGuestTrendReporter } from '../progress/guestTrendApi';

export function useTrailerWatch(video, movieId, trailerId, source) {
  const store = useStore();
  const ready = useAppSelector(selectAuthReady);
  const loggedIn = useAppSelector(selectIsLoggedIn);
  const userId = useAppSelector(selectProfile)?.id;
  useEffect(() => attachAccountProgressSync(store), [store]);
  useEffect(() => {
    if (!ready || !video || !source || ![movieId, trailerId].every((id) => Number.isSafeInteger(Number(id)) && Number(id) > 0)) return undefined;
    const guestTrend = loggedIn ? null : createGuestTrendReporter({ isGuest: () => {
      const state = store.getState();
      return selectAuthReady(state) && !selectIsLoggedIn(state);
    } });
    return bindTrailerWatch(video, { movieId: Number(movieId), trailerId: Number(trailerId),
      onSession: (report) => guestTrend?.start(report),
      onSample: (sample, sessionId) => guestTrend?.observe(sample, sessionId),
      ownsMedia: () => video.src === new URL(source, window.location.href).href
        && (!video.dataset.miniVideoId || video.dataset.miniVideoId === `${movieId}-${trailerId}`),
      save: (report) => {
        if (loggedIn) return queueAccountProgress(userId, report);
        const state = store.getState();
        if (!selectAuthReady(state) || selectIsLoggedIn(state) !== loggedIn
          || (loggedIn && selectProfile(state)?.id !== userId)) return undefined;
        const result = saveTrailerProgress({ isLoggedIn: loggedIn, report });
        void guestTrend?.save(report);
        return result;
      } });
  }, [video, movieId, trailerId, source, ready, loggedIn, userId, store]);
}
