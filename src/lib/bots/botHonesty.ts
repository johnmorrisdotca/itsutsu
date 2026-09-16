import { assess } from "@/lib/gomoku/analysis";
import { applyTurn, legalTurns, sameTurn } from "@/lib/gomoku/opponentTurns";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import type { BotTier, BotTurn } from "@/lib/gomoku/opponent.types";
import type { GameState } from "@/lib/gomoku/gomoku.types";

/**
 * DID THIS COMPUTER PLAYER PLAY LIKE ITSELF?
 *
 * A bot that thinks in the player's own browser is a bot whose moves are chosen
 * on a machine belonging to its opponent. Nothing stops somebody making it play
 * badly and pocketing the win, and on a rated ladder that is worth doing.
 *
 * The exact answer is to replay the move on the server and see whether the same
 * grade, given the same seed and the same node budget, would have chosen it —
 * which is what `botSeed.ts` exists for. That answer is also the expensive one:
 * it spends the search we moved to the browser precisely to stop paying for.
 *
 * This is the cheap half, and it is cheap enough to run on every move of every
 * game. It asks a much smaller question that needs NO search at all:
 *
 *   did a grade that is defined as never blundering just blunder?
 *
 * Meijin and 国手 carry `blunder: 0` and `guard: 1`. Those are not descriptions
 * of how they usually play, they are the spec: such a grade does not hand over
 * an immediate win, and does not walk past one of its own. Either of those in a
 * game credited to one of those grades is a fact about the move, arrived at by
 * reading the position rather than by re-searching it.
 *
 * **What it deliberately does NOT do.** It never says a move was fine — only
 * that it was not one of the two things it can actually see. A grade that
 * quietly plays the second-best move for forty turns is invisible here and is
 * meant to be; that is what a replay is for. Answering "clean" would be the
 * dangerous kind of wrong, so the verdict for "I could not see anything" is its
 * own word and not a pass.
 */
export const HONESTY = {
  /** A grade that may blunder was asked about. Nothing here applies. */
  notClaimed: "notClaimed",
  /** Read, and neither fault was present. NOT a statement that the move was good. */
  nothingSeen: "nothingSeen",
  /** It had a win available this turn and played something else. */
  missedWin: "missedWin",
  /** It handed the opponent a win it could have prevented. */
  gaveWin: "gaveWin",
  /** The position could not be read — say so rather than guess. */
  unreadable: "unreadable",
} as const;

export type HonestyVerdict = (typeof HONESTY)[keyof typeof HONESTY];

export type HonestyReading = {
  verdict: HonestyVerdict;
  /** Plain words, for an operator reading a game rather than a machine filtering one. */
  because: string;
};

/** Whether this grade's spec claims it never throws a game away. */
export function claimsNoBlunders(tier: BotTier): boolean {
  const spec = TIER_SPECS[tier];
  return spec.blunder === 0 && spec.guard === 1;
}

/**
 * Read one move a computer player made.
 *
 * `before` is the position it was handed; `turn` is what it answered. Both are
 * the server's own — the position from the stored record and the turn from the
 * move that was posted — so nothing here trusts a number the browser sent.
 */
export function readBotMove(before: GameState, turn: BotTurn, tier: BotTier): HonestyReading {
  if (!claimsNoBlunders(tier)) {
    return { verdict: HONESTY.notClaimed, because: `${tier} is allowed to blunder; nothing to answer for.` };
  }
  if (before.status !== GAME_STATUS.playing) {
    return { verdict: HONESTY.unreadable, because: "the game was already over." };
  }

  const mover = before.toPlay;
  const choices = legalTurns(before, 200);
  if (choices.length === 0) return { verdict: HONESTY.unreadable, because: "no legal turn to compare against." };

  const after = applyTurn(before, turn);
  if (after === before) {
    // The engine refused it. That is the move route's business, not ours, and
    // saying anything else here would be a second opinion on legality.
    return { verdict: HONESTY.unreadable, because: "the engine did not accept that turn." };
  }

  // 1. A win it already had. Every legal turn is tried, which is bounded by the
  //    same cap the chooser uses and costs no search — each is one engine step.
  if (after.status !== GAME_STATUS.won || after.winner !== mover) {
    for (const other of choices) {
      if (sameTurn(other, turn)) continue;
      const would = applyTurn(before, other);
      if (would !== before && would.status === GAME_STATUS.won && would.winner === mover) {
        return {
          verdict: HONESTY.missedWin,
          because: `a winning turn was available and ${tier} played something else.`,
        };
      }
    }
  }

  /*
   * 2. A win it handed over — and note WHOSE win.
   *
   * `Assessment.decided` says the position is settled; it does not say for
   * whom. Reading it as a blunder cost this check its first run: 国手 playing
   * itself was accused on the move that made 国手 WINNING, which is the best
   * move on the board rather than the worst. The outlook is per colour, so the
   * question to ask is whether the MOVER is the one now lost.
   */
  const seenBefore = assess(before);
  const seenAfter = assess(after);
  const lostNow = seenAfter.outlook[mover] === "lost";
  const lostBefore = seenBefore.outlook[mover] === "lost";
  if (lostNow && !lostBefore && after.status === GAME_STATUS.playing) {
    /*
     * Only a blunder if it could have been avoided. A position where every turn
     * loses is a lost position, and a grade cannot be accused of losing one —
     * "a rule that cannot measure must not fire": the reading has to tell
     * "played badly" apart from "had nothing".
     */
    const escape = choices.some((other) => {
      if (sameTurn(other, turn)) return false;
      const would = applyTurn(before, other);
      return would !== before && assess(would).outlook[mover] !== "lost";
    });
    if (escape) {
      return { verdict: HONESTY.gaveWin, because: `${tier} walked into a lost position that another turn avoided.` };
    }
  }

  return { verdict: HONESTY.nothingSeen, because: "no missed win and no given win. Says nothing about how good it was." };
}
