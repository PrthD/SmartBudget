import { useEffect, useState } from 'react';

/**
 * How long something has been pending, as a stage: 0 before the first
 * threshold, 1 after it, 2 after the second… Used to reassure users during
 * slow requests (the free-tier API can take up to a minute to wake up).
 *
 * @param {boolean} active
 * @param {readonly number[]} thresholds  ms, ascending; keep the array stable
 */
export function useWaitStage(active, thresholds) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const timers = thresholds.map((ms, i) =>
      setTimeout(() => setStage(i + 1), ms)
    );
    return () => {
      timers.forEach(clearTimeout);
      setStage(0);
    };
  }, [active, thresholds]);
  return active ? stage : 0;
}

/** Shared timing for the "still working" messages. */
export const SLOW_WAIT_STAGES = [4_000, 20_000];
