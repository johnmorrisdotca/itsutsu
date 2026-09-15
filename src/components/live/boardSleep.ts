/**
 * WHEN A LIVE BOARD STOPS ASKING, AND WHEN IT STARTS AGAIN — the timing and
 * nothing else, with no React and no document in it, so a unit test can hold
 * it with fake timers.
 *
 * Something happening "stirs" the board: a change arriving on it, or the
 * reader doing anything at all. Once `idleMs` pass with nothing stirring it,
 * it goes to sleep and says so through `onSleep`. The next stir wakes it, and
 * `stir` answers true for exactly that one — the stir that woke it — because
 * that is when the board is out of date and should ask at once.
 *
 * ONE TIMER, NOT ONE PER STIR. A stir only writes the time down; the timer,
 * when it fires, measures how long it has really been quiet and sets itself
 * again for whatever is left. Moving a mouse across a board is not a reason
 * to clear and set a timeout, and a keypress is not a render.
 */
export type BoardSleep = {
  /** Something happened. True when it woke a sleeping board. */
  stir: () => boolean;
  /** Whether the board has stopped asking. */
  asleep: () => boolean;
  /** Stops watching for good; nothing is called after this. */
  stop: () => void;
};

export function boardSleep({
  idleMs,
  onSleep,
  now = () => Date.now(),
}: {
  idleMs: number;
  onSleep: () => void;
  now?: () => number;
}): BoardSleep {
  let last = now();
  let sleeping = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function arm(wait: number) {
    if (stopped) return;
    timer = setTimeout(check, wait);
  }

  function check() {
    timer = null;
    const quiet = now() - last;
    if (quiet >= idleMs) {
      sleeping = true;
      onSleep();
      return;
    }
    arm(idleMs - quiet);
  }

  arm(idleMs);

  return {
    stir() {
      last = now();
      if (!sleeping || stopped) return false;
      sleeping = false;
      arm(idleMs);
      return true;
    },
    asleep: () => sleeping,
    stop() {
      stopped = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
    },
  };
}
