"use client";

import { MOVE_FORMAT_CHOICES, MOVE_FORMAT_DISPLAY } from "@/lib/record/moveFormats";

import { useMoveFormat } from "./MoveFormatContext";

/**
 * HOW THE MOVES ARE WRITTEN, a quiet control over a record: ours, or two a
 * line as ItsYourTurn and GoldToken print them, kept on the account
 * (`MoveFormatContext`). John, 2026-09-25: "a tertiary button that offers to
 * display in all the known formats we support. and save to memory." Then, on
 * a finished game with one format only: "Move list I thought I asked for
 * ability to be in multi-formats." So it is one control, over the record of a
 * game being played (`MoveHistory`) and of a finished one (`GameReplay`), and
 * the two cannot offer different choices.
 */
export function MoveFormatPicker() {
  const { format, setFormat } = useMoveFormat();
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="How the moves are written" data-testid="move-format">
      {MOVE_FORMAT_CHOICES.map((choice) => (
        <button
          key={choice}
          type="button"
          role="radio"
          aria-checked={format === choice}
          onClick={() => setFormat(choice)}
          title={MOVE_FORMAT_DISPLAY[choice].example}
          className={`rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors ${
            format === choice ? "border-ink bg-ink text-paper" : "border-rule text-muted hover:border-rule-strong hover:text-ink"
          }`}
          data-testid={`move-format-${choice}`}
        >
          {MOVE_FORMAT_DISPLAY[choice].label}
        </button>
      ))}
    </div>
  );
}
