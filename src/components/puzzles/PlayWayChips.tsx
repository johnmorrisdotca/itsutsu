"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { backwardsBlurb, BACKWARDS_DISPLAY } from "@/lib/puzzles/gomoji/backwardsWords";
import { backwardsGuesses } from "@/lib/puzzles/gomoji/backwardsRows";
import { dodgeBlurb, DODGE_DISPLAY } from "@/lib/puzzles/gomoji/dodgeWords";
import { dodgeGuesses } from "@/lib/puzzles/gomoji/dodgePlay";
import type { GomojiWay } from "@/lib/puzzles/gomoji/words.types";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/** The three ways, in the order they are drawn, each with its name and its own test id. */
const WAYS: readonly { way: GomojiWay; label: string; kanji: string; testId: string }[] = [
  { way: "find", label: "Find it", kanji: "探す", testId: "puzzle-way-find" },
  { way: "dodge", label: DODGE_DISPLAY.label, kanji: DODGE_DISPLAY.kanji, testId: "puzzle-dodge-on" },
  { way: "backwards", label: BACKWARDS_DISPLAY.label, kanji: BACKWARDS_DISPLAY.kanji, testId: "puzzle-backwards-on" },
];

/**
 * HOW THE WORD IS PLAYED, chosen on a Gomoji's set-up screen: found, as ever;
 * its Nige 逃げ (`dodge.ts`), a word that dodges every guess; or its Sakasa
 * 逆さ (`backwards.ts`), a word hidden as ever and won by never typing it.
 * One row of three, as the words above it are, rather than a row each, so the
 * set-up stays as short as it was. Drawn for every word list at every size
 * and level, the line under it always the same room, so choosing never moves
 * what is under it; switched off, and saying why, where the list offers
 * neither (`offered`).
 */
export function PlayWayChips({
  kind,
  size,
  level,
  offered,
  chosen,
  onChoose,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  /** Whether this word list can be played another way (`offersDodge`). */
  offered: boolean;
  chosen: GomojiWay;
  onChoose: (chosen: GomojiWay) => void;
}) {
  const way = offered ? chosen : "find";
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="How the word is played" data-testid="puzzle-way">
        {WAYS.map((each) => (
          <button
            key={each.way}
            type="button"
            role="radio"
            aria-checked={way === each.way}
            disabled={!offered && each.way !== "find"}
            className={`${PICK_WORD_CHIP} ${way === each.way ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each.way)}
            data-testid={each.testId}
          >
            {each.label} <span className="font-mincho opacity-70">{each.kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="puzzle-way-blurb">
        {!offered
          ? "Pop culture words are found from their category, so they are only ever found."
          : way === "dodge"
            ? dodgeBlurb(dodgeGuesses(kind, size))
            : way === "backwards"
              ? backwardsBlurb(backwardsGuesses(kind, size, level))
              : "Hidden before the first guess, and found before the rows run out."}
      </p>
    </>
  );
}
