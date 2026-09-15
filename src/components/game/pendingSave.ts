/**
 * A SAVE THAT WAITS A MOMENT, AND GOES AT ONCE IF THE PAGE IS LEAVING.
 *
 * A board's appearance is kept on the member's account, and the write waits half
 * a second after a choice so that clicking through five themes to find one is one
 * save rather than five racing each other to the server — five writes in flight
 * together could land in any order and leave the account on a theme the player
 * had already moved past.
 *
 * The wait was the whole of a loss. Its timer belonged to the page, so a player
 * who chose a theme and reloaded, typed another address, closed the tab or
 * followed a link off the board inside that half-second took the timer with them,
 * and the choice was never saved: the next page drew the board the account still
 * held. `flush` is the way out of that. Called when the page is going, it sends
 * whatever is still waiting immediately, and cancels the timer, so the same value
 * is never sent twice. There is still exactly one timer; nothing is polled or
 * retried.
 */
export type PendingSave<T> = {
  /** A new value to save once the wait is over; it replaces any value still waiting. */
  set(value: T): void;
  /** Sends the waiting value now, if there is one, and stops the wait. */
  flush(): void;
};

export function pendingSave<T>(send: (value: T) => void, waitMs: number): PendingSave<T> {
  let waiting: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (waiting === null) return;
    const { value } = waiting;
    waiting = null;
    send(value);
  }

  return {
    set(value: T) {
      waiting = { value };
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, waitMs);
    },
    flush,
  };
}
