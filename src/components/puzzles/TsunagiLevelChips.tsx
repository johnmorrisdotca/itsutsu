"use client";

import { useState } from "react";

import { tsunagiMarks, tsunagiRole, type Challenge } from "@/lib/puzzles/tsunagi/ladder";

import { TSUNAGI_CHIPS } from "./puzzles.constants";

type ChipKey = "difficulty" | Challenge | "teaches" | "tests";

const CHIP = "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-none whitespace-nowrap";

/**
 * ONE ROW UNDER A LEVEL: how hard it measured, and what it asks. John,
 * 2026-09-26: "at the bottom of every map, show the obstacles or difficulty
 * level in one row… so the user can see that the level they are on has certain
 * challenges." Drawn like the settings chips beside it, but read-only: the
 * difficulty as five marks (`marks.data.ts`), a chip for each challenge on the
 * board, and where the level sits in its block's lesson — "New: Bridges" at a
 * 15th that brings one, "Block's test" at a 16th (`tsunagiRole`). Each chip's
 * line shows on a hover (its title) and on a tap, below the row, one at a time.
 * It wraps rather than run past a phone's edge.
 *
 * Under the board while a level is played or looked at, and on the set-up
 * screen for the level Start plays, so a level's challenges are seen before it
 * is started.
 */
export function TsunagiLevelChips({ size, level, challenges }: { size: number; level: number; challenges: readonly Challenge[] }) {
  const [open, setOpen] = useState<ChipKey | null>(null);
  const marks = tsunagiMarks(size, level);
  const role = tsunagiRole(size, level);
  const says = (key: ChipKey): string =>
    key === "difficulty" ? TSUNAGI_CHIPS.difficulty.says : key === "teaches" ? TSUNAGI_CHIPS.teaches.says : key === "tests" ? TSUNAGI_CHIPS.tests.says : TSUNAGI_CHIPS[key].says;
  const chip = (key: ChipKey, content: React.ReactNode, strong = false) => (
    <button
      key={key}
      type="button"
      className={`${CHIP} ${strong ? "border-ink bg-ink text-paper" : "border-rule-strong/70 bg-ivory text-ink-soft"} ${open === key ? "ring-2 ring-moss" : ""}`}
      title={says(key)}
      aria-expanded={open === key}
      onClick={() => setOpen(open === key ? null : key)}
      data-testid={`tsunagi-chip-${key}`}
    >
      {content}
    </button>
  );
  const named = (challenge: Challenge) => `${TSUNAGI_CHIPS[challenge].label}`;
  return (
    <div className="flex flex-col gap-1.5" data-testid="tsunagi-chips" data-level={level}>
      <div className="flex flex-wrap items-center gap-1.5">
        {marks === null
          ? null
          : chip(
              "difficulty",
              <>
                {TSUNAGI_CHIPS.difficulty.label}{" "}
                <span aria-label={`${marks} of 5`} data-testid="tsunagi-difficulty" data-marks={marks}>
                  {"●".repeat(marks)}
                  <span className="opacity-30">{"●".repeat(5 - marks)}</span>
                </span>
              </>,
            )}
        {role?.role === "teaches" && role.newOnes.length > 0 ? chip("teaches", TSUNAGI_CHIPS.teaches.label(role.newOnes.map(named).join(" and ")), true) : null}
        {role?.role === "tests" ? chip("tests", <>{TSUNAGI_CHIPS.tests.label} <span className="font-mincho opacity-70">{TSUNAGI_CHIPS.tests.kanji}</span></>, true) : null}
        {challenges.map((challenge) =>
          chip(
            challenge,
            <>
              {TSUNAGI_CHIPS[challenge].label} <span className="font-mincho opacity-70">{TSUNAGI_CHIPS[challenge].kanji}</span>
            </>,
          ),
        )}
      </div>
      {open === null ? null : (
        <p className="text-xs text-muted" data-testid="tsunagi-chip-says" aria-live="polite">
          {says(open)}
        </p>
      )}
    </div>
  );
}
