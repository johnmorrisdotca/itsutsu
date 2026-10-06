"use client";

import Link from "@/components/ui/Link";

import { STAT_CHIP, STAT_LINK } from "@/components/games/games.constants";
import { CASUAL_SPECS } from "@/lib/casual/casual.constants";
import type { CasualKind } from "@/lib/casual/casual.types";
import { setUpPath } from "@/lib/gomoku/slugs";

/**
 * The line under a casual game where a game shows its played-figures.
 *
 * A casual game is played alone for a minute or two a level and kept only in
 * the browser it is played in: there are no games played to count, no last
 * match and no top player, so a strip saying "nobody has played this yet"
 * would be a count nobody could ever make. This says what it is instead, and
 * offers the way in: a member to the levels, a stranger to the door. `raised`
 * above the card's stretched face, like every other link on a card.
 */
export function CasualLine({ kind, signedIn }: { kind: CasualKind; signedIn: boolean }) {
  const { levels } = CASUAL_SPECS[kind];
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" data-testid="casual-line" data-variant={kind}>
      <span className={`${STAT_CHIP} text-muted`}>
        {levels} {kind === "choiceStory" ? "stories" : "levels"} to play alone; unrated, kept in your browser.
      </span>
      {signedIn ? (
        <Link href={setUpPath(kind)} className={STAT_LINK} data-testid="casual-line-play">
          Play →
        </Link>
      ) : (
        <Link href="/join" className={STAT_LINK} data-testid="casual-line-join">
          Join to play →
        </Link>
      )}
    </div>
  );
}
