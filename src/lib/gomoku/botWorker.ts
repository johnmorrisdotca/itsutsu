/// <reference lib="webworker" />

import { chooseTurn } from "./opponent";
import { seededRandom } from "./botSeed";
import { BROWSER_MOVE_MILLIS } from "./botWorker.constants";
import type { BotTurn, BotTier, SearchBudget } from "./opponent.types";
import type { GameState } from "./gomoku.types";

/**
 * THE COMPUTER PLAYER, THINKING IN THE PLAYER'S OWN BROWSER.
 *
 * Every computer move on this site has been a server function call: the move
 * route works out the reply and bills us for the time it took. That is the one
 * cost that grows with how good the opponent is, which is why the graded ladder
 * stops where it does — `BOT_MOVE_MILLIS` is 250, and measurement showed the
 * top two grades pick the SAME move because neither reaches the depth they are
 * supposed to differ by before the clock runs out.
 *
 * Here there is no such clock. The work happens on the machine of the person
 * waiting for it, so a second of thought costs nothing and belongs to the only
 * player it keeps waiting. That is the whole idea: the same chooser, moved.
 *
 * What moves is the THINKING, and only that. A practice game is still mirrored
 * to the server move by move, because that is how it gets an address and a
 * record — measured in a browser, a bot reply posts the same two writes a
 * person's would. Those writes are cheap and bounded; the search was neither.
 *
 * A worker rather than the page's own thread, because that second of thought
 * would otherwise freeze the board — no hover, no scrolling, no clicking
 * elsewhere, on the exact move the opponent is trying hardest on. The chooser
 * is already pure, with no DOM, no database and no `window`, so it runs here
 * unchanged; that purity is not an accident of this file, it is the engine rule
 * this codebase already keeps.
 *
 * It is a pure calculator and holds no game. The page sends a whole position
 * and gets back one turn, so a stale answer can always be recognised by its
 * `id` and thrown away rather than played into a position it was never about.
 */
export type BotAsk = {
  /** Echoed back, so the page can drop an answer to a question it has moved on from. */
  id: number;
  state: GameState;
  tier: BotTier;
  budget?: SearchBudget;
  /**
   * The server's seed for this turn, when the move is one that may be checked
   * later. With it the answer is reproducible and a replay can confirm it;
   * without it the game is an ordinary one and the dice are the browser's.
   * See `botSeed.ts` — a seeded ask must carry a NODE budget, never a clock.
   */
  seed?: number;
};

export type BotAnswer =
  | { id: number; ok: true; turn: BotTurn | null; millis: number }
  | { id: number; ok: false; reason: string };

self.addEventListener("message", (event: MessageEvent<BotAsk>) => {
  const ask = event.data;
  const started = performance.now();
  try {
    /*
     * Unseeded by default: a person playing the same opening twice should not
     * meet the same game twice. A seed is passed only where the move may have
     * to be answered for later.
     */
    const random = ask.seed === undefined ? Math.random : seededRandom(ask.seed);
    const turn = chooseTurn(ask.state, ask.tier, random, ask.budget ?? { millis: BROWSER_MOVE_MILLIS });
    const answer: BotAnswer = { id: ask.id, ok: true, turn, millis: performance.now() - started };
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(answer);
  } catch (error) {
    /*
     * A thrown chooser must say so rather than go quiet. A silent worker and a
     * worker still thinking look identical from the page, and the page would
     * wait for a turn that is never coming — so the seat would simply stop,
     * with nothing on screen to say why.
     */
    const answer: BotAnswer = {
      id: ask.id,
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(answer);
  }
});
