"use client";

import Link from "@/components/ui/Link";

import { STAT_CHIP, STAT_LINK } from "@/components/games/games.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * The line under a puzzle where a game shows its played-figures.
 *
 * A puzzle has no games played, no last match and no top player: nothing is
 * kept of a solve (until docs/plans/numbers/NUM-05 keeps them), so a strip
 * saying "nobody has played this yet" would be a count nobody made. This
 * says what the puzzle is instead, and offers the way in — a member to the
 * set-up, a stranger to the door, the same two ways the figures strip offers.
 * `raised` above the card's stretched face, like every other link on a card.
 */
export function PuzzleLine({ kind, signedIn }: { kind: PuzzleKind; signedIn: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" data-testid="puzzle-line" data-variant={kind}>
      <span className={`${STAT_CHIP} text-muted`}>A puzzle for one, solved in your browser.</span>
      {signedIn ? (
        <Link href={setUpPath(kind)} className={STAT_LINK} data-testid="puzzle-line-solve">
          Play one →
        </Link>
      ) : (
        <Link href="/join" className={STAT_LINK} data-testid="puzzle-line-join">
          Join to play one →
        </Link>
      )}
    </div>
  );
}
