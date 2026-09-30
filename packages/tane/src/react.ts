import { useEffect, useState } from "react";

import { dailySeed, dayKey, nextDayStart, type DayKey } from "./daily.ts";
import { mulberry32, type Random } from "./random.ts";

export type DailySeed = { readonly day: DayKey; readonly seed: number };

function today(timeZone: string): DailySeed {
  const now = new Date();
  return { day: dayKey(now, timeZone), seed: dailySeed(now, timeZone) };
}

/**
 * Today's day and seed, which change on their own at midnight in `timeZone`
 * (UTC unless named): a page left open overnight moves to the new day's
 * puzzle without a reload.
 *
 * On the server this reads the server's clock; a page rendered just before
 * midnight and hydrated just after will show the new day once it hydrates.
 */
export function useDailySeed(timeZone = "UTC"): DailySeed {
  const [value, setValue] = useState<DailySeed>(() => today(timeZone));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      setValue((previous) => {
        const next = today(timeZone);
        return next.day === previous.day ? previous : next;
      });
      const wait = nextDayStart(new Date(), timeZone).getTime() - Date.now();
      timer = setTimeout(schedule, Math.min(Math.max(wait, 0) + 50, 2 ** 31 - 1));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [timeZone]);
  return value;
}

/**
 * Something made once from a seeded stream, and made again only when the seed
 * changes: `useSeeded(seed, (random) => shuffled(random, deck))`. The stream
 * is fresh each time, so the result depends on the seed alone, never on how
 * many times the component rendered. `make` is read when the seed changes;
 * for anything else it depends on, give the component a `key`.
 */
export function useSeeded<T>(seed: number, make: (random: Random) => T): T {
  const [held, setHeld] = useState(() => ({ seed, value: make(mulberry32(seed)) }));
  if (held.seed !== seed) {
    const next = { seed, value: make(mulberry32(seed)) };
    setHeld(next);
    return next.value;
  }
  return held.value;
}
