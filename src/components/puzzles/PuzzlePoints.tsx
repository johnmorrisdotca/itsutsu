import { connection } from "next/server";
import Link from "@/components/ui/Link";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { ALL_TIME, monthOf, weekOf, type RecordPeriod } from "@/lib/history/recordMonth";
import { setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { isPencilKind } from "@/lib/puzzles/pencil/pencil.constants";
import { POINTS_A_CELL, POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";
import { TOBIISHI_SIZES } from "@/lib/puzzles/tobiishi/sizes";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { POINTS_SHOWN, POINTS_WHOLE, type PointsRow, pointsBoardOf, startOfMonth, startOfWeek } from "@/lib/puzzles/server/puzzleBoards";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import type { NameTag } from "@/lib/xp/nameTag.types";
import { currentTestModeReader } from "@/lib/testMode/testMode";

import { SolvePoints } from "./SolvePoints";

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
  const say = await currentSpeaker();
  const take = whole ? POINTS_WHOLE : POINTS_SHOWN;
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-points">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("pset.points.heading")} kanji="番付" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
        </h2>
        <p className="text-sm text-muted" data-testid="puzzle-points-shut">
          {say.say("pset.points.shut", { title })}
        </p>
        <p className="text-sm">
          <Link href="/join" className="font-semibold underline-offset-2 hover:underline">
            {say.say("points.board.haveInvite")}
          </Link>{" "}
          <Link href={ASK_FOR_INVITE_PATH} className="text-muted underline-offset-2 hover:underline">
            {say.say("points.board.noInvite")}
          </Link>
        </p>
      </section>
    );
  }
  // All time, this month and this week, one query a table (`pointsBoardOf`), side by side on the whole board's page.
  const reader = await currentTestModeReader();
  const [allTime, thisMonth, thisWeek] = await Promise.all([
    pointsBoardOf(kind, null, take, reader),
    pointsBoardOf(kind, startOfMonth(), take, reader),
    pointsBoardOf(kind, startOfWeek(), take, reader),
  ]);
  const { names, tags } = await namesAndTagsOf([...allTime, ...thisMonth, ...thisWeek].map((row) => row.memberId));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-points">
      <h2 className={SECTION_TITLE}>
        <Paired en={say.say("pset.points.heading")} kanji="番付" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
      </h2>
      {/* Three columns where the board has the page's width (its standings page), one under another beside a puzzle and on a phone. */}
      <div className={`grid gap-4 ${whole ? "md:grid-cols-3" : ""}`}>
        <PointsTable label={say.say("points.board.allTime")} kanji="通算" say={say} rows={allTime} names={names} tags={tags} kind={kind} period={ALL_TIME} testId="puzzle-points-all" />
        <PointsTable label={say.say("points.board.thisMonth")} kanji="今月" say={say} rows={thisMonth} names={names} tags={tags} kind={kind} period={{ month: monthOf(startOfMonth()), week: null }} testId="puzzle-points-month" />
        <PointsTable label={say.say("points.board.thisWeek")} kanji="今週" say={say} rows={thisWeek} names={names} tags={tags} kind={kind} period={{ month: null, week: weekOf(startOfWeek()) }} testId="puzzle-points-week" />
      </div>
      <p className="text-xs text-muted">
        {pointsNote(kind, say)}
      </p>
      {whole ? null : (
        <p className="text-sm">
          <Link href={standingsPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="puzzle-points-whole">
            {say.say("pset.points.whole")}
          </Link>
        </p>
      )}
    </section>
  );
}

function PointsTable({
  label,
  kanji,
  say,
  rows,
  names,
  tags,
  kind,
  period,
  testId,
}: {
  label: string;
  kanji: string;
  say: Speaker;
  rows: readonly PointsRow[];
  names: Map<string, string>;
  /** The flag, badge and level beside each name, read with the names. */
  tags: ReadonlyMap<string, NameTag>;
  kind: PuzzleKind;
  /** The span this table counted — this month, this week, or all time — which is the span each figure leads to. */
  period: RecordPeriod;
  testId: string;
}) {
  return (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <h3 className="text-sm font-semibold">
        <Paired en={label} kanji={kanji} kanjiClassName="text-xs font-normal text-muted" inReadersLanguage />
      </h3>
      {rows.length === 0 ? (
        /* An empty board is data: its shape, and the way in. */
        <p className="text-sm text-muted" data-testid={`${testId}-empty`}>
          {say.say("points.board.empty")}{say.pairsWithKanji ? " " : ""}
          <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
            {say.say("points.board.beFirst")}
          </Link>
        </p>
      ) : (
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="w-8 py-1 text-left">#</th>
                <th className="py-1 text-left">{say.say("points.board.player")}</th>
                <th className="py-1 text-right">{say.say("pset.col.points")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, at) => (
                <tr key={row.memberId} className="border-t border-rule" data-testid="puzzle-points-row" data-member={row.memberId}>
                  <td className="py-1 text-muted tabular-nums">{at + 1}</td>
                  <td className="py-1">
                    <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback={say.say("points.board.aMember")} tag={tags.get(row.memberId)} />
                  </td>
                  <td className="py-1 text-right" title={say.count("puzzle.count.puzzle", row.puzzles)}>
                    {/* The sum, leading to the solves it is the sum of: that member's, in that month, that week or ever. */}
                    <SolvePoints kind={kind} memberId={row.memberId} points={row.points} month={period.month} week={period.week} testId="puzzle-points-figure" />
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

/** What a puzzle's points are made of, in a line under its boards. */
function pointsNote(kind: PuzzleKind, say: Speaker): string {
  const cell = String(POINTS_A_CELL);
  const help = String(POINTS_A_HELP);
  if (kind === "gomoji") return say.say("pset.points.gomoji", { help });
  if (kind === "solitaire" || kind === "freecell") return say.say("pset.points.cardsFull", { cell, total: String(POINTS_A_CELL * 52) });
  if (kind === "spider") return say.say("pset.points.spider", { cell, total: String(POINTS_A_CELL * 104) });
  if (kind === "mahjong") return say.say("pset.points.mahjong", { cell, help });
  if (kind === "tobiishi") return say.say("pset.points.tobiishi", { cell, sizes: TOBIISHI_SIZES.map((size) => POINTS_A_CELL * size).join(say.locale === "ja" ? "、" : ", ") });
  if (kind === "suido") return say.say("pset.points.suido", { cell, help });
  if (kind === "bridges") return say.say("pset.points.bridges", { cell, help });
  if (kind === "pictureLogic") return say.say("pset.points.pictureLogic", { cell, help });
  if (isPencilKind(kind)) return say.say("pset.points.pencil", { cell, help });
  return say.say("pset.points.default", { cell, help });
}
