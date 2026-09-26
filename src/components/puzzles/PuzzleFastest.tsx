import { connection } from "next/server";
import Link from "@/components/ui/Link";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { mySolvePath, setUpPath, solvePath, standingsPath } from "@/lib/gomoku/slugs";
import { PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { type FastestBoard, fastestSolvesOf, memberNamesOf } from "@/lib/puzzles/server/puzzleSolves";
import { PUZZLE_RECORD_SORTS, puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";

import { sizeWord } from "./puzzles.constants";
import { OneSolvePoints } from "./SolvePoints";
import { SolveTime } from "./SolveTime";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hadHeadStart } from "@/lib/puzzles/gomoji/headStart";

/**
 * The fastest solves of a puzzle, on its front door: the puzzle's ladder.
 *
 * Request time, in a component of its own with `connection()`, like the
 * game ladder — the page around it is prerendered. A stranger is shown the
 * shut state rather than a table with the names left out, as the ladder
 * does: reading about a puzzle is open, who is fastest at it is the playing
 * half of the site. An empty board is data — it shows its shape and says
 * nobody has solved this size yet, with the way in.
 */
export async function PuzzleFastest({ kind, title, whole = false }: { kind: PuzzleKind; title: string; whole?: boolean }) {
  await connection();
  const session = await currentSession();
  const heading = (
    <h2 className={SECTION_TITLE}>
      Fastest solves <span className="font-mincho normal-case tracking-normal">最速</span>
    </h2>
  );
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-fastest">
        {heading}
        <p className="text-sm text-muted" data-testid="puzzle-fastest-shut">
          Reading about {title} is open to anybody. Who is fastest at it is the playing half of this site, and that
          needs an invite.
        </p>
        <p className="text-sm">
          <Link href="/join" className="font-semibold underline-offset-2 hover:underline">
            I have an invite →
          </Link>{" "}
          <Link href={ASK_FOR_INVITE_PATH} className="text-muted underline-offset-2 hover:underline">
            No invite? Ask for one
          </Link>
        </p>
      </section>
    );
  }
  const [board, me] = await Promise.all([fastestSolvesOf(kind), currentMemberId()]);
  const names = await memberNamesOf([...board.values()].flatMap((row) => row.fastest.map((solve) => solve.memberId)));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-fastest">
      {heading}
      <FastestTable kind={kind} board={board} names={names} whole={whole} me={me} />
      {whole ? null : (
        <p className="text-sm">
          <Link href={standingsPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="puzzle-fastest-all">
            Every size and level →
          </Link>
        </p>
      )}
    </section>
  );
}

/**
 * THE TABLE: a group per size and level, its fastest solves ranked under it
 * in columns — rank, player, time, the guesses a word took, the points, and
 * the way into the replay. John, 2026-09-26, on Gomoji's standings: "put the
 * times in a column perhaps. and guesses in another column. more tabular.
 * Also the points they got for that game would be good. Also, I can't view
 * the games that were played!" Every puzzle's table is this one, so they all
 * read alike; the guesses column is drawn only for a word.
 *
 * NOTHING ON IT IS A DEAD END (John, the same day: "No way to view played
 * games"). A time opens that solve (`SolveTime`), and so do its points and its
 * Replay; a name opens the player; and a size and level opens every solve at
 * it, fastest first, in the puzzle's record — the whole of the list these
 * three are the head of. An empty size keeps its row, with the way in.
 */
