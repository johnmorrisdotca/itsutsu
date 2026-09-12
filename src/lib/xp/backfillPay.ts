import type { Streak } from "@/lib/rating/streak";

import { XP_EVENTS, XP_EVENT_SPECS, xpPointsFor } from "./xp.constants";
import { xpDayKey } from "./xpDay";
import type { XpAward, XpEventType } from "./xp.types";
import type {
  BackfillMember,
  BackfillReason,
  HeldEvent,
  LedgerDisagreement,
  PlannedAward,
  PlannedBatch,
} from "./backfillXp.types";

/**
 * What `awardXp` would make of a batch, predicted — and the one check that says
 * a replay landed.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE TWO RULES A CALLER CANNOT REACH
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `backfillXp.ts` decides what history asks for, entirely out of the wiring's
 * own rules. This file is the other half of a plan: what the WRITER would
 * answer, which is two rules living inside `awardXp` where nothing else can
 * call them —
 *
 * - **the day's allowance**: `cap` events of a type per member per day, and
 *   `ridesAllowance`, which silences an award whose finish the allowance
 *   refused;
 * - **the unique index** on `(memberId, type, subject)`, which is how often an
 *   award may ever happen.
 *
 * Both are restated here, and the restatement is deliberately narrow. The
 * NUMBERS are not forked: `cap`, `ridesAllowance` and every price come off
 * `XP_EVENT_SPECS`, the same table `withinAllowance` reads, and the day is
 * `xpDayKey` in the member's own zone. What is restated is the six-line walk
 * that applies them, and the fact that a row already in `XpEvent` is refused.
 *
 * **Why restate anything at all.** A plan that cannot say what it would pay is
 * not a plan. A dry run has to print a total before anybody agrees to a write,
 * and the three biggest awards on the site — `everyVariantPlayed` at 500,
 * `everyGradeBeaten` at 250, `everyFamilyPlayed` at 200 — are decided by
 * counting ledger rows as of the game that completed the set. Omitting them
 * would make the dry run's total quietly low by up to 950 a member.
 *
 * **Why it is safe.** It is not load-bearing. The runner hands `awardXp` the
 * FULL list of awards history asked for and lets the real index and the real
 * allowance decide; this only predicts their verdict, and the runner then
 * compares what was actually paid against what was predicted and reports any
 * difference. That is the shape `backfillStreaks.play.test.ts` uses — a rebuild
 * believed only where it reproduces the stored record — rather than a second
 * authority over the ledger.
 */

/** The composite keys, with the separator written as its escape and never as the byte. */
export const heldKey = (type: string, subject: string): string => `${type}\0${subject}`;
const dayTypeKey = (dayKey: string, type: string): string => `${dayKey}\0${type}`;

const bump = (counts: Map<string, number>, key: string): void => {
  counts.set(key, (counts.get(key) ?? 0) + 1);
};

/**
 * The history one member carries through the replay.
 *
 * `run` is the played-scope run — every decided game, rated or not — because
 * that is the column `recordPlayed` writes and therefore the run a milestone is
 * read off. The other three are the ledger as the replay has it: what has been
 * paid, how much of each day's allowance has gone, and how many of each kind
 * the member holds.
 */
export type MemberState = {
  run: Streak | null;
  held: Set<string>;
  perDay: Map<string, number>;
  counts: Map<string, number>;
};

/**
 * The state each member starts the replay in, seeded from the rows already in
 * the ledger.
 *
 * Seeded for two reasons that are easy to conflate. The obvious one is
 * IDEMPOTENCY: an award already paid must not be counted again in what a dry
 * run says it would pay, which is what makes a second run plan nothing. The
 * second is that three awards are COUNTS of ledger rows, so a member who has
 * met eleven games since 0.162.0 and meets the other twenty-eight in the replay
 * has to arrive at thirty-nine. A replay counting only its own writes would
 * never complete a set.
 */
export function seedStates(held: readonly HeldEvent[]): Map<string, MemberState> {
  const states = new Map<string, MemberState>();
  for (const row of held) {
    const state = stateIn(states, row.memberId);
    state.held.add(heldKey(row.type, row.subject));
    bump(state.perDay, dayTypeKey(row.dayKey, row.type));
    bump(state.counts, row.type);
  }
  return states;
}

