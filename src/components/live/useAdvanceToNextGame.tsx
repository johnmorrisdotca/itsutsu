"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { GAME_COPY } from "@/components/game/game.constants";
import type { Asking } from "@/components/ui/ui.types";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import { matchPath } from "@/lib/gomoku/slugs";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import type { MyGame } from "@/lib/history/myGames";
import { advancesAfterMove, carriesOnwardFrom, nextWaiting } from "@/lib/history/nextGame";
import { advanceHold, NOTHING_HELD, type AdvanceHold } from "./advanceHold";

/**
 * After a move, on to the next game that is waiting.
 *
 * John, playing a dozen correspondence games at once: "IYT does this — you
 * play your move, then the next game opens up... We do not. Not very good
 * discoverability." The count beside Play was the only signal, and a count
 * asks the reader to go looking. Being carried along is what makes a dozen
 * games playable in one sitting rather than a list to work through by hand.
 *
 * It reads the queue the badge already reads, so nothing new is asked of the
 * server: which games are waiting on somebody is a question the site answers
 * on every page already, and the rule for which one is next is in
 * `nextGame.ts`, tested without a database.
 *
 * WHEN THERE IS NOWHERE TO GO, IT SAYS SO. Landing a player on a blank page,
 * or back on the board they have just moved on, is worse than not moving them
 * at all — so the answer to "nothing is waiting" is a line saying exactly
 * that, with the way to their own games under it, and the board they are
 * already looking at left alone.
 *
 * AND NOT WHILE SOMETHING IS BEING ASKED. The advance lands a moment after the
 * move — a POST, a redraw, a read of the queue — so a player who plays a stone
 * and reaches for Resign or Cancel opens the confirm inside that moment, and
 * was then shown the question taken away along with the board it was about.
 * `whileAsking` is how a question says it is up; the rule for what a held
 * advance does next is `advanceHold.ts` beside this file, tested on its own.
 */
/**
 * A move that ended a turn, kept while a question stands over the board. The
 * seat comes along because the board it was played on is what decides whether
 * there is anywhere to go, and it is answered before anything is held.
 */
type Onward = { after: GameDetail; seat: Stone };

export function useAdvanceToNextGame() {
  const router = useRouter();
  const [nowhereToGo, setNowhereToGo] = useState(false);
  /**
   * A ref rather than state, because nothing is drawn from it and a move has to
   * read the hold as it stands: a callback closed over a render's copy would
   * decide with the value from before the question opened.
   */
  const hold = useRef<AdvanceHold<Onward>>(NOTHING_HELD);

  /**
   * The queue half — where to go — asked at the moment of going rather than at
   * the moment of the move, so an advance that waited on a question reads a
   * fresh queue when it is finally let through.
   */
  const carryOn = useCallback(
    async ({ after }: Onward) => {
      const response = await fetch("/api/games/mine");
      // A queue that cannot be read is not an empty queue: say nothing and
      // leave them where they are, rather than reporting "nothing is waiting"
      // on the strength of a failed request.
      if (!response.ok) return;
      const { groups } = (await response.json()) as { groups?: { yourMove?: MyGame[] } };

      const next = nextWaiting(groups?.yourMove ?? [], after.id);
      if (next === null) {
        setNowhereToGo(true);
        return;
      }
      router.push(matchPath(next.game.variant, next.game.id));
    },
    [router],
  );

  /**
   * Called with the server's answer to the move just played. The board is the
   * authority on whether the turn actually ended; the queue is the authority
   * on where to go next.
   */
  const advance = useCallback(
    async (after: GameDetail, seat: Stone | null) => {
      setNowhereToGo(false);
      if (seat === null || !advancesAfterMove()) return;

      const state = replayGame(after);
      if (!carriesOnwardFrom(state.status, state.toPlay, seat)) return;

      const step = advanceHold(hold.current, { kind: "move", move: { after, seat } });
      hold.current = step.hold;
      if (step.now !== null) await carryOn(step.now);
    },
    [carryOn],
  );

  /**
   * What a question standing over the board does to the advance: nothing moves
   * while one is up, a dismissal lets the move's advance through, and an answer
   * voids it — the act being confirmed ends the game, and the ending decides
   * for itself where somebody should be looking.
   *
   * Shaped to be handed straight to a `ConfirmButton`'s `onAsking`.
   */
  const whileAsking = useCallback(
    (asking: Asking) => {
      const step = advanceHold(hold.current, { kind: asking });
      hold.current = step.hold;
      if (step.now !== null) void carryOn(step.now);
    },
    [carryOn],
  );

  const notice = nowhereToGo ? (
    <p className="text-xs text-muted" data-testid="nothing-waiting">
      {GAME_COPY.nothingWaiting}{" "}
      <Link href="/play" className="underline underline-offset-4">
        {GAME_COPY.yourGames}
      </Link>
    </p>
  ) : null;

  return { advance, notice, whileAsking };
}
