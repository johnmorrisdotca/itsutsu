"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";

import type { TsunagiSet } from "@/lib/puzzles/tsunagi/levels";

import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";

const CHOICES: readonly { marks: TsunagiMarks; label: PhraseKey; kanji: string }[] = [
  { marks: "colours", label: "pmaze.tsunagi.marks.colours", kanji: "色" },
  { marks: "numbers", label: "pmaze.tsunagi.marks.numbers", kanji: "数" },
];

const FILLS: readonly { fill: TsunagiFill; label: PhraseKey; kanji: string }[] = [
  { fill: "marbles", label: "pmaze.tsunagi.fill.marbles", kanji: "玉" },
  { fill: "lines", label: "pmaze.tsunagi.fill.lines", kanji: "線" },
];

/** Colours or numbers: two chips, on the set-up screen and beside the board while playing. */
export function TsunagiMarksPicker({ marks, onChoose }: { marks: TsunagiMarks; onChoose: (next: TsunagiMarks) => void }) {
  const say = useSpeaker();
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={say.say("pmaze.tsunagi.joinBy")} data-testid="tsunagi-marks">
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
          <Paired en={say.say(each.label)} kanji={each.kanji} kanjiClassName="opacity-70" inReadersLanguage />
        </button>
      ))}
    </div>
  );
}

/** Marbles along every line, or the line alone: two chips, beside Colours and Numbers wherever they are. */
export function TsunagiFillPicker({ fill, onChoose }: { fill: TsunagiFill; onChoose: (next: TsunagiFill) => void }) {
  const say = useSpeaker();
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={say.say("pmaze.tsunagi.fillWith")} data-testid="tsunagi-fill">
      {FILLS.map((each) => (
        <button
          key={each.fill}
          type="button"
          role="radio"
          aria-checked={fill === each.fill}
          className={`${PICK_WORD_CHIP} ${fill === each.fill ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
          onClick={() => onChoose(each.fill)}
          data-testid={`tsunagi-fill-${each.fill}`}
        >
          <Paired en={say.say(each.label)} kanji={each.kanji} kanjiClassName="opacity-70" inReadersLanguage />
        </button>
      ))}
    </div>
  );
}

const SETS: readonly { set: TsunagiSet; label: PhraseKey; kanji: string }[] = [
  { set: "classic", label: "pmaze.tsunagi.set.classic", kanji: "定番" },
  { set: "portals", label: "pmaze.tsunagi.set.portals", kanji: "跳" },
];

/** Which levels: the classic ones from 4×4 up, or the ones with portals. Two chips, on the set-up screen. */
export function TsunagiSetPicker({ set, onChoose }: { set: TsunagiSet; onChoose: (next: TsunagiSet) => void }) {
  const say = useSpeaker();
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={say.say("pmaze.tsunagi.levelsAria")} data-testid="tsunagi-set">
      {SETS.map((each) => (
        <button
          key={each.set}
          type="button"
          role="radio"
          aria-checked={set === each.set}
          className={`${PICK_WORD_CHIP} ${set === each.set ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
          onClick={() => onChoose(each.set)}
          data-testid={`tsunagi-set-${each.set}`}
        >
          <Paired en={say.say(each.label)} kanji={each.kanji} kanjiClassName="opacity-70" inReadersLanguage />
        </button>
      ))}
    </div>
  );
}
