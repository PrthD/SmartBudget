import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Button } from '@/components/ui/button';
import { LogoMark } from './Logo';

/** Route-level error boundary: a crash in one page never blanks the app. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  // A deploy can invalidate lazily-loaded chunks of an open tab.
  const staleChunk = /dynamically imported module|Failed to fetch/i.test(
    error?.message ?? ''
  );

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <LogoMark className="size-10" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">
          {notFound
            ? 'Page not found'
            : staleChunk
              ? 'A new version is available'
              : 'Something went wrong'}
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          {notFound
            ? "The page you're looking for doesn't exist."
            : staleChunk
              ? 'SmartBudget was updated. Reload to get the latest version.'
              : 'An unexpected error occurred. Your data is safe — try reloading the page.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/">Go to dashboard</Link>
        </Button>
        {!notFound && (
          <Button onClick={() => window.location.reload()}>Reload</Button>
        )}
      </div>
    </div>
  );
}
