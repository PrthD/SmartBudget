import { LogoMark } from './Logo';

export function LoadingScreen() {
  return (
    <div
      className="flex min-h-svh items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <LogoMark className="size-10 animate-pulse" />
    </div>
  );
}
