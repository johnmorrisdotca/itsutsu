"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";

import type { TsunagiMarks } from "./puzzles.constants";

const CHOICES: readonly { marks: TsunagiMarks; label: string; kanji: string }[] = [
  { marks: "colours", label: "Colours", kanji: "色" },
  { marks: "numbers", label: "Numbers", kanji: "数" },
];

/** Colours or numbers: two chips, on the set-up screen and beside the board while playing. */
export function TsunagiMarksPicker({ marks, onChoose }: { marks: TsunagiMarks; onChoose: (next: TsunagiMarks) => void }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Join by" data-testid="tsunagi-marks">
      {CHOICES.map((each) => (
        <button
          key={each.marks}
          type="button"
          role="radio"
          aria-checked={marks === each.marks}
          className={`${PICK_WORD_CHIP} ${marks === each.marks ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
          onClick={() => onChoose(each.marks)}
          data-testid={`tsunagi-marks-${each.marks}`}
        >
          {each.label} <span className="font-mincho opacity-70">{each.kanji}</span>
        </button>
      ))}
    </div>
  );
}
