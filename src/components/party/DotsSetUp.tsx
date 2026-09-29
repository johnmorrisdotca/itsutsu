"use client";

import { useState } from "react";

import { BoardSizeMark } from "@/components/board/BoardSizeMark";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { DOTS_NAME_MOST, dotsLineCount, startDots } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";

import { DotsBoard } from "./DotsBoard";
import { MarbleChip } from "./MarbleChip";
import { DOTS_COPY, PARTY_COPY, PARTY_MARBLES } from "./party.constants";
import type { DotsSetUpProps } from "./party.types";

const SPEC = PARTY_SPECS.dotsAndBoxes;
const COUNTS = Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, index) => SPEC.fewestPlayers + index);

/**
 * THE TABLE, BEFORE ANYBODY DRAWS: how many are playing, on which board, and
 * what they are called if they want names. Beside it the live board at the
 * chosen size — every set-up preview on this site is the board itself, never
 * a picture of one — drawn `readOnly`, with nothing to tap.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the board
 * is a square as wide as its column whatever its size, the four boards are
 * four tiles of one size, and there is a row for every name the table could
 * need, the ones past the count chosen kept in their place and hidden.
 */
export function DotsSetUp({ appearance, onStart, ready }: DotsSetUpProps) {
  const [count, setCount] = useState(SPEC.defaultPlayers);
  const [size, setSize] = useState(SPEC.defaultSize);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  const seated = names.slice(0, count);
  // A table the set-up offers is always one the rules start.
  const preview = startDots(size, seated)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="dots-preview">
        <DotsBoard game={preview} appearance={appearance} readOnly />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="dots-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(startDots(size, seated)!);
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PARTY_COPY.howMany}</legend>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={PARTY_COPY.howMany}>
            {COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                onClick={() => setCount(option)}
                aria-checked={option === count}
                data-testid="dots-count"
                data-count={option}
                className={`min-h-11 rounded-lg border text-base font-semibold ${
                  option === count ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory text-ink hover:bg-rule/60"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DOTS_COPY.board}</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={DOTS_COPY.board}>
            {SPEC.sizes.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                onClick={() => setSize(option)}
                aria-checked={option === size}
                data-testid="dots-size"
                data-size={option}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg border p-0.5 pb-1 text-xs ${
                  option === size ? "border-ink bg-rule/70 font-semibold" : "border-rule-strong bg-ivory hover:bg-rule/60"
                }`}
              >
                <BoardSizeMark side={option} size="regular" words="none" />
                <span className="text-muted">{DOTS_COPY.lines(dotsLineCount(option))}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PARTY_COPY.names}</legend>
          {names.map((name, index) => {
            const sitting = index < count;
            return (
              <label key={index} className={`flex items-center gap-2 text-sm ${sitting ? "" : "invisible"}`} aria-hidden={sitting ? undefined : true}>
                <MarbleChip player={index} />
                <span className="sr-only">
                  Player {index + 1}, {PARTY_MARBLES[index].label}
                </span>
                <input
                  type="text"
                  value={name}
                  maxLength={DOTS_NAME_MOST}
                  placeholder={`Player ${index + 1}`}
                  disabled={!sitting}
                  onChange={(event) => setNames((was) => was.map((one, at) => (at === index ? event.target.value : one)))}
                  className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                  data-testid="dots-name"
                />
              </label>
            );
          })}
        </fieldset>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="dots-start">
          {PARTY_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
      </form>
    </div>
  );
}
