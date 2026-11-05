import { createAccountProgressOutbox } from './accountProgressOutbox';
import { saveTrailerProgress } from './trailerProgressApi';
import { selectAuthReady, selectIsLoggedIn, selectProfile } from '../../store/slices/userSlice';

let activeStore;
let subscribers = 0;
let dispose;
const account = () => {
  const state = activeStore?.getState();
  return state && selectAuthReady(state) && selectIsLoggedIn(state) && selectProfile(state)?.id
    ? String(selectProfile(state).id) : null;
};
const outbox = createAccountProgressOutbox({ currentAccount: account,
  send: (report, signal, accountId) => saveTrailerProgress({ isLoggedIn: true, report, signal, accountId }) });

export function queueAccountProgress(accountId, report) {
  outbox.enqueue(accountId, report);
  void outbox.flush();
}

// Mounted at the persistent playback provider, even when no trailer is open.
export function attachAccountProgressSync(store) {
  subscribers++;
  if (subscribers === 1) {
    activeStore = store;
    let previous = account();
    const retry = () => { void outbox.flush(); };
    const unsubscribe = store.subscribe(() => {
      const next = account();
      if (next !== previous) {
        outbox.cancel();
        previous = next;
        // Let an aborted request settle before starting the next viewer's queue.
        void outbox.flush().then(retry);
      }
    });
    const timer = setInterval(retry, 15000);
    window.addEventListener('online', retry);
    window.addEventListener('storage', retry);
    document.addEventListener('visibilitychange', retry);
    retry();
    dispose = () => {
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener('online', retry);
      window.removeEventListener('storage', retry);
      document.removeEventListener('visibilitychange', retry);
      outbox.cancel();
      activeStore = undefined;
    };
  }
  return () => { if (--subscribers === 0) dispose(); };
}
