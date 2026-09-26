"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { HEAD_START_DISPLAY } from "@/lib/gomoku/headStartWords";
import { offersHeadStart } from "@/lib/puzzles/gomoji/headStart";
import { POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
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
  dodge = false,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  chosen: boolean;
  onChoose: (chosen: boolean) => void;
  /** A Nige chosen (`dodge.ts`): nothing is hidden, so there is nothing a head start could grey. */
  dodge?: boolean;
}) {
  const offered = offersHeadStart(kind, level) && !dodge;
  // As many as the word has (`headStartKeys`): the size chosen above.
  const unit = kind === "gomojiKana" ? "kana" : "letters";
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
            {each ? HEAD_START_DISPLAY.label : `No ${HEAD_START_DISPLAY.label.toLowerCase()}`}{" "}
            <span className="font-mincho opacity-70">{each ? HEAD_START_DISPLAY.kanji : "無"}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="puzzle-head-start-blurb">
        {dodge
          ? "A word that dodges hides nothing yet, so there is nothing to grey before the first guess."
          : !offered
          ? "A head start is for easy: choose Easy to have one."
          : chosen
            ? `${size} ${unit} not in the word start grey: a free guess that uses no row. It costs ${POINTS_A_HELP} points.`
            : "Nothing is ruled out on the keyboard until the board rules it out."}
      </p>
    </>
  );
}
