import { botTierFor } from "@/lib/bots/bots";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { playedSides, type PlayedSide } from "@/lib/rating/playedRun";
import { STREAK_KINDS, extendStreak } from "@/lib/rating/streak";

import { XP_EVENTS } from "./xp.constants";
import { isWeekend, xpWeekKey } from "./xpDay";
import {
  NO_OPPONENT,
  XP_GRADES_TO_BEAT,
  XP_VARIANTS_TO_PLAY,
  gameAwards,
  otherSeat,
  variantOf,
  type Opponent,
} from "./xpGame";
import { heldCount, heldKey, predict, seedStates, stateIn, type MemberState } from "./backfillPay";
import type { XpEventType } from "./xp.types";
import type {
  BackfillBuddy,
  BackfillGame,
  BackfillInput,
  BackfillMember,
  BackfillPlan,
  BackfillReason,
  MemberPlan,
  PlannedBatch,
} from "./backfillXp.types";

/**
 * What a live site WOULD have paid, decided without a database.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY A BACKFILL HAS TO BE A REPLAY, AND WHY IT IS PURE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XP_DESIGN.md` argues it under "Nobody's XP is backfilled, and that is a
 * decision": half a backfill is easy — a hundred and sixteen games times a
 * finish and a win is an afternoon — and the other half is not, because
 * `firstOfVariant`, `firstOfFamily`, `revengeWin` and the win streaks are
 * **ordered facts**. They depend on what had already happened when each game
 * ended. Pay them out of order and the totals are a different number from the
 * one the rules would have produced, which is a ladder nobody can check.
 *
 * So this walks the games oldest first and carries the history forward, and it
 * is a pure function for the same reason `engine.ts` is: a replay whose answer
 * depends on a database cannot be checked against a table of cases, and the one
 * thing this has to be is checkable.
 *
 * `backfillPay.ts` predicts what the writer would make of each batch;
 * `backfillXp.play.test.ts` is the half that reads the rows and pays.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EVERY RULE IS THE WIRING'S OWN RULE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Nothing here decides what a game is worth. `playedSides` says whose run a
 * game moves and which way; `extendStreak` carries the run forward, which is
 * the one implementation of "one more result" on the site; `gameAwards` says
 * what a finished game pays; `isWeekend` and `xpWeekKey` answer what day it was
 * for that member; `botTierFor` says what is in the other seat; `variantOf`
 * refuses a variant this deploy cannot name. All imported. A backfill that
 * restated any of them would produce a total the running site disagrees with,
 * and the disagreement would be invisible.
 *
 * The two rules that ARE restated — the day's allowance and the unique index —
 * live in `backfillPay.ts` with the whole argument for why, and with the
 * reconciliation that keeps them from being load-bearing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * `playedAt` IS THE MOMENT, AND IT IS NOT QUITE THE FINISH
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A replay needs an instant per game: it is the order, it is the `dayKey` every
 * award is filed under, and it decides `weekendGame`. `Game` offers three dates
 * and none of them is "when this finished":
 *
 * - **`playedAt`** is the game's own moment, `@default(now())` at creation. It
 *   is what `/history` sorts by, it is what `backfillStreaks.play.test.ts`
 *   orders by, and **it cannot move after the fact**.
 * - `updatedAt` is `@updatedAt`, so it moves on any later write to the row —
 *   hiding a game from a list rewrites it. Ordering a replay by a column that
 *   can be rewritten means the ledger's order and the replay's order are not
 *   the same order.
 * - `lastMoveAt` is null on a game decided by a resignation or a clock.
 *
 * So `playedAt`, and the one consequence worth saying out loud: for a
 * correspondence game that began on Friday and ended on Saturday,
 * `weekendGame` is decided by the Friday. That is an approximation the stored
 * rows force, it is bounded — 5 XP, once per ISO week — and it is named here
 * rather than left for somebody to find in the totals.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Nothing. It is one pass over the games with a handful of sets and maps, and
 * no query at all: the runner reads the four tables once and hands them over.
 * Production held 116 decided games and 11 members when this was written; the
 * development database holds three thousand and it is still one pass.
 */

/** Who has beaten whom at what: the key `revengeWin` is keyed on. */
const rivalryKey = (loser: string, winner: string, variant: string): string =>
  `${loser}\0${winner}\0${variant}`;

/**
 * The three collected awards, and what completes each.
 *
 * One table rather than three copies of the same count, for the reason
 * `awardCollected` gives: three places for a comparison to be got wrong by one.
 * The sizes are imported from the modules that own them, so a game added to the
 * site or a grade retired moves them here too.
 */
const COLLECTED: readonly { each: XpEventType; all: XpEventType; size: number }[] = [
  { each: XP_EVENTS.firstOfVariant, all: XP_EVENTS.everyVariantPlayed, size: XP_VARIANTS_TO_PLAY },
  { each: XP_EVENTS.firstOfFamily, all: XP_EVENTS.everyFamilyPlayed, size: GAME_FAMILIES.length },
  { each: XP_EVENTS.gradeBeaten, all: XP_EVENTS.everyGradeBeaten, size: XP_GRADES_TO_BEAT },
];

