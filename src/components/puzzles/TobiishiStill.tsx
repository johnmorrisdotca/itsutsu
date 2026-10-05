import { jumpAt } from "@johnmorrisdotca/tobiishi";
import { draw } from "@johnmorrisdotca/tobiishi/draw";

import { tobiishiChallengeOf, tobiishiPackOf, tobiishiRefOfCode } from "@/lib/puzzles/tobiishi/levels";
import { replayJumps } from "@/lib/puzzles/tobiishi/way";

import { PuzzleBoard } from "./PuzzleBoard";
import { PACKAGE_TRAY_OFF } from "./tobiishi.constants";

/** The side the frame is laid out for: a peg board has no rows to letter, so only its rim depends on it (`TobiishiBoard`). */
const FRAME_SIDE = 9;

/**
 * A TOBIISHI LEVEL DRAWN AND NOT PLAYED: its pegs and its goal as dealt, or, if a run is given
 * (`way`, as the site keeps one: `way.ts`), as that run leaves them, or, `solved` with none given,
 * as the package's own answer leaves them: one peg, in the goal. The set-up's preview of a level, a
 * level looked at once it is solved and a finished puzzle's page all draw it, on the same paper in the
 * same wood as the board that is played (`PuzzleBoard`).
 *
 * The drawing is the package's (`draw`, pure SVG text), so it is made here on a server and in a browser
 * alike and the page never waits for it. A board that is not square (the wide one, the tall one) is
 * fitted inside the square paper and never cropped.
 */
export function TobiishiStill({
  code,
  way = null,
  solved = false,
  testId = "tobiishi-still",
}: {
  /** The level, as its code (`english:centre:3`). */
  code: string;
  /** A run played on it, as the site keeps one. */
  way?: string | null;
  /** The level is solved: with no run given, the package's own answer is played. */
  solved?: boolean;
  testId?: string;
}) {
  const ref = tobiishiRefOfCode(code);
  if (ref === null) return null;
  const challenge = tobiishiChallengeOf(ref);
  let game = challenge.game;
  if (way !== null && way !== "") game = replayJumps(game, way) ?? game;
  else if (solved) for (const step of challenge.answer) game = jumpAt(game, step.from, step.to);
  const svg = draw(game, { material: "stone", title: `${tobiishiPackOf(ref.pack).title.en} board` });
  return (
    <div className="w-full select-none" data-testid={testId} data-kind="tobiishi" data-code={code} data-pegs={game.pegs.filter(Boolean).length} data-wallpaper-focus>
      <PuzzleBoard size={FRAME_SIDE} coordinates={false}>
        <div className={`surface-light flex h-full w-full items-center justify-center bg-white [&_svg]:h-full [&_svg]:w-full ${PACKAGE_TRAY_OFF}`} dangerouslySetInnerHTML={{ __html: svg }} />
      </PuzzleBoard>
    </div>
  );
}
