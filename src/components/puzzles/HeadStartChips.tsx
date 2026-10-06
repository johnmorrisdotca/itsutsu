"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { HEAD_START_DISPLAY } from "@/lib/gomoku/headStartWords";
import { offersHeadStart } from "@/lib/puzzles/gomoji/headStart";
import { POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

/**
 * A GOMOJI'S HEAD START, chosen on its set-up screen (`headStart.ts`): off or
 * on, easy only. The row is drawn at every level, so choosing a level never
 * moves what is under it; at medium and hard both chips are switched off and
 * the line under them says why, rather than the row coming and going. The name
 * and kanji are a game's head start's (`HEAD_START_DISPLAY`): one idea, one name.
 */
export function HeadStartChips({
  kind,
  size,
  level,
  chosen,
  onChoose,
  words = 1,
  dodge = false,
  backwards = false,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  chosen: boolean;
  onChoose: (chosen: boolean) => void;
  /** How many words were chosen — a Futago's two (`futago.ts`) or a Yotsugo's four (`yotsugo.ts`): the keys greyed are in none of them. */
  words?: WordCount;
  /** A Nige chosen (`dodge.ts`): nothing is hidden, so there is nothing a head start could grey. */
  dodge?: boolean;
  /** A Sakasa chosen (`backwards.ts`): every letter is to be avoided already, so a head start would only take letters away. */
  backwards?: boolean;
}) {
  const say = useSpeaker();
  const offered = offersHeadStart(kind, level) && !dodge && !backwards;
  // As many as the word has (`headStartKeys`): the size chosen above.
  const unit = say.say(kind === "gomojiKana" ? "pword.headStart.kana" : "pword.headStart.letters");
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label={HEAD_START_DISPLAY.label} data-testid="puzzle-head-start">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={offered && chosen === each}
            disabled={!offered}
            className={`${PICK_WORD_CHIP} ${offered && chosen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`puzzle-head-start-${each ? "on" : "off"}`}
          >
            {each ? (
              <Paired en={HEAD_START_DISPLAY.label} kanji={HEAD_START_DISPLAY.kanji} kanjiClassName="opacity-70" />
            ) : (
              <Paired en={say.say("pword.headStart.off")} kanji="無" kanjiClassName="opacity-70" inReadersLanguage />
            )}
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-head-start-blurb">
        {dodge
          ? say.say("pword.headStart.dodge")
          : backwards
          ? say.say("pword.headStart.backwards")
          : !offered
          ? say.say("pword.headStart.notEasy")
          : chosen
            ? say.say("pword.headStart.chosen", { count: String(size), unit, which: say.say(words === 4 ? "pword.headStart.whichFour" : words === 2 ? "pword.headStart.whichTwo" : "pword.headStart.whichOne"), points: String(POINTS_A_HELP) })
            : say.say("pword.headStart.nothing")}
      </p>
    </>
  );
}
