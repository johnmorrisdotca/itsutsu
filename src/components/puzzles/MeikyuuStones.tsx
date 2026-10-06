"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { MEIKYUU_STONE_LIMITS } from "@/lib/puzzles/meikyuu/stones";

import { MEIKYUU_CHOICE } from "./meikyuu.constants";
import { meikyuuWords } from "./mazeWords";
import { useStoneLimit } from "./meikyuuStonesStore";

/**
 * HOW MANY STONES MAY LIE AT ONCE, chosen: a few (the package's, by the maze's size) or as many as the reader likes
 * (`meikyuu/stones.ts`). Stones are on every maze, so this is a setting and not a switch. Kept on this device
 * (`meikyuuStonesStore.ts`) and read by the play screen, so a choice made on the set-up is on the board at once.
 */
export function MeikyuuStones({ className = "" }: { className?: string }) {
  const { stones, choose } = useStoneLimit();
  const STONE_COPY = meikyuuWords(useSpeaker().locale).stone;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`} role="group" aria-label={STONE_COPY.legend} data-testid="meikyuu-stones">
      <p className="text-sm text-ink-soft">{STONE_COPY.legend}</p>
      <div className="flex flex-wrap gap-1.5">
        {MEIKYUU_STONE_LIMITS.map((each) => (
          <button
            key={each}
            type="button"
            className={`${MEIKYUU_CHOICE} ${stones === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            aria-pressed={stones === each}
            title={STONE_COPY[each].says}
            onClick={() => choose(each)}
            data-testid={`meikyuu-stones-${each}`}
            data-chosen={stones === each ? "true" : "false"}
          >
            {STONE_COPY[each].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted" data-testid="meikyuu-stones-note">
        {STONE_COPY.note} {STONE_COPY.other}
      </p>
    </div>
  );
}
