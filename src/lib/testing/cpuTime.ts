/**
 * How many milliseconds of this process's own CPU a piece of work used.
 *
 * A speed test asks whether the work is light enough for a browser, which is a
 * question about the work. The wall clock answers a different one, how busy the
 * machine was: the local gate runs its lanes side by side and agents build
 * beside it, and a test timed by `performance.now()` failed there at a load of
 * forty while passing alone. Vitest runs each file in a fork of its own, so the
 * fork's user and system time is this test's work and nobody else's.
 */
export function cpuMs(work: () => void): number {
  const before = process.cpuUsage();
  work();
  const used = process.cpuUsage(before);
  return (used.user + used.system) / 1000;
}

/** This process's CPU so far, in milliseconds: read it before and after a piece of work, as `performance.now()` would be, to time the work and not the machine. */
export function cpuNow(): number {
  const used = process.cpuUsage();
  return (used.user + used.system) / 1000;
}
