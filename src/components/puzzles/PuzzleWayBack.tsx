import Link from "next/link";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { familyOf } from "@/lib/gomoku/families";
import { familyPath, gamePath } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * THE WAY BACK FROM A FINISHED PUZZLE: the puzzle's own page and its family,
 * beside Another. A finished Gomoji offered only "Another word", so the one
 * way on was the same thing again; the page about the game — its record, its
 * boards, its rules — and the family it sits in were an address to remember.
 * Drawn at the end of every puzzle, solved or not, raced or not, so no
 * finish is a dead end.
 */
export function PuzzleWayBack({ kind }: { kind: PuzzleKind }) {
  const copy = PUZZLE_DISPLAY[kind];
  const family = familyOf(kind);
  return (
    <>
      <Link href={gamePath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-way-game">
        {copy.label}&apos;s page <span className="font-mincho opacity-70">{copy.kanji}</span>
      </Link>
      {family === null ? null : (
        <Link href={familyPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-way-family">
          {/* In the words the game's own page links it with; a family's title alone ("Other") says nothing as a button. */}
          Its family <span className="font-mincho opacity-70">同族</span>
        </Link>
      )}
    </>
  );
}
