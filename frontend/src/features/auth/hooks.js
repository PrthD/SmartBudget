import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { keys } from '@/lib/queryClient';
import { AuthContext } from './AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/** The signed-in user (seeded by login/refresh, refetched when invalidated). */
export function useCurrentUser() {
  const { status } = useAuth();
  const { data } = useQuery({
    queryKey: keys.me,
    queryFn: () => api.get('/users/me'),
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  });
  return data;
}

/** The user's currency and time zone with safe defaults. */
export function usePreferences() {
  const user = useCurrentUser();
  return {
    currency: user?.preferences?.currency ?? 'CAD',
    timezone: user?.preferences?.timezone ?? 'America/Edmonton',
    aiEnabled: Boolean(user?.preferences?.aiEnabled),
  };
}
