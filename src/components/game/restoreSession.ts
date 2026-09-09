import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { TIME_CONTROLS, type TimeControlName } from "@/lib/clock/clock.constants";
import type { TimeControl } from "@/lib/clock/clock.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { DEFAULT_SESSION_SETTINGS } from "./game.constants";
import { emptySeatStats, emptyStats } from "./stats";
import type { GameStats, MatchStart, SessionSettings } from "./game.types";
import { loadSnapshot, snapshotToResume, type GameSnapshot } from "./gameStorage";

/**
 * Reading a stored session back safely.
 *
 * A snapshot is JSON that some earlier version of this app wrote, so its shape
 * is whatever that version happened to have. Restoring it wholesale means any
 * field added since is simply missing, and `undefined` then travels a long way
 * before it fails — a snapshot written before clocks existed had no
 * `timeControl`, which surfaced as a crash inside `startClock`.
 *
 * So everything read back here is merged over the current defaults rather than
 * trusted. That makes adding a field safe by construction, without discarding
 * a game in progress the way a version bump would.
 */
/**
 * The game to open. A match named in the address wins; the browser's own copy
 * of that match is preferred to the server's when it is the same game — it
 * holds the redo branch, the names and the statistics — and any other stored
 * game is left alone. Without a match, the stored game resumes as before.
 */
export function restoredSnapshot(
  persist: boolean,
  fresh: boolean,
  variant: RuleVariant | undefined,
  match: MatchStart | null | undefined,
): GameSnapshot | null {
  if (match) {
    const stored = loadSnapshot();
    const same =
      stored !== null &&
      stored.settings.seed === match.snapshot.settings.seed &&
      stored.settings.variant === match.snapshot.settings.variant;
    return same ? stored : match.snapshot;
  }
  return persist ? snapshotToResume(fresh, variant) : null;
}

/**
 * The board to draw: the defaults, then the member's own if they have one,
 * then this browser's last.
 *
 * The account is laid on before the snapshot rather than after it, and that
 * is deliberate — a stored snapshot in this browser was itself written from
 * the same account, so the two normally agree, and where they do not the
 * newer choice is the one on the account, made on whichever device they used
 * last. The snapshot still wins for anything the account has never said.
 */
export function restoredAppearance(
  snapshot: GameSnapshot | null,
  account: Appearance | null = null,
): Appearance {
  return { ...DEFAULT_APPEARANCE, ...snapshot?.appearance, ...(account ?? {}) };
}

export function restoredSettings(snapshot: GameSnapshot | null): SessionSettings {
  const merged = { ...DEFAULT_SESSION_SETTINGS, ...snapshot?.session };
  return {
    ...merged,
    // A name that no longer exists must not become an undefined time control.
    timeControl: knownTimeControl(merged.timeControl),
  };
}

export function restoredStats(snapshot: GameSnapshot | null): GameStats {
  const stored = snapshot?.stats;
  if (stored === undefined) return emptyStats(0);

  return {
    startedAt: stored.startedAt ?? 0,
    bySeat: {
      one: { ...emptySeatStats(), ...stored.bySeat?.one },
      two: { ...emptySeatStats(), ...stored.bySeat?.two },
    },
  };
}

export function restoredHints(
  snapshot: GameSnapshot | null,
  perSeat: number,
): Record<"one" | "two", number> {
  return {
    one: snapshot?.hintsLeft?.one ?? perSeat,
    two: snapshot?.hintsLeft?.two ?? perSeat,
  };
}

/** Falls back to no clock rather than returning an undefined control. */
export function knownTimeControl(name: string | undefined): TimeControlName {
  return name !== undefined && name in TIME_CONTROLS
    ? (name as TimeControlName)
    : "none";
}

/** The control for a name, guaranteed to exist. */
export function timeControlFor(name: string | undefined): TimeControl {
  return TIME_CONTROLS[knownTimeControl(name)];
}
