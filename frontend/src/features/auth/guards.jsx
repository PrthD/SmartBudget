import { Navigate, Outlet, useLocation } from 'react-router';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAuth } from './hooks';

/** Renders child routes only for signed-in users. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'anonymous') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <Outlet />;
}

/** Login/register pages: bounce signed-in users to where they were going. */
export function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'authenticated') {
    const from = location.state?.from;
    // Only same-app paths: never redirect to an external URL from state.
    const target =
      typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
        ? from
        : '/';
    // Keep something on screen while the app shell chunk loads.
    return (
      <>
        <LoadingScreen />
        <Navigate to={target} replace />
      </>
    );
  }
  return <Outlet />;
}
