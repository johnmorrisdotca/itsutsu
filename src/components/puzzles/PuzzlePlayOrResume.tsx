import { PlayButton } from "@/components/games/PlayButton";
import { GameInProgressOffer } from "@/components/play/GameInProgressOffer";
import { currentMemberId } from "@/lib/auth/currentSession";
import { joinQuery, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { keptRunAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { latestRunOf } from "@/lib/puzzles/server/puzzleRuns";

/**
 * THE BIG BUTTON UNDER A PUZZLE'S PICTURE: Play, or Continue where the reader
 * already has one going, with a New game under it that says the one in
 * progress stays where it is (`GameInProgressOffer`, the same for every game).
 *
 * John, 2026-09-25: "If the user clicks away, and views this page, should be
 * RESUME, since they have already started a game." It opens the grid they
 * left, where it was left (the same address My games' Continue uses), and
 * reads Continue: Resume is the word for un-pausing a clock. New game starts
 * another and leaves that one in My games. Read at request time, in its own
 * Suspense section with the plain Play as its fallback, so the page's shell
 * stays prerendered and a stranger's view costs no read.
 */
export async function PuzzlePlayOrResume({ kind }: { kind: PuzzleKind }) {
  const memberId = await currentMemberId();
  const run = memberId === null ? null : await latestRunOf(memberId, kind);
  if (run === null) return <PlayButton href={setUpPath(kind)} />;
  return (
    <GameInProgressOffer
      href={joinQuery(playPath(kind), puzzleQuery(keptRunAsked(kind, run)))}
      going
      newGame={{ keeps: setUpPath(kind) }}
      testId="puzzle-offer"
      mainTestId="game-resume"
    />
  );
}
