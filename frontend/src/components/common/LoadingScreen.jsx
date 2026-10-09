import { SLOW_WAIT_STAGES, useWaitStage } from '@/hooks/use-wait-stage';
import { LogoMark } from './Logo';

const MESSAGES = [
  null,
  'Getting things ready…',
  'Still working on it. This can occasionally take up to a minute.',
];

export function LoadingScreen() {
  const message = MESSAGES[useWaitStage(true, SLOW_WAIT_STAGES)];
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center"
      role="status"
      aria-label="Loading"
    >
      <LogoMark className="size-10 animate-pulse" />
      {message && (
        <p className="text-muted-foreground animate-in fade-in text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
