import Link from "next/link";

import { GameThumb } from "@/components/games/GameThumb";
import { OneName } from "@/components/i18n/OneName";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import { setUpPath } from "@/lib/gomoku/slugs";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import type { Family } from "./picker";
import { PICK_CARD, PICK_GRID } from "./picker.constants";

/**
 * A FAMILY OF PUZZLES ON THE SET-UP SCREEN: its puzzles, each a way to its own
 * set-up.
 *
 * John, 2026-09-24, on this screen with no Numbers tile: "where tf is numbers
 * games??? I didn't see them". The screen makes a game between two seats, and
 * a puzzle has no seats, no clock and nobody to invite: it is set up by size
 * and level on its own page. So the family is on the row like every other, and
 * what it opens is its puzzles as links, each to `/games/<slug>/new`, rather
 * than choices the Start button below would try to make into a game.
 */
export function PuzzleShelf({ family }: { family: Family }) {
  return (
    <>
      <span className="text-xs leading-snug text-muted" data-testid="set-up-family-blurb">
        {family.blurb} One player, set up on its own page: no seats and no clock to choose here.
      </span>
      <div className={PICK_GRID}>
        {(family.games as PuzzleKind[]).map((kind) => {
          const copy = gameCopyFor(kind);
          return (
            <Link
              key={kind}
              href={setUpPath(kind)}
              className={`${PICK_CARD} cursor-pointer gap-1.5 p-1`}
              data-testid="set-up-puzzle"
              data-kind={kind}
            >
              <GameThumb variant={kind} size="regular" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[0.8125rem] font-medium lg:text-sm" title={copy.label}>
                  <OneName en={copy.label} kanji={copy.kanji} />
                </span>
                <span className="truncate text-[0.7rem] text-muted">Set it up →</span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
