"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SECTION_TITLE } from "@/components/ui/ui.constants";

import { partyScreenWords } from "./partyWords";

/**
 * HOW MANY ARE PLAYING — one component for every table's set-up. John,
 * 2026-09-29: "our Options should be using reusable modules for a lot of
 * thing, like Difficulty, Board type, Marble colour". Three tables drew this
 * row by hand, each its own copy of the same buttons; this is that row, once:
 * the counts a table offers, in one line of equal tiles, the chosen one dark.
 * A table keeps its own test id so what a spec presses does not change.
 */
export function PlayerCountChoice<C extends number>({
  counts,
  value,
  onChange,
  testId,
}: {
  counts: readonly C[];
  value: C;
  onChange: (count: C) => void;
  /** The id each button carries, with its count as `data-count`. */
  testId: string;
}) {
  const PARTY_COPY = partyScreenWords(useSpeaker().locale);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{PARTY_COPY.howMany}</legend>
      <div
        className={`grid ${counts.length > 5 ? "gap-1.5" : "gap-2"}`}
        style={{ gridTemplateColumns: `repeat(${counts.length}, minmax(0, 1fr))` }}
        role="radiogroup"
        aria-label={PARTY_COPY.howMany}
      >
        {counts.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            onClick={() => onChange(option)}
            aria-checked={option === value}
            data-testid={testId}
            data-count={option}
            className={`min-h-11 min-w-0 rounded-lg border text-base font-semibold ${
              option === value ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory text-ink hover:bg-rule/60"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
