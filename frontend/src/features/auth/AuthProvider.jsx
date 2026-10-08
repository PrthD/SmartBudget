import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, onSessionEnd, refreshSession, setAccessToken } from '@/lib/api';
import { keys, queryClient } from '@/lib/queryClient';

export const AuthContext = createContext(null);

// A non-secret hint that this browser has signed in before. Without it there
// is no refresh cookie to try, so startup skips a guaranteed-401 request.
const HINT_KEY = 'sb:has-session';
const hint = {
  get: () => {
    try {
      return localStorage.getItem(HINT_KEY) === '1';
    } catch {
      return true;
    }
  },
  set: (on) => {
    try {
      if (on) localStorage.setItem(HINT_KEY, '1');
      else localStorage.removeItem(HINT_KEY);
    } catch {
      // Storage unavailable: we simply always attempt the refresh.
    }
  },
};

// Lets other tabs know about sign-in/sign-out so they don't act on a dead session.
const channel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('smartbudget-auth')
    : null;

/**
 * Session state: 'loading' (restoring from the refresh cookie on startup),
 * 'authenticated' or 'anonymous'. The user object lives in the React Query
 * cache under keys.me so every component reads the same copy.
 */
export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() =>
    hint.get() ? 'loading' : 'anonymous'
  );

  const startSession = useCallback(({ user, accessToken }) => {
    setAccessToken(accessToken);
    queryClient.setQueryData(keys.me, user);
    hint.set(true);
    setStatus('authenticated');
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    queryClient.clear();
    hint.set(false);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    if (hint.get()) refreshSession().then(startSession, endSession);
    const unsubscribe = onSessionEnd(endSession);
    const onMessage = ({ data }) => {
      if (data === 'logout') endSession();
      if (data === 'login') refreshSession().then(startSession, endSession);
    };
    channel?.addEventListener('message', onMessage);
    return () => {
      unsubscribe();
      channel?.removeEventListener('message', onMessage);
    };
  }, [startSession, endSession]);

  const value = useMemo(
    () => ({
      status,
      async login(credentials) {
        startSession(await api.post('/auth/login', credentials));
        channel?.postMessage('login');
      },
      async register(details) {
        startSession(await api.post('/auth/register', details));
        channel?.postMessage('login');
      },
      async logout() {
        await api.post('/auth/logout').catch(() => {});
        endSession();
        channel?.postMessage('logout');
      },
      /** After account deletion: the server already revoked everything. */
      forceLogout() {
        endSession();
        channel?.postMessage('logout');
      },
    }),
    [status, startSession, endSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