/**
 * The replay, oldest game first: every batch a live site would have paid.
 *
 * Games must arrive OLDEST FIRST and are not sorted here — the caller has
 * already ordered them in the query, the same way the streak backfill does, and
 * a function that re-sorted its input would hide a caller that had not.
 */
export function planBackfill(input: BackfillInput): BackfillPlan {
  const members = new Map(input.members.map((member) => [member.id, member]));
  const states = seedStates(input.held);
  const buddies = new Map(input.buddies.map((link) => [heldKey(link.owner, link.buddy), link.since]));
  /** Who has beaten whom at what, SO FAR. The whole of `revengeWin`. */
  const beaten = new Set<string>();
  const batches: PlannedBatch[] = [];

  for (const game of input.games) {
    const sides = playedSides(game);
    for (const side of sides) {
      const state = stateIn(states, side.memberId);
      /* The run moves for every bound seat, whether or not the seat can be
         paid — `recordPlayed` carries a computer player's run forward too, and
         a member with no row still had a game. Award eligibility is decided
         below and must not change the history. */
      state.run = extendStreak(state.run, side.outcome);

      const member = members.get(side.memberId);
      /* No row answers to that id, or it answers to a program: `awardXp` pays
         neither, so the plan must not claim it would. */
      if (member === undefined || member.botTier !== null) continue;
      batches.push(...playedBy({ game, side, member, state, members, buddies, beaten }));
    }
    /* AFTER every award for this game. A turn-around is a fact about what came
       BEFORE, and `hadBeatenMe` excludes the game being decided for exactly
       this reason. */
    remember(beaten, game, sides);
  }

  /* `joined` is not an ordered fact — uncapped, subject "", and nothing counts
     it — so it is planned per member and merged by time rather than woven into
     the walk above. A kept record whose row was made after the games it holds
     therefore has its `joined` land after them, which is what the row says. */
  const joined = input.members.flatMap((member) => {
    if (member.botTier !== null) return [];
    const batch = predict({
      member,
      at: member.createdAt,
      reason: { kind: "joined" },
      awards: [{ type: XP_EVENTS.joined }],
      state: stateIn(states, member.id),
    });
    return batch === null ? [] : [batch];
  });

  /* Stable, and `joined` first in the array, so a member created in the same
     instant as their first game is paid for arriving before playing. */
  const ordered = [...joined, ...batches].sort((one, two) => one.at.getTime() - two.at.getTime());
  return tally(ordered, members);
}

/**
 * What one bound seat of one finished game pays: the game's own batch, and then
 * whichever set it completed.
 *
 * Two batches rather than one, because the live path makes two calls — the
 * game's awards, and then `awardTourBonuses` / the ladder's bonus off the back
 * of what they paid. So the ledger reads the same way after a replay as after a
 * real game, and a flash holds the same stack of toasts.
 */
function playedBy({
  game,
  side,
  member,
  state,
  members,
  buddies,
  beaten,
}: {
  game: BackfillGame;
  side: PlayedSide;
  member: BackfillMember;
  state: MemberState;
  members: ReadonlyMap<string, BackfillMember>;
  buddies: ReadonlyMap<string, Date>;
  beaten: ReadonlySet<string>;
}): PlannedBatch[] {
  const weekend = isWeekend(game.playedAt, member.timeZone);
  const awards = gameAwards(game, {
    outcome: side.outcome,
    run: state.run,
    opponent: opponentFor({ game, member, side, members, buddies, beaten }),
    weekendWeek: weekend ? xpWeekKey(game.playedAt, member.timeZone) : null,
  });

  const reason: BackfillReason = { kind: "game", gameId: game.id, variant: game.variant };
  const batch = predict({ member, at: game.playedAt, reason, awards, state });
  if (batch === null) return [];

  const out = [batch];
  for (const set of COLLECTED) {
    /* Asked only when the batch actually PAID the once-per-thing award that
       could have completed the set — `awardTourBonuses`'s own guard, and the
       whole cost design of those three awards. */
    if (!batch.paying.some((award) => award.type === set.each)) continue;
    /* `>=` and not `===`, for `awardCollected`'s reason: a game retired from the
       list leaves a member holding more rows than there are things, and somebody
       who has genuinely played everything must not be refused. */
    if (heldCount(state, set.each) < set.size) continue;
    const bonus = predict({
      member,
      at: game.playedAt,
      reason: { kind: "collected", gameId: game.id },
      awards: [{ type: set.all }],
      state,
    });
    if (bonus !== null) out.push(bonus);
  }
  return out;
}

