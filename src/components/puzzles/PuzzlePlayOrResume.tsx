import Link from "@/components/ui/Link";

import { PlayButton } from "@/components/games/PlayButton";
import { currentMemberId } from "@/lib/auth/currentSession";
import { playPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { latestRunOf } from "@/lib/puzzles/server/puzzleRuns";

/**
 * THE BIG BUTTON UNDER A PUZZLE'S PICTURE: Play, or Resume where the reader
 * already has one going.
 *
 * John, 2026-09-25: "If the user clicks away, and views this page, should be
 * RESUME, since they have already started a game." Resume opens the grid they
 * left, where it was left (the same address My games' Continue uses); a quiet
 * link beside it still starts a new one. Read at request time, in its own
 * Suspense section with the plain Play as its fallback, so the page's shell
 * stays prerendered and a stranger's view costs no read.
 */
export async function PuzzlePlayOrResume({ kind }: { kind: PuzzleKind }) {
  const memberId = await currentMemberId();
  const run = memberId === null ? null : await latestRunOf(memberId, kind);
  if (run === null) return <PlayButton href={setUpPath(kind)} />;
  const level = run.level as PuzzleLevel;
  return (
    <>
      <PlayButton
        href={`${playPath(kind)}${puzzleQuery({ size: run.size, level, seed: run.seed, checks: run.checksAllowed, hints: run.hintsAllowed, strict: run.strict })}`}
        label="Resume →"
        testId="game-resume"
      />
      <Link href={setUpPath(kind)} className="text-center text-sm text-muted underline underline-offset-4" data-testid="game-set-up">
        Or start a new one
      </Link>
    </>
  );
}
