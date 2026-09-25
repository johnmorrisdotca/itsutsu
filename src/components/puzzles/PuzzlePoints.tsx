import { connection } from "next/server";
import Link from "next/link";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { thousands } from "@/components/about/XpCurve";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { POINTS_A_CELL, POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
import { WORD_SCORE } from "@/lib/puzzles/wordDrop/wordScore";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { POINTS_SHOWN, POINTS_WHOLE, type PointsRow, pointsBoardOf, startOfMonth } from "@/lib/puzzles/server/puzzleBoards";
import { memberNamesOf } from "@/lib/puzzles/server/puzzleSolves";

/**
 * A PUZZLE'S LEADERBOARDS, ALL TIME AND THIS MONTH, PLAIN AND FIRST.
 *
 * John, 2026-09-24, on PuzzleMadness: "I want leaderboards, which we have...
 * but these are so prominent and easy to read… Find out how they score these."
 * Their shape: two boards on every puzzle's page, ten rows of rank, player and
 * one number, and a way on to the whole board. Their score is ours too
 * (`pointsFor`): five a cell filled, less fifty a Check or Hint; a grid counts
 * once, at its best. The fastest times stay, beside these.
 *
 * Read at request time in its own `connection()`, like the fastest times, and
 * shut to a stranger: who is winning is the playing half of the site.
 */
export async function PuzzlePoints({ kind, title, whole = false }: { kind: PuzzleKind; title: string; whole?: boolean }) {
  await connection();
  const session = await currentSession();
  const take = whole ? POINTS_WHOLE : POINTS_SHOWN;
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-points">
        <h2 className={SECTION_TITLE}>
          Leaderboard <span className="font-mincho normal-case tracking-normal">番付</span>
        </h2>
        <p className="text-sm text-muted" data-testid="puzzle-points-shut">
          Reading about {title} is open to anybody. Who leads at it is the playing half of this site, and that needs an
          invite.
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
  const [allTime, thisMonth] = await Promise.all([pointsBoardOf(kind, null, take), pointsBoardOf(kind, startOfMonth(), take)]);
  const names = await memberNamesOf([...allTime, ...thisMonth].map((row) => row.memberId));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-points">
      <h2 className={SECTION_TITLE}>
        Leaderboard <span className="font-mincho normal-case tracking-normal">番付</span>
      </h2>
      <PointsTable label="All time" kanji="通算" rows={allTime} names={names} kind={kind} testId="puzzle-points-all" />
      <PointsTable label="This month" kanji="今月" rows={thisMonth} names={names} kind={kind} testId="puzzle-points-month" />
      <p className="text-xs text-muted">
        {kind === "wordDrop"
          ? `Every letter you find scores, more the sooner and more in its place; the word itself ${WORD_SCORE.found}, and more for guesses left and speed. A word not found still scores its letters. Your best of each word counts.`
          : `${POINTS_A_CELL} a cell you fill, −${POINTS_A_HELP} a Check or Hint. Your best of each puzzle counts.`}
      </p>
      {whole ? null : (
        <p className="text-sm">
          <Link href={standingsPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="puzzle-points-whole">
            The whole board →
          </Link>
        </p>
      )}
    </section>
  );
}

function PointsTable({
  label,
  kanji,
  rows,
  names,
  kind,
  testId,
}: {
  label: string;
  kanji: string;
  rows: readonly PointsRow[];
  names: Map<string, string>;
  kind: PuzzleKind;
  testId: string;
}) {
  return (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <h3 className="text-sm font-semibold">
        {label} <span className="font-mincho text-xs font-normal text-muted">{kanji}</span>
      </h3>
      {rows.length === 0 ? (
        /* An empty board is data: its shape, and the way in. */
        <p className="text-sm text-muted" data-testid={`${testId}-empty`}>
          Nobody on it yet.{" "}
          <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
            Be the first →
          </Link>
        </p>
      ) : (
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="w-8 py-1 text-left">#</th>
                <th className="py-1 text-left">Player</th>
                <th className="py-1 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, at) => (
                <tr key={row.memberId} className="border-t border-rule" data-testid="puzzle-points-row" data-member={row.memberId}>
                  <td className="py-1 text-muted tabular-nums">{at + 1}</td>
                  <td className="py-1">
                    <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback="A member" />
                  </td>
                  <td className="py-1 text-right font-mono tabular-nums" title={`${row.puzzles} ${row.puzzles === 1 ? "puzzle" : "puzzles"}`}>
                    {thousands(row.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
