import { XP_EVENT_SPECS, xpPointsFor } from "@/lib/xp/xp.constants";
import type { XpEventType } from "@/lib/xp/xp.types";

/**
 * A DAY'S WORTH OF `withinAllowance` (`src/lib/xp/xpAllowance.ts`), REBUILT
 * FOR THE PROJECTION rather than called: the real function reads and writes
 * Postgres, and this simulation is deliberately pure and in-memory (per
 * AGENTS.md, "Bulk Play Runs Here" and the task's own "no database" rule).
 * The RULE is copied exactly — a real `cap` and `ridesAllowance` off
 * `XP_EVENT_SPECS`, the real prices off `xpPointsFor` — only the storage
 * differs: a `Map` that resets once a simulated day, instead of a grouped
 * query against `XpEvent`.
 *
 * One `XpDayBook` per player, cleared at the start of each simulated day.
 * `startBatch` opens one game's (or one day's non-game) worth of awards: a
 * `ridesAllowance` award pays only if `gameFinished` was paid earlier in the
 * SAME batch, exactly as `withinAllowance` decides it for one game-end call.
 */
export type XpDayBook = Map<XpEventType, number>;

export function newXpDayBook(): XpDayBook {
  return new Map();
}

export function xpBatch(book: XpDayBook) {
  let finishFailed = false;
  return {
    /** Awards `type` if the day's cap allows it, and returns what it paid (0 if capped or riding a failed finish). */
    award(type: XpEventType): number {
      const spec = XP_EVENT_SPECS[type];
      const used = book.get(type) ?? 0;
      if (spec.cap !== undefined && used >= spec.cap) {
        if (type === "gameFinished") finishFailed = true;
        return 0;
      }
      if (spec.ridesAllowance === true && finishFailed) return 0;
      book.set(type, used + 1);
      if (type === "gameFinished") finishFailed = false;
      return xpPointsFor(type);
    },
    /** Awards `type` with no cap and no allowance check — for once-only and milestone awards, which are never capped in `XP_EVENT_SPECS`. */
    awardUncapped(type: XpEventType): number {
      return xpPointsFor(type);
    },
  };
}
