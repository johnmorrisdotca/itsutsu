"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { GAME_COPY } from "@/components/game/game.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import { matchPath } from "@/lib/gomoku/slugs";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import type { MyGame } from "@/lib/history/myGames";
import { advancesAfterMove, carriesOnwardFrom, nextWaiting } from "@/lib/history/nextGame";

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
 */
export function useAdvanceToNextGame() {
  const router = useRouter();
  const [nowhereToGo, setNowhereToGo] = useState(false);

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

  const notice = nowhereToGo ? (
    <p className="text-xs text-muted" data-testid="nothing-waiting">
      {GAME_COPY.nothingWaiting}{" "}
      <Link href="/my-games" className="underline underline-offset-4">
        {GAME_COPY.yourGames}
      </Link>
    </p>
  ) : null;

  return { advance, notice };
}