/**
 * What was known about the other seat at the moment this game was played.
 *
 * The order of the guards is `opponentFacts`'s order, and the two facts it
 * reads from a database are the two this answers from history instead:
 *
 * - **the buddy list AS IT STOOD** — `Buddy.createdAt` is what makes that
 *   answerable, and a link made after the game is not one the live site would
 *   have seen. A link since REMOVED is invisible either way, so a buddy beaten
 *   and then dropped goes unpaid: the conservative direction, and the only one
 *   the rows support.
 * - **the rivalry**, from the replay's own record of who had beaten whom.
 *   `hadBeatenMe` asks the games table with no date on the question, which is
 *   right live — there are no later games yet — and would be wrong here, where
 *   there are. This is the ordered fact the design says a backfill turns on.
 */
function opponentFor({
  game,
  member,
  side,
  members,
  buddies,
  beaten,
}: {
  game: BackfillGame;
  member: BackfillMember;
  side: PlayedSide;
  members: ReadonlyMap<string, BackfillMember>;
  buddies: ReadonlyMap<string, Date>;
  beaten: ReadonlySet<string>;
}): Opponent {
  const id = otherSeat(game, side.memberId);
  if (id === null) return NO_OPPONENT;
  /* The GRADE in the other seat, from `botTierFor` and never from the member
     row's column — the same function `xpGameServer` asks, so a seat bound to a
     known program answers the same here as it did live. */
  const tier = botTierFor(id);
  if (tier !== null || side.outcome !== STREAK_KINDS.win) return { ...NO_OPPONENT, id, tier };

  const theirs = members.get(id)?.email ?? null;
  /* Null where the question cannot be asked. `Buddy` is keyed by two folded
     ADDRESSES, so a seat bound to a member with no address cannot be on a
     list — which is not the same fact as "not a buddy", and pays nothing either
     way rather than paying on a guess. */
  const since = buddies.get(heldKey(side.memberId, id));
  const buddy =
    member.email === null || theirs === null
      ? null
      : since !== undefined && since.getTime() <= game.playedAt.getTime();

  /* A variant this deploy cannot name is a rivalry it cannot key, so there is
     nothing to establish — `hadBeatenMe` answers null for the same reason. */
  const beatenMeBefore =
    variantOf(game) === null ? null : beaten.has(rivalryKey(side.memberId, id, game.variant));

  return { id, tier: null, buddy, beatenMeBefore };
}

/**
 * Files this game's losses, so a later win over the same person at the same
 * game is a turn-around.
 *
 * Keyed the way `revengeWin` is keyed — the pair and the variant — and taken
 * from `playedSides`, so a self-game (answered once, from black) and an unbound
 * seat file nothing. A draw files nothing either: being drawn with is not being
 * beaten.
 */
function remember(
  beaten: Set<string>,
  game: BackfillGame,
  sides: readonly PlayedSide[],
): void {
  for (const side of sides) {
    if (side.outcome !== STREAK_KINDS.loss) continue;
    const winner = otherSeat(game, side.memberId);
    if (winner === null) continue;
    beaten.add(rivalryKey(side.memberId, winner, game.variant));
  }
}

/** The plan's arithmetic: per member, per type, and the whole. */
function tally(batches: PlannedBatch[], members: ReadonlyMap<string, BackfillMember>): BackfillPlan {
  const perMember = new Map<string, MemberPlan>();
  const byType = new Map<XpEventType, { events: number; points: number }>();
  let points = 0;
  let events = 0;

  for (const batch of batches) {
    const member = members.get(batch.memberId);
    /* Every batch was planned FROM a member, so this cannot be missing. It is
       checked rather than asserted, because a total resting on a `!` is a total
       nobody can trust. */
    if (member === undefined) continue;
    const mine: MemberPlan =
      perMember.get(batch.memberId) ?? { member, points: 0, events: 0, byType: new Map() };
    for (const award of batch.paying) {
      mine.points += award.points;
      mine.events += 1;
      add(mine.byType, award.type, award.points);
      add(byType, award.type, award.points);
      points += award.points;
      events += 1;
    }
    perMember.set(batch.memberId, mine);
  }

  return { batches, perMember, points, events, byType };
}

function add(
  into: Map<XpEventType, { events: number; points: number }>,
  type: XpEventType,
  points: number,
): void {
  const held = into.get(type) ?? { events: 0, points: 0 };
  into.set(type, { events: held.events + 1, points: held.points + points });
}

/** A buddy link as the planner wants it, from a row keyed by folded addresses. */
export function buddyLinkFor(
  row: { owner: string; buddy: string; createdAt: Date },
  idFor: ReadonlyMap<string, string>,
): BackfillBuddy | null {
  const owner = idFor.get(row.owner);
  const buddy = idFor.get(row.buddy);
  /* An address on a link that no member row answers to any more. Nothing to
     key, so nothing to say — and `wonVsBuddy` is not paid on a guess. */
  if (owner === undefined || buddy === undefined) return null;
  return { owner, buddy, since: row.createdAt };
}
