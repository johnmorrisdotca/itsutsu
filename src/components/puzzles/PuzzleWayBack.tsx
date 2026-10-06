"use client";

import Link from "@/components/ui/Link";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { familyOf } from "@/lib/gomoku/families";
import { familyPath, gamePath } from "@/lib/gomoku/slugs";
import { puzzleName } from "@/lib/puzzles/puzzleCopy";
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
  const say = useSpeaker();
  const copy = PUZZLE_DISPLAY[kind];
  const family = familyOf(kind);
  return (
    <>
      <Link href={gamePath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-way-game">
        {say.say("puzzle.way.gamePage", { name: puzzleName(kind, say.locale) })}{say.pairsWithKanji ? <> <span className="font-mincho opacity-70">{copy.kanji}</span></> : null}
      </Link>
      {family === null ? null : (
        <Link href={familyPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-way-family">
          {/* In the words the game's own page links it with; a family's title alone ("Solo games") says nothing as a button. */}
          <Paired en={say.say("puzzle.way.family")} kanji="同族" kanjiClassName="opacity-70" />
        </Link>
      )}
    </>
  );
}
