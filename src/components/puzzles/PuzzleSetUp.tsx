"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { generatePuzzle } from "@/lib/puzzles/generate";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { freshSeed } from "@/lib/puzzles/random";
import { PUZZLE_CHECK_ALLOWANCES, PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SIZE_NAMES, PUZZLE_SPECS, checkAllowanceWords } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardPicker } from "@/components/live/BoardPicker";
import { SetUpSection } from "@/components/live/SetUpSection";

import { sizeWord } from "./puzzles.constants";

/**
 * Setting a puzzle up, at /games/<slug>/new: a size, a level, and Solve.
 *
 * The same address a game is set up at, and the same shape — tiles for the
 * one choice that has a picture, chips for the one that has not — with
 * everything a game asks left out: no seats, no clock, no opponent, because
 * a puzzle has none. Nothing is written when Solve is pressed; the address
 * it leads to holds the whole of the choice, and the browser makes the
 * puzzle when it gets there.
 */
export function PuzzleSetUp({
  kind,
  hasAccount,
  framed = true,
  sized,
}: {
  kind: PuzzleKind;
  /** A race is between two members, so a session with no account is told so rather than offered one. */
  hasAccount: boolean;
  framed?: boolean;
  /**
   * The size, when the caller holds it and draws the size tiles itself — the
   * set-up screen puts them beside the puzzle's picture, the way it puts a
   * game's boards beside the board (`PuzzleHere`). Left out, this draws them.
   */
  sized?: { size: number; onSize: (size: number) => void };
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const spec = PUZZLE_SPECS[kind];
  const copy = PUZZLE_DISPLAY[kind];
  const [ownSize, setOwnSize] = useState(spec.defaultSize);
  const size = sized?.size ?? ownSize;
  const [level, setLevel] = useState<PuzzleLevel>(spec.defaultLevel);
  const [checks, setChecks] = useState<number | null>(null);
  // Hint, off unless chosen: see `useHints`. Not carried into a race, which allows none.
  const [hints, setHints] = useState(false);
  const [racing, setRacing] = useState<"" | "making" | string>("");

  /*
   * A race: this browser makes the puzzle, posts it whole, and the site
   * answers with the race's address — the host is taken there, where the
   * guest's seat link waits to be sent. Nothing is generated on a server.
   */
  const race = async () => {
    setRacing("making");
    try {
      const made = generatePuzzle(kind, size, level, freshSeed());
      const answered = await fetch("/api/puzzles/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, size, level, seed: made.seed, givens: made.givens, solution: made.solution, checksAllowed: checks }),
      });
      const body = (await answered.json().catch(() => null)) as { at?: string; error?: string } | null;
      if (!answered.ok || body?.at === undefined) {
        setRacing(body?.error ?? "The site could not make the race.");
        return;
      }
      router.push(body.at);
    } catch {
      setRacing("The site could not be reached.");
    }
  };

  return (
    // Unframed inside the set-up screen's own panel, which already is one: a box in a box is what the page-shape rules forbid.
    <section className={`${framed ? PANEL_CLASS : ""} flex flex-col gap-5`} data-testid="puzzle-set-up" {...readyMark(hydrated)}>
      {sized === undefined ? <PuzzleSizes kind={kind} size={size} onSize={setOwnSize} /> : null}

      {/*
        THE PUZZLE'S OWN SETTINGS, UNDER A HEADING, BELOW THE CHOICE OF PUZZLE —
        where a game's opponent and rules are. John, 2026-09-24: "Numbers
        introduced Difficulty which takes up space that the others didn't.
        Probably should just go with the rest of customization / settings later
        below." What each size is for goes here too: it was a paragraph under
        the size tiles, and made that column a different height for every puzzle.
      */}
      <SetUpSection title="Size, level and help" kanji="盤・難易度・手助け" testId="puzzle-settings">
        <p className="text-xs text-muted" data-testid="puzzle-size-note">
          {copy.board}
        </p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Level">
          {spec.levels.map((each) => (
            <button
              key={each}
              type="button"
              role="radio"
              aria-checked={level === each}
              className={`${PICK_WORD_CHIP} ${level === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => setLevel(each)}
              data-testid={`puzzle-level-${each}`}
            >
              {PUZZLE_LEVEL_DISPLAY[each].label} <span className="font-mincho opacity-70">{PUZZLE_LEVEL_DISPLAY[each].kanji}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted" data-testid="puzzle-level-blurb">
          {PUZZLE_LEVEL_DISPLAY[level].blurb}
        </p>
        {/*
          HOW MANY TIMES CHECK MAY BE PRESSED — see `PUZZLE_CHECK_ALLOWANCES` for
          why running out takes the help away rather than ending the puzzle. A
          race carries it too, the same for both seats.
        */}
        <div className="flex flex-wrap gap-1.5 pt-1" role="radiogroup" aria-label="Checks">
          {PUZZLE_CHECK_ALLOWANCES.map((each) => {
            const words = checkAllowanceWords(each);
            return (
              <button
                key={String(each)}
                type="button"
                role="radio"
                aria-checked={checks === each}
                className={`${PICK_WORD_CHIP} ${checks === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                onClick={() => setChecks(each)}
                data-testid={`puzzle-checks-${each ?? "unlimited"}`}
              >
                {words.label} <span className="font-mincho opacity-70">{words.kanji}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted" data-testid="puzzle-checks-blurb">
          {checkAllowanceWords(checks).blurb}
        </p>
        {/*
          HINT, chosen here or not at all. John, 2026-09-24: "when a user wants a
          HINT button they can add as an option for these games... and when
          pressed, we highlight what's wrong." Off by default; the button is
          always on the puzzle, disabled with its reason when it was not chosen.
        */}
        <div className="flex flex-wrap gap-1.5 pt-1" role="radiogroup" aria-label="Hints">
          {[false, true].map((each) => (
            <button
              key={String(each)}
              type="button"
              role="radio"
              aria-checked={hints === each}
              className={`${PICK_WORD_CHIP} ${hints === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => setHints(each)}
              data-testid={`puzzle-hints-${each ? "on" : "off"}`}
            >
              {each ? "Hints" : "No hints"} <span className="font-mincho opacity-70">{each ? "ヒント有" : "ヒント無"}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted" data-testid="puzzle-hints-blurb">
          {hints
            ? "Hint marks which cells are wrong, as often as you like; a solve that used one says so beside its time."
            : "No hints: Check is the only help, and it never says which cells."}
        </p>
      </SetUpSection>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null, checks, hints })}`} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2`} data-testid="puzzle-solve">
          Solve a {sizeWord(size)} {copy.label} →
        </Link>
        <span className="text-xs text-muted">Made in your browser, one answer, timed from your first entry.</span>
      </div>

      <fieldset className="flex flex-col gap-2 border-t border-rule pt-4">
        <legend className={SECTION_TITLE}>
          Race a friend <span className="font-mincho normal-case tracking-normal">競解</span>
        </legend>
        <p className="text-xs text-muted">
          The same {sizeWord(size)} puzzle for two people, each with a clock the site keeps from their own Start. The
          faster correct solve wins. You get a link to send; whoever opens it takes the other seat.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {hasAccount ? (
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2`} onClick={race} disabled={racing === "making"} data-testid="puzzle-race">
              {racing === "making" ? "Making the race…" : `Race a friend at ${sizeWord(size)} →`}
            </button>
          ) : (
            <span className="text-sm text-muted" data-testid="puzzle-race-needs-account">
              A race is between two members, and this session has no account yet.
            </span>
          )}
          {racing !== "" && racing !== "making" ? <span className="text-sm text-shu">{racing}</span> : null}
        </div>
      </fieldset>
    </section>
  );
}

/**
 * A puzzle's sizes, as the tiles every board size on this site is chosen
 * from: `BoardPicker`, with the big number in the board's own lattice
 * (`BoardSizeMark`), the chosen mark, and a name for what the size is for.
 *
 * John, 2026-09-24, on these tiles as they first shipped — a picture of their
 * own with "4×4" printed under it: "Why does those size boards look different
 * than every other single size board we have ever created." They were drawn by
 * a second component the puzzles brought with them; `boardSizeMark.coverage`
 * now refuses a size picture that is not `BoardSizeMark`. What each size is
 * for is said in the settings below (`PuzzleSetUp`), not under the tiles.
 */
export function PuzzleSizes({ kind, size, onSize, beside = false }: { kind: PuzzleKind; size: number; onSize: (size: number) => void; beside?: boolean }) {
  return (
    <BoardPicker value={size} sizes={PUZZLE_SPECS[kind].offered} onChange={onSize} names={PUZZLE_SIZE_NAMES[kind]} beside={beside} />
  );
}
