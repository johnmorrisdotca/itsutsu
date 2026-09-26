import { connection } from "next/server";
import Link from "@/components/ui/Link";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { type FastestBoard, fastestSolvesOf, memberNamesOf } from "@/lib/puzzles/server/puzzleSolves";

import { sizeWord } from "./puzzles.constants";
import { clockText } from "@/lib/puzzles/clockText";
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
  const board = await fastestSolvesOf(kind);
  const names = await memberNamesOf([...board.values()].flatMap((row) => row.fastest.map((solve) => solve.memberId)));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-fastest">
      {heading}
      <FastestTable kind={kind} board={board} names={names} whole={whole} />
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

/** The table: a row per size and level with any solves, the fastest names beside it — or the empty shape with the way in. */
export function FastestTable({ kind, board, names, whole }: { kind: PuzzleKind; board: FastestBoard; names: Map<string, string>; whole: boolean }) {
  const spec = PUZZLE_SPECS[kind];
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
  return (
    <div className={TABLE_SCROLL}>
    <table className="w-full text-sm" data-testid="puzzle-fastest-table">
      <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
        <tr>
          <th className="py-1 pr-2 text-left">Puzzle</th>
          <th className="py-1 text-left">Fastest</th>
        </tr>
      </thead>
      <tbody>
        {shown.map((row) => (
          <tr key={row.key} className="border-t border-rule" data-testid="puzzle-fastest-row" data-size={row.size} data-level={row.level}>
            <td className="py-1 pr-2 whitespace-nowrap">
              {sizeWord(row.size, kind)} <span className="text-muted">{PUZZLE_LEVEL_DISPLAY[row.level].label.toLowerCase()}</span>
            </td>
            <td className="py-1">
              {row.at === undefined || row.at.fastest.length === 0 ? (
                <Link href={`${setUpPath(kind)}`} className="text-muted underline-offset-2 hover:underline">
                  nobody yet — be the first
                </Link>
              ) : (
                <span className="flex flex-col gap-0.5">
                  {row.at.fastest.map((solve, index) => (
                    <span key={`${solve.memberId}-${index}`} className="flex items-baseline gap-2">
                      <span className="font-mono tabular-nums">{clockText(solve.elapsedMs)}</span>
                      {/* A word's time says half of how it went; the guesses it needed say the rest (John: "like 3/6 guesses"). */}
                      {solve.guesses === null ? null : (
                        <span className="text-xs text-muted tabular-nums" data-testid="puzzle-fastest-guesses">
                          {guessesText(solve.guesses)} guesses
                        </span>
                      )}
                      <PlayerName name={names.get(solve.memberId) ?? ""} memberId={solve.memberId} fallback="A member" />
                      {solve.hintsUsed !== null && solve.hintsUsed > 0 ? (
                        <span className="text-xs text-muted" data-testid="puzzle-fastest-hints">
                          {hadHeadStart(kind, row.level, solve.hintsUsed) ? "with a head start" : "with hints"}
                        </span>
                      ) : null}
                      {solve.checksAllowed !== null ? (
                        <span className="text-xs text-muted" data-testid="puzzle-fastest-checks">
                          {solve.checksAllowed === 1 ? "1 check" : `${solve.checksAllowed} checks`}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
