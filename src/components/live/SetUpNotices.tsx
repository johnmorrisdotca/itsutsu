import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";

import { SET_UP_COPY } from "./live.constants";
import type { SetUpNoticesProps } from "./setUp.types";

/**
 * WHAT THIS ONE IS, before what it is played under.
 *
 * A rematch, a fork and a fresh game are the same form with different numbers in
 * it, and a reader who cannot tell which they are looking at has been handed a
 * puzzle rather than a confirmation. So the screen says it first: the problem
 * with the address, if there was one; the game being repeated; the position being
 * carried; the person named; and a named program the chosen game does not offer.
 *
 * Moved out of `SetUpGame` when the screen's groups were drawn open, because the
 * notices are a job of their own — deciding which sentence heads the form — and
 * the screen was near the 500-line gate doing both.
 */
export function SetUpNotices({ problem, again, repeat, chosenName, fork, opponent, dropped, variant }: SetUpNoticesProps) {
  return (
    <>
      {problem !== null ? (
        <p
          className="rounded-lg border border-ochre/60 bg-ochre-soft px-3 py-2 text-xs text-ink"
          data-testid="set-up-problem"
        >
          {problem}
        </p>
      ) : null}
      {again !== null ? (
        <p className="text-xs text-moss" data-testid="set-up-again">
          {repeat ? SET_UP_COPY.againHint(chosenName ?? "them", STONE_DISPLAY[again.colour].label) : SET_UP_COPY.againChanged}
        </p>
      ) : null}
      {fork !== null ? (
        <p className="text-xs text-moss" data-testid="set-up-fork">
          {fork.alone
            ? `${SET_UP_COPY.fork(fork.move)}. ${SET_UP_COPY.forkAlone}`
            : SET_UP_COPY.forkHint(fork.move, opponent?.name ?? "the same opponent")}
        </p>
      ) : null}
      {again === null && fork === null && opponent !== null ? (
        <p className="text-xs text-moss" data-testid="set-up-against">
          {SET_UP_COPY.againstHint(opponent.name)}
        </p>
      ) : null}
      {/*
        A NAMED PLAYER THE CHOSEN GAME DOES NOT OFFER, said rather than swallowed.
        A specialist program plays one game, so changing the game drops it from
        the list — and the screen then falls back to posting a seat for anyone,
        which is the right fallback and a surprise nobody should have to notice
        for themselves.
      */}
      {dropped !== null ? (
        <p className="text-xs text-shu" data-testid="set-up-not-offered">
          {SET_UP_COPY.notAtThisGame(dropped, variantLabel(variant))}
        </p>
      ) : null}
    </>
  );
}
