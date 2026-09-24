"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { playPath, setUpPath } from "@/lib/gomoku/slugs";
import { generateNumberPlace } from "@/lib/puzzles/numberPlace/generate";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { decodeCells, encodeCells } from "@/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle, PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PuzzleGrid } from "./PuzzleGrid";
import { PUZZLE_CLOCK, PUZZLE_CLOCK_TICK_MS, PUZZLE_KEY, PUZZLE_KEYS, sizeWord } from "./puzzles.constants";

/**
 * Solving a puzzle: the whole of it, in the browser.
 *
 * The puzzle is made here from the seed in the address (`generateNumberPlace`),
 * with its answer, and never asked of a server. The clock starts on the first
 * entry and is the browser's own; Check compares against the answer this tab
 * holds and says how many cells are wrong, never which. When the last cell is
 * right the puzzle is done, and the one thing that leaves the browser is
 * posted then: the givens and the grid, to `POST /api/puzzles/solved`, which
 * checks it in O(cells) and pays a member. Nothing polls, nothing is timed on
 * a server, and a stranger's solve costs the site nothing at all (John:
 * "should cost me nothing, no server calculations").
 *
 * LOADED WITH `ssr: false` (`PuzzlePlayClient`), and that is what keeps the
 * promise: this component generates in render, and a server render of it
 * would be the server making the puzzle. The page shows "making your
 * puzzle" until the browser has.
 *
 * A seed nobody chose is drawn here and written into the address, so the
 * puzzle on the screen is the puzzle the address names: reload it, share it,
 * or come back tomorrow and the same givens are there.
 */
export function PuzzlePlay({
  kind,
  size,
  level,
  seed,
  hasAccount,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  seed: number | null;
  /** Whether a solve can be paid: an account, not merely a session. */
  hasAccount: boolean;
}) {
  const router = useRouter();

  /* A seed nobody chose: draw one and put it in the address, so the puzzle is
     the address's. `replace`, so the back button does not return to a page
     that would draw a different one. */
  useEffect(() => {
    if (seed !== null) return;
    router.replace(`${playPath(kind)}${puzzleQuery({ size, level, seed: freshSeed() })}`);
  }, [seed, kind, size, level, router]);

  const puzzle = useMemo(() => (seed === null ? null : generateNumberPlace(size, level, seed)), [size, level, seed]);

  if (puzzle === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-ready="false">
        <div className="flex aspect-square w-full items-center justify-center rounded-md border border-rule text-sm text-muted" data-testid="puzzle-making">
          Making your puzzle…
        </div>
      </section>
    );
  }
  /* Keyed on the puzzle, so a new seed is a new solve with nothing carried over. */
  return <Solve key={`${kind}-${size}-${level}-${seed}`} puzzle={puzzle} hasAccount={hasAccount} />;
}

type Done = { elapsedMs: number; paid: { points: number; awards: string[] } | null; problem: string | null };

