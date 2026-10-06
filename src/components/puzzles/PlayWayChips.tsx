"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { backwardsBlurb, BACKWARDS_DISPLAY } from "@/lib/puzzles/gomoji/backwardsWords";
import { backwardsGuesses } from "@/lib/puzzles/gomoji/backwardsRows";
import { dodgeBlurb, DODGE_DISPLAY } from "@/lib/puzzles/gomoji/dodgeWords";
import { dodgeGuesses } from "@/lib/puzzles/gomoji/dodgePlay";
import type { GomojiWay } from "@/lib/puzzles/gomoji/words.types";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/** The three ways, in the order they are drawn, each with its name and its own test id. */
const WAYS: readonly { way: GomojiWay; label: string | null; kanji: string; testId: string }[] = [
  // The first has no name of its own to keep here: it is a phrase, said in the reader's language where it is drawn.
  { way: "find", label: null, kanji: "探す", testId: "puzzle-way-find" },
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
  const say = useSpeaker();
  const way = offered ? chosen : "find";
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label={say.say("pword.way.howPlayed")} data-testid="puzzle-way">
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
            <Paired en={each.label ?? say.say("pword.way.find")} kanji={each.kanji} kanjiClassName="opacity-70" />
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="puzzle-way-blurb">
        {!offered
          ? say.say("pword.way.popOnly")
          : way === "dodge"
            ? dodgeBlurb(dodgeGuesses(kind, size), say)
            : way === "backwards"
              ? backwardsBlurb(backwardsGuesses(kind, size, level), say)
              : say.say("pword.way.findBlurb")}
      </p>
    </>
  );
}
