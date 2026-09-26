"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { playPath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { generatePuzzle, preparePuzzle } from "@/lib/puzzles/generate";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { freshSeed } from "@/lib/puzzles/random";

import { BlackAndWhiteSolve } from "./BlackAndWhiteSolve";
import { HiddenStonesSolve } from "./HiddenStonesSolve";
import { GomojiKanaSolve } from "./GomojiKanaSolve";
import { GomojiSolve } from "./GomojiSolve";
import { KumimojiSolve } from "./KumimojiSolve";
import { NumberSolve } from "./NumberSolve";
import type { TsunagiMarks } from "./puzzles.constants";
import { TsunagiSolve } from "./TsunagiSolve";
import type { ResumedRun, SolveRace } from "./solveShared";

/**
 * Solving a puzzle: the whole of it, in the browser.
 *
 * The puzzle is made here from the seed in the address (`generatePuzzle`),
 * with its answer, and never asked of a server. Each kind has a solve of its
 * own — a grid of numbers, a grid of stones, a grid of black and white — sharing the clock, the
 * handing-in and the card at the end (`solveShared.tsx`). Nothing polls,
 * nothing is timed on a server, and a stranger's solve costs the site
 * nothing at all (John: "should cost me nothing, no server calculations").
 *
 * LOADED WITH `ssr: false` (`PuzzlePlayClient`), and that is what keeps the
 * promise: this component generates in render, and a server render of it
 * would be the server making the puzzle. The page shows "making your
 * puzzle" until the browser has.
 *
 * A seed nobody chose is drawn here and written into the address, so the
 * puzzle on the screen is the puzzle the address names: reload it, share it,
 * or come back tomorrow and the same puzzle is there.
 */
export function PuzzlePlay({
  kind,
  size,
  level,
  seed,
  hasAccount,
  race = null,
  checks = null,
  hints = false,
  strict = false,
  headStart = false,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
  tsunagi = null,
}: {
  /** Whether Gomoji's Head start was chosen: keys greyed before the first guess (`headStart.ts`), easy only. */
  headStart?: boolean;
  /** Tsunagi's levels already solved at this size on the account, and whether it is played by colours or numbers. */
  tsunagi?: { known: Record<number, number>; marks: TsunagiMarks | null } | null;
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  seed: number | null;
  /** How many times Check may be pressed, from the address; null for no limit. */
  checks?: number | null;
  /** Whether Hint was chosen for this puzzle, from the address. */
  hints?: boolean;
  /** Whether Gomoji's Strict was chosen: every letter found must be played again, a green in its place. */
  strict?: boolean;
  /** The run the member kept of this grid, opened where it was left. */
  resumed?: ResumedRun | null;
  /** Whether a solve can be paid: an account, not merely a session. */
  hasAccount: boolean;
  /** The race this solve is a seat of, with the givens the server kept, or null for a solve on one's own. */
  race?: (SolveRace & { givens: string }) | null;
  /** The reader's board: Gomoji's board colour picker (`GomojiSolve`, `GomojiKanaSolve`), and the stone set a puzzle played with stones draws. */
  appearance?: Appearance;
}) {
  const router = useRouter();

  /* A seed nobody chose: draw one and put it in the address, so the puzzle is
     the address's. `replace`, so the back button does not return to a page
     that would draw a different one. */
  useEffect(() => {
    if (seed !== null) return;
    // A puzzle of fixed levels has no seed to draw: no level asked is the board of levels to choose one on.
    if (PUZZLE_SPECS[kind].fixedLevels === true) {
      router.replace(`${setUpPath(kind)}?size=${size}`);
      return;
    }
    router.replace(`${playPath(kind)}${puzzleQuery({ size, level, seed: freshSeed(), checks, hints, strict, headStart })}`);
  }, [seed, kind, size, level, checks, hints, strict, headStart, router]);

  /* A kind whose words or levels load by size (the kana Gomoji, Tsunagi, Kumimoji) waits for them; every other kind is ready at once. */
  const [loaded, setLoaded] = useState<string | null>(kind === "gomojiKana" || kind === "tsunagi" || kind === "kumimoji" ? null : `${kind}:${size}`);
  useEffect(() => {
    let live = true;
    void preparePuzzle(kind, size).then(() => live && setLoaded(`${kind}:${size}`));
    return () => {
      live = false;
    };
  }, [kind, size]);
  const puzzle = useMemo(
    () => (seed === null || loaded !== `${kind}:${size}` ? null : generatePuzzle(kind, size, level, seed)),
    [kind, size, level, seed, loaded],
  );

  if (puzzle === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-ready="false">
        <div className="flex aspect-square w-full items-center justify-center rounded-md border border-rule text-sm text-muted" data-testid="puzzle-making">
          Making your puzzle…
        </div>
      </section>
    );
  }
  /* A race's puzzle is made again here from its seed; if this browser's
     generator makes a different grid from the one the server kept, the race
     was made by another version of the site and cannot honestly be played. */
  if (race !== null && race !== undefined && race.givens !== puzzle.givens) {
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-ready="true">
        <p className="text-sm text-muted" data-testid="puzzle-race-mismatch">
          This race was made by an earlier version of the site, and this browser makes a different puzzle from its
          number. It cannot be played; start another.
        </p>
      </section>
    );
  }
  /* Keyed on the puzzle, so a new seed is a new solve with nothing carried over. */
  const key = `${kind}-${size}-${level}-${seed}-${checks ?? "any"}-${strict}-${headStart}`;
  // A race carries no Head start, as it carries no Strict: both seats play the one straight contest.
  const seat = race ?? null;
  const headStarted = seat === null && headStart;
  switch (kind) {
    case "hiddenStones":
      return <HiddenStonesSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} set={STONE_SETS[appearance.stoneSet]} />;
    case "blackAndWhite":
      return <BlackAndWhiteSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} set={STONE_SETS[appearance.stoneSet]} />;
    case "gomoji":
    case "gomojiMot":
    case "gomojiWort":
      return <GomojiSolve key={key} puzzle={puzzle} strict={strict} headStart={headStarted} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} />;
    case "tsunagi":
      return (
        <TsunagiSolve
          key={key}
          puzzle={puzzle}
          hasAccount={hasAccount}
          race={seat}
          resumed={race === null ? resumed : null}
          appearance={appearance}
          known={tsunagi?.known}
          marksChosen={tsunagi?.marks ?? null}
        />
      );
    case "kumimoji":
      return <KumimojiSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} />;
    case "gomojiKana":
      return <GomojiKanaSolve key={key} puzzle={puzzle} strict={strict} headStart={headStarted} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} />;
    default:
      return <NumberSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} />;
  }
}
