"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { SuidoSet } from "@/lib/puzzles/suido/seed";

import { suidoWords } from "./mazeWords";

const SETS: readonly SuidoSet[] = ["classic", "big"];

/** Which levels: the ones by size, or the sixty-four with big pieces among the ordinary ones. Two chips, on the set-up screen, as Tsunagi's classic and portal levels are. */
export function SuidoSetPicker({ set, onChoose }: { set: SuidoSet; onChoose: (next: SuidoSet) => void }) {
  const say = useSpeaker();
  const words = suidoWords(say.locale).sets;
  return (
    <div className="flex flex-col gap-1.5" data-testid="suido-set-picker">
      <div className="flex gap-1.5" role="radiogroup" aria-label={words.aria} data-testid="suido-set">
        {SETS.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={set === each}
            className={`${PICK_WORD_CHIP} ${set === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`suido-set-${each}`}
          >
            <Paired en={words[each].label} kanji={words[each].kanji} kanjiClassName="opacity-70" inReadersLanguage />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted" data-testid="suido-set-says">
        {words[set].says}
      </p>
    </div>
  );
}