export function FastestTable({
  kind,
  board,
  names,
  whole,
  me,
}: {
  kind: PuzzleKind;
  board: FastestBoard;
  names: Map<string, string>;
  whole: boolean;
  me: string | null;
}) {
  const spec = PUZZLE_SPECS[kind];
  const words = spec.helps === false;
  const columns = words ? 6 : 5;
  const all = spec.sizes.flatMap((size) => spec.levels.map((level) => ({ size, level, key: `${size}:${level}`, at: board.get(`${size}:${level}`) })));
  // A size the set-up no longer offers keeps its row while somebody holds a time at it, and is not offered as empty.
  const rows = all.filter((row) => spec.offered.includes(row.size) || row.at !== undefined);
  const shown = whole ? rows : rows.filter((row) => row.at !== undefined).slice(0, 4);
  if (shown.length === 0) {
    return (
      <p className="text-sm text-muted" data-testid="puzzle-fastest-nobody">
        Nobody has solved this here yet.{" "}
        <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
          Be the first →
        </Link>
      </p>
    );
  }
  /*
   * FITS THE COLUMN IT IS IN, not the screen. On a desktop the front door puts
   * this in a side column under 300px wide, where six columns overran it: names
   * broke over two lines and Replay fell off the edge (John, 2026-09-26, "renders
   * badly in Desktop"). So the table asks its own width (`@container`): narrow, it
   * drops Replay — the time and the points already open the same solve — and
   * tightens its spacing; wide, as on the standings page, it has all six.
   */
  const cell = "py-1 pr-2 @sm:pr-3";
  const replay = "hidden @sm:table-cell";
  return (
    <div className={`${TABLE_SCROLL} @container`}>
      <table className="w-full text-sm" data-testid="puzzle-fastest-table" data-words={words ? "true" : "false"}>
        <thead className="text-[0.62rem] font-semibold tracking-normal text-muted uppercase @sm:tracking-[0.12em]">
          <tr>
            <th className={`${cell} w-6 text-right`}>#</th>
            <th className={`${cell} w-full text-left`}>Player</th>
            <th className={`${cell} text-right`}>Time</th>
            {words ? <th className={`${cell} text-right`}>Guesses</th> : null}
            <th className={`${cell} text-right`}>Points</th>
            <th className={`${replay} py-1 text-right`}>
              <span className="sr-only">Replay</span>
            </th>
          </tr>
        </thead>
        {shown.map((row) => {
          const label = (
            <>
              {sizeWord(row.size, kind)} <span className="text-muted">{PUZZLE_LEVEL_DISPLAY[row.level].label.toLowerCase()}</span>
            </>
          );
          return (
            <tbody key={row.key} data-testid="puzzle-fastest-row" data-size={row.size} data-level={row.level}>
              <tr className="border-t border-rule-strong">
                <th colSpan={columns} scope="rowgroup" className="pt-2 pb-1 text-left text-xs font-semibold">
                  {row.at === undefined ? (
                    label
                  ) : (
                    <Link
                      href={puzzleRecordHref(kind, { size: row.size, level: row.level, sort: PUZZLE_RECORD_SORTS.fastest })}
                      className="underline-offset-2 hover:underline"
                      title="Every solve at this size and level, fastest first"
                      data-testid="puzzle-fastest-every"
                    >
                      {label} <span className="font-normal text-muted">· every solve →</span>
                    </Link>
                  )}
                </th>
              </tr>
              {row.at === undefined || row.at.fastest.length === 0 ? (
                <tr className="border-t border-rule">
                  <td colSpan={columns} className="py-1 text-muted">
                    <Link href={setUpPath(kind)} className="underline-offset-2 hover:underline">
                      nobody yet — be the first
                    </Link>
                  </td>
                </tr>
              ) : (
                row.at.fastest.map((solve, index) => {
                  const mine = solve.memberId === me;
                  const help = [
                    solve.hintsUsed !== null && solve.hintsUsed > 0 ? (hadHeadStart(kind, row.level, solve.hintsUsed) ? "head start" : "hints") : null,
                    solve.checksAllowed !== null ? (solve.checksAllowed === 1 ? "1 check" : `${solve.checksAllowed} checks`) : null,
                  ].filter((part) => part !== null);
                  return (
                    <tr key={solve.id} className="border-t border-rule align-baseline" data-testid="puzzle-fastest-rank" data-solve={solve.id} data-member={solve.memberId}>
                      <td className={`${cell} text-right text-muted tabular-nums`}>{index + 1}</td>
                      <td className={`${cell} whitespace-nowrap`}>
                        <PlayerName name={names.get(solve.memberId) ?? ""} memberId={solve.memberId} fallback="A member" />
                        {help.length === 0 ? null : (
                          <span className="block text-xs text-muted" data-testid="puzzle-fastest-help">
                            {help.join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className={`${cell} text-right whitespace-nowrap`}>
                        <SolveTime kind={kind} solveId={solve.id} elapsedMs={solve.elapsedMs} mine={mine} testId="puzzle-fastest-time" />
                      </td>
                      {/* A word's time says half of how it went; the guesses it needed say the rest (John: "like 3/6 guesses"). */}
                      {words ? (
                        <td className={`${cell} text-right text-muted tabular-nums whitespace-nowrap`} data-testid="puzzle-fastest-guesses">
                          {solve.guesses === null ? "–" : guessesText(solve.guesses)}
                        </td>
                      ) : null}
                      <td className={`${cell} text-right whitespace-nowrap`}>
                        <OneSolvePoints kind={kind} solveId={solve.id} points={solve.points} mine={mine} testId="puzzle-fastest-points" />
                      </td>
                      <td className={`${replay} py-1 text-right whitespace-nowrap`}>
                        <Link
                          href={mine ? mySolvePath(kind, solve.id) : solvePath(kind, solve.id)}
                          className="text-xs underline-offset-2 hover:underline"
                          title="Watch this solve again, step by step"
                          data-testid="puzzle-fastest-replay"
                        >
                          Replay ▸
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
