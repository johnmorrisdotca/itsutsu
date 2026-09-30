import type { ComputerSaid, ComputerStep } from "./computer.types";
import { bestLaying, judgeTiles, tradeChoice } from "./computerPlay";
import { drawAll, isComputer, mayDrawAll, mayTradeThisTurn, seatPlay, withSeatPlay } from "./party";
import type { PartyGame } from "./party.types";
import { doneRefused, endTurn, goesOut, handCanSpell, isLastTurn, laidThisTurn, mayResign, resign } from "./partyTurns";
import { liftAll, mayTrade, trade } from "./play";
import type { TileWords } from "./tileWords";

/**
 * A COMPUTER'S TURN in a pass-and-play game (John, 2026-09-28: "Also you can
 * add computer bots"), planned whole before any of it is shown: a list of
 * steps, each the game after one thing it did, the last one the game it
 * passes on. The page shows them one at a time with a short pause and keeps
 * only the last (`KumimojiPartyComputer`), so a reload in the middle plays
 * the same turn again from its start — the plan is pure and has no
 * randomness, so it is the same turn — and a reload after it finds it done.
 *
 * Its play, by the same rules as anybody's and through the same moves:
 *
 * - Lay the best word it can (`bestLaying`): its own tiles only, crossing
 *   what is down, the grid sound after every word.
 * - Draw whenever its hand is used and its grid sound, so everybody takes a
 *   tile, and play on.
 * - Trade its rarest tile when its hand lays nothing, once a turn at most,
 *   as anybody may (`mayTradeThisTurn`).
 * - Press Done — going out, when its hand is used and the bag cannot give
 *   everybody a tile — once it is done or has taken `COMPUTER_STEPS_MOST`
 *   steps, which keeps a turn to a few seconds to watch.
 * - Resign only where the rules offer it (`mayResign`) and it can do nothing
 *   at all: nothing to lay, nothing to trade for, and it is not its last turn.
 */

/** The most things a computer does in one turn before pressing Done: at the page's pause, a turn of about three seconds. */
export const COMPUTER_STEPS_MOST = 8;
/** How many settling steps may be needed at the end to be allowed Done at all; one trade a turn and a hand of tiles, so it is bounded anyway. */
const SETTLING_MOST = 200;

export function planComputerTurn(game: PartyGame, words: TileWords): ComputerStep[] {
  const steps: ComputerStep[] = [];
  if (game.ending !== null || !isComputer(game, game.turn)) return steps;
  let now = game;
  const take = (next: PartyGame, said: ComputerSaid) => {
    now = next;
    steps.push({ game: next, said });
  };
  // The game's own rules, Diagonals included, for every judgement and every word it lays.
  const rules = { diagonals: game.settings.diagonals };
  const verdict = () => judgeTiles(now.players[now.turn]!.tiles, words, rules);
  const handSpells = (hand: readonly string[]) => handCanSpell(hand, words);

  // Only its own moves ever reach its table, so this is a guard: a table that is not sound is taken up and built again.
  if (now.players[now.turn]!.tiles.size > 0 && !verdict().sound) take(withSeatPlay(now, liftAll(seatPlay(now))), { kind: "rebuilt" });

  while (steps.length < COMPUTER_STEPS_MOST) {
    const play = seatPlay(now);
    if (play.hand.length === 0) {
      if (!mayDrawAll(now, verdict())) break;
      take(drawAll(now), { kind: "drew" });
      continue;
    }
    const laid = bestLaying(play, words, rules);
    if (laid !== null) {
      take(withSeatPlay(now, laid.play), { kind: "laid", word: laid.word });
      continue;
    }
    const worst = tradeChoice(play.hand, words);
    if (!mayTradeThisTurn(now) || worst === null) break;
    take(withSeatPlay(now, trade(play, worst)), { kind: "traded", tile: play.hand[worst]! });
  }

  // Done may be held back: a hand that must be traded first, or the last one standing with nothing laid. Lay or trade until it is not.
  for (let settle = 0; settle < SETTLING_MOST && doneRefused(now, verdict(), handSpells) !== null; settle += 1) {
    const play = seatPlay(now);
    const laid = bestLaying(play, words, rules);
    const worst = tradeChoice(play.hand, words) ?? 0;
    if (laid !== null) take(withSeatPlay(now, laid.play), { kind: "laid", word: laid.word });
    else if (mayTradeThisTurn(now)) take(withSeatPlay(now, trade(play, worst)), { kind: "traded", tile: play.hand[worst]! });
    else break;
  }

  const hand = now.players[now.turn]!.hand;
  const stuck = hand.length > 0 && !laidThisTurn(now) && !mayTrade(seatPlay(now)) && bestLaying(seatPlay(now), words, rules) === null;
  const refused = doneRefused(now, verdict(), handSpells) !== null;
  if ((refused || (stuck && !isLastTurn(now))) && mayResign(now)) {
    take(resign(now), { kind: "resigned" });
    return steps;
  }
  // Done held back with no resigning either cannot happen (a refusal the bag cannot trade away is one resigning answers); the page stops rather than play the turn again.
  if (refused) return steps;
  take(endTurn(now, verdict(), handSpells), { kind: "done", out: goesOut(now, verdict()) });
  return steps;
}

/** The game a computer's turn passes on: its plan's last step, or the game as it was where there is nothing to play. */
export function afterComputerTurn(game: PartyGame, words: TileWords): PartyGame {
  return planComputerTurn(game, words).at(-1)?.game ?? game;
}
