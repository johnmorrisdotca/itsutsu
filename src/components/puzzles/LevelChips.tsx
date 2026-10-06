"use client";

import { useState, type ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { readerName } from "./readerName";

const CHIP = "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-none whitespace-nowrap";

/** What one chip says: its words (in the reader's language where it has no kanji), its kanji where it has one, and the line a hover or a tap shows. */
export type LevelChip = { key: string; label: string; kanji?: string; says: string };

/** The words of the row's three fixed chips, which every game of levels has: its difficulty, what a block's 15th level teaches and what its 16th tests. */
export type LevelChipsCopy = {
  difficulty: { label: string; says: string };
  teaches: { says: string };
  tests: { label: string; kanji: string; says: string };
};

/**
 * ONE ROW UNDER A LEVEL, FOR ANY GAME THAT HAS FIXED LEVELS: how hard it
 * measured, where it sits in its block's lesson, and a chip for each twist it
 * has. John, 2026-09-26, of Tsunagi: "at the bottom of every map, show the
 * obstacles or difficulty level in one row… so the user can see that the level
 * they are on has certain challenges." Drawn like the settings chips beside it,
 * but read-only: the difficulty as five marks, "New: Walls" at a 15th level
 * that brings one, "Block's test" at a 16th, and a chip for each twist on the
 * board. Each chip's line shows on a hover (its title) and on a tap, below the
 * row, one at a time. It wraps rather than run past a phone's edge.
 *
 * The game says what its chips are (`copy`, `twists`) and which of its test ids
 * they carry (`prefix`: `tsunagi-chip-bridges`, `suido-chip-walls`); the row,
 * its ordering and its behaviour are one component for every game that has them.
 * Under the board while a level is played or looked at, and on the set-up
 * screen for the level Start plays, so a level's twists are seen before it is
 * started.
 */
export function LevelChips({
  prefix,
  level,
  marks,
  role,
  twists,
  copy,
}: {
  prefix: string;
  level: number;
  /** How hard the level measured, 1 to 5; null where it has no mark. */
  marks: number | null;
  /** Where it sits in its block's lesson: the 15th teaches, the 16th tests; `newOnes` names what a 15th brings that no level before it has. */
  role: { role: "teaches" | "tests"; newOnes: readonly string[] } | null;
  twists: readonly LevelChip[];
  copy: LevelChipsCopy;
}) {
  const say = useSpeaker();
  const [open, setOpen] = useState<string | null>(null);
  const says = (key: string): string => (key === "difficulty" ? copy.difficulty.says : key === "teaches" ? copy.teaches.says : key === "tests" ? copy.tests.says : (twists.find((twist) => twist.key === key)?.says ?? ""));
  const chip = (key: string, content: ReactNode, strong = false) => (
    <button
      key={key}
      type="button"
      className={`${CHIP} ${strong ? "border-ink bg-ink text-paper" : "border-rule-strong/70 bg-ivory text-ink-soft"} ${open === key ? "ring-2 ring-moss" : ""}`}
      title={says(key)}
      aria-expanded={open === key}
      onClick={() => setOpen(open === key ? null : key)}
      data-testid={`${prefix}-chip-${key}`}
    >
      {content}
    </button>
  );
  return (
    <div className="flex flex-col gap-1.5" data-testid={`${prefix}-chips`} data-level={level}>
      <div className="flex flex-wrap items-center gap-1.5">
        {marks === null
          ? null
          : chip(
              "difficulty",
              <>
                {copy.difficulty.label}{" "}
                <span aria-label={say.say("pmaze.chip.marksOf", { marks: String(marks) })} data-testid={`${prefix}-difficulty`} data-marks={marks}>
                  {"●".repeat(marks)}
                  <span className="opacity-30">{"●".repeat(5 - marks)}</span>
                </span>
              </>,
            )}
        {role?.role === "teaches" && role.newOnes.length > 0 ? chip("teaches", say.say("pmaze.chip.new", { things: say.list(role.newOnes) }), true) : null}
        {role?.role === "tests" ? chip("tests", <><Paired en={copy.tests.label} kanji={copy.tests.kanji} kanjiClassName="opacity-70" inReadersLanguage /></>, true) : null}
        {twists.map((twist) =>
          chip(
            twist.key,
            <>
              <Paired en={readerName(say, twist)} kanji={twist.kanji ?? ""} kanjiClassName="opacity-70" inReadersLanguage />
            </>,
          ),
        )}
      </div>
      {open === null ? null : (
        <p className="text-xs text-muted" data-testid={`${prefix}-chip-says`} aria-live="polite">
          {says(open)}
        </p>
      )}
    </div>
  );
}
