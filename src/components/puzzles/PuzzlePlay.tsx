"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { playPath } from "@/lib/gomoku/slugs";
import { generatePuzzle } from "@/lib/puzzles/generate";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { freshSeed } from "@/lib/puzzles/random";

import { HiddenStonesSolve } from "./HiddenStonesSolve";
import { NumberSolve } from "./NumberSolve";

/**
 * Solving a puzzle: the whole of it, in the browser.
 *
 * The puzzle is made here from the seed in the address (`generatePuzzle`),
 * with its answer, and never asked of a server. Each kind has a solve of its
 * own — a grid of numbers, a grid of stones — sharing the clock, the
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

  const puzzle = useMemo(() => (seed === null ? null : generatePuzzle(kind, size, level, seed)), [kind, size, level, seed]);

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
  const key = `${kind}-${size}-${level}-${seed}`;
  switch (kind) {
    case "hiddenStones":
      return <HiddenStonesSolve key={key} puzzle={puzzle} hasAccount={hasAccount} />;
    default:
      return <NumberSolve key={key} puzzle={puzzle} hasAccount={hasAccount} />;
  }
}