function Solve({ puzzle, hasAccount }: { puzzle: Puzzle; hasAccount: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { kind, size, level, seed } = puzzle;
  const copy = PUZZLE_DISPLAY[kind];
  const givens = useMemo(() => decodeCells(puzzle.givens, size) ?? [], [puzzle.givens, size]);
  const solution = useMemo(() => decodeCells(puzzle.solution, size) ?? [], [puzzle.solution, size]);
  const [entries, setEntries] = useState<number[]>(() => new Array<number>(size * size).fill(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [checked, setChecked] = useState<{ wrong: number; empty: number } | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  /* The clock: a browser interval while the puzzle is being solved, and nothing at all before or after. */
  useEffect(() => {
    if (startedAt === null || done !== null) return;
    const timer = window.setInterval(() => setNow(Date.now()), PUZZLE_CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [startedAt, done]);

  const finish = useCallback(
    async (grid: number[], at: number) => {
      const elapsedMs = startedAt === null ? 0 : at - startedAt;
      setDone({ elapsedMs, paid: null, problem: null });
      if (!hasAccount) return;
      // The whole grid: the givens where they were printed, the entries everywhere else.
      const answer = encodeCells(grid.map((cell, index) => (givens[index] !== 0 ? givens[index] : cell)));
      try {
        const answered = await fetch("/api/puzzles/solved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, size, level, givens: puzzle.givens, answer, elapsedMs }),
        });
        const body = (await answered.json().catch(() => null)) as { points?: number; awards?: string[]; error?: string } | null;
        if (!answered.ok) {
          setDone({ elapsedMs, paid: null, problem: body?.error ?? "The site could not record that solve." });
          return;
        }
        setDone({ elapsedMs, paid: { points: body?.points ?? 0, awards: body?.awards ?? [] }, problem: null });
      } catch {
        setDone({ elapsedMs, paid: null, problem: "The site could not be reached to record that solve." });
      }
    },
    [puzzle.givens, givens, startedAt, hasAccount, kind, size, level],
  );

  const enter = useCallback(
    (value: number) => {
      if (selected === null || done !== null || givens[selected] !== 0) return;
      const at = Date.now();
      if (startedAt === null) {
        setStartedAt(at);
        setNow(at);
      }
      const next = [...entries];
      next[selected] = value;
      setEntries(next);
      setChecked(null);
      if (next.every((cell, index) => givens[index] !== 0 || cell !== 0)) {
        const wrong = next.filter((cell, index) => givens[index] === 0 && cell !== solution[index]).length;
        if (wrong === 0) void finish(next, at);
        else setChecked({ wrong, empty: 0 });
      }
    },
    [selected, done, givens, startedAt, entries, solution, finish],
  );

  /* The keyboard: digits fill, Backspace clears, arrows move. Only while a cell is chosen. */
  useEffect(() => {
    if (selected === null || done !== null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= size) {
        event.preventDefault();
        enter(digit);
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        enter(0);
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = { ArrowUp: -size, ArrowDown: size, ArrowLeft: -1, ArrowRight: 1 }[event.key] ?? 0;
        const next = selected + step;
        if (next >= 0 && next < size * size) setSelected(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, done, size, enter]);

  const check = () => {
    const wrong = entries.filter((cell, index) => givens[index] === 0 && cell !== 0 && cell !== solution[index]).length;
    const empty = entries.filter((cell, index) => givens[index] === 0 && cell === 0).length;
    setChecked({ wrong, empty });
  };

  const another = () => {
    router.push(`${playPath(kind)}${puzzleQuery({ size, level, seed: freshSeed() })}`);
  };

  const elapsedMs = done !== null ? done.elapsedMs : startedAt === null ? 0 : Math.max(0, now - startedAt);

  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-muted" data-testid="puzzle-asked">
          {sizeWord(size)} · {PUZZLE_LEVEL_DISPLAY[level].label}{" "}
          <span className="font-mincho">{PUZZLE_LEVEL_DISPLAY[level].kanji}</span>
          <span className="ml-2 text-xs">№ {seed}</span>
        </p>
        <p className={PUZZLE_CLOCK} data-testid="puzzle-clock" aria-label="time taken">
          {clockText(elapsedMs)}
        </p>
      </div>

      <PuzzleGrid size={size} givens={givens} entries={entries} selected={selected} done={done !== null} onSelect={setSelected} />

      {done === null ? (
        <>
          <div className={PUZZLE_KEYS} style={{ gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))` }} data-testid="puzzle-keys">
            {Array.from({ length: size }, (_, i) => i + 1).map((value) => (
              <button key={value} type="button" className={PUZZLE_KEY} onClick={() => enter(value)} data-testid={`puzzle-key-${value}`}>
                {value}
              </button>
            ))}
            <button type="button" className={PUZZLE_KEY} onClick={() => enter(0)} aria-label="clear the cell" data-testid="puzzle-key-clear">
              ×
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={check} disabled={startedAt === null} data-testid="puzzle-check">
              Check
            </button>
            {checked !== null ? (
              <span className="text-sm text-muted" data-testid="puzzle-checked" aria-live="polite">
                {checkedWords(checked)}
              </span>
            ) : (
              <span className="text-sm text-muted">Tap a cell, then a number. The clock starts on your first entry.</span>
            )}
          </div>
        </>
      ) : (
        <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-done" aria-live="polite">
          <p className="text-lg font-semibold">
            Solved <span className="font-mincho text-base font-normal opacity-70">解決</span> in {clockText(done.elapsedMs)}.
          </p>
          <p className="text-sm text-muted" data-testid="puzzle-paid">
            {!hasAccount
              ? "A member is paid XP for a solve. Join, and the next one counts."
              : done.paid !== null
                ? done.paid.points > 0
                  ? `+${done.paid.points} XP, for ${awardWords(done.paid.awards)}.`
                  : "Already paid for this puzzle, or the day's allowance is spent — the solve still stands."
                : (done.problem ?? "Recording your solve…")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={another} data-testid="puzzle-another">
              Another {copy.label} →
            </button>
            <Link href={setUpPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-set-up">
              Change the size or level
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

/** `m:ss`, and `h:mm:ss` past an hour. */
export function clockText(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const s = seconds % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

/** What Check says: how many are wrong and how many are still empty, never which. */
export function checkedWords(checked: { wrong: number; empty: number }): string {
  if (checked.wrong === 0 && checked.empty === 0) return "Everything is filled and right.";
  const wrong = checked.wrong === 0 ? "Nothing wrong so far" : `${checked.wrong} ${checked.wrong === 1 ? "cell is" : "cells are"} wrong`;
  const empty = checked.empty > 0 ? `, ${checked.empty} still to fill` : "";
  return `${wrong}${empty}.`;
}

const AWARD_WORDS: Record<string, string> = {
  puzzleSolved: "the solve",
  firstOfVariant: "your first of this puzzle",
  firstOfFamily: "your first puzzle at all",
  everyVariantPlayed: "every game on the site played",
  everyFamilyPlayed: "every family met",
};

function awardWords(awards: readonly string[]): string {
  const words = awards.map((award) => AWARD_WORDS[award] ?? award);
  if (words.length <= 1) return words[0] ?? "the solve";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