/** One member's state, made empty on first sight. */
export function stateIn(states: Map<string, MemberState>, memberId: string): MemberState {
  const held = states.get(memberId);
  if (held !== undefined) return held;
  const fresh: MemberState = { run: null, held: new Set(), perDay: new Map(), counts: new Map() };
  states.set(memberId, fresh);
  return fresh;
}

/** How many of a kind this member holds — what the collected awards count. */
export function heldCount(state: MemberState, type: XpEventType): number {
  return state.counts.get(type) ?? 0;
}

/**
 * One batch with the writer's two verdicts predicted — or null when the writer
 * would pay nothing.
 *
 * Null rather than an empty batch, because the runner walks this list and calls
 * `awardXp` for each entry: a batch worth nothing is a query for an answer
 * already known, and on a second run that is every batch there is. It is also
 * what makes "running it twice pays nothing" something the PLAN says, rather
 * than something only a write can discover.
 *
 * The order of the two verdicts is `withinAllowance`'s order and it matters: the
 * allowance is applied first and the index second, so an award already earned
 * still settles `gameFinished`'s verdict for the awards that ride it.
 *
 * The state is advanced as it goes, which is the whole reason this is not a
 * pure predicate. A day's allowance and a unique index are both statements
 * about what has already been paid, so a batch has to leave its mark on the
 * member before the next one is decided.
 */
export function predict({
  member,
  at,
  reason,
  awards,
  state,
}: {
  member: BackfillMember;
  at: Date;
  reason: BackfillReason;
  awards: XpAward[];
  state: MemberState;
}): PlannedBatch | null {
  const dayKey = xpDayKey(at, member.timeZone);
  const paying: PlannedAward[] = [];
  /* Whether this batch's finish was paid, for the awards that ride it. Null is
     "not asked", which is not the same as "refused" — see `withinAllowance`. */
  let finishPaid: boolean | null = null;

  for (const award of awards) {
    const subject = award.subject ?? "";
    const spec = XP_EVENT_SPECS[award.type];

    if (spec.cap !== undefined && (state.perDay.get(dayTypeKey(dayKey, award.type)) ?? 0) >= spec.cap) {
      if (award.type === XP_EVENTS.gameFinished) finishPaid = false;
      continue;
    }
    if (spec.ridesAllowance === true && finishPaid === false) continue;
    if (award.type === XP_EVENTS.gameFinished) finishPaid = true;

    /* The index. An award already held is refused by Postgres, not by a rule
       here — this only predicts that refusal so a dry run can print a total. */
    if (state.held.has(heldKey(award.type, subject))) continue;

    paying.push({ type: award.type, subject, points: xpPointsFor(award.type) });
    state.held.add(heldKey(award.type, subject));
    /* Counted only where a ROW is written, because the count this models is the
       one `withinAllowance` reads back out of the table. */
    bump(state.perDay, dayTypeKey(dayKey, award.type));
    bump(state.counts, award.type);
  }

  if (paying.length === 0) return null;
  return {
    memberId: member.id,
    at,
    dayKey,
    reason,
    awards,
    paying,
    points: paying.reduce((total, award) => total + award.points, 0),
  };
}

/**
 * Every member whose total does not equal their own ledger.
 *
 * `XP_DESIGN.md` names this as the one thing a backfill needs that the design
 * did not have, and as the only way to know a replay landed. The runner asks it
 * twice — before anything is written, where a disagreement is a reason to
 * refuse outright, and after, where one is a fault this run caused.
 *
 * Pure, so it can be checked without a database, and it takes a MAP of sums
 * rather than reading them: a member with no events at all comes out as nought
 * rather than as missing, because `xp: 40` over an empty ledger is exactly the
 * disagreement being looked for.
 */
export function ledgerDisagreements(
  members: readonly { id: string; name: string; xp: number }[],
  ledger: ReadonlyMap<string, number>,
): LedgerDisagreement[] {
  return members.flatMap((member) => {
    const sum = ledger.get(member.id) ?? 0;
    if (sum === member.xp) return [];
    return [{ memberId: member.id, name: member.name, xp: member.xp, ledger: sum }];
  });
}
