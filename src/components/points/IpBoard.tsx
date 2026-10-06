import { SITE_NAME } from "@/lib/i18n/siteName";
import { connection } from "next/server";
import Link from "@/components/ui/Link";

import { thousands } from "@/lib/ui/thousands";
import { Paired } from "@/components/i18n/Paired";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { ALL_TIME, monthOf, weekOf, type RecordPeriod } from "@/lib/history/recordMonth";
import { IP_SHOWN, IP_WHOLE } from "@/lib/points/points.constants";
import { type IpRow, type IpScope, ipBoardOf } from "@/lib/points/ipBoards";
import { startOfMonth, startOfWeek } from "@/lib/puzzles/server/puzzleBoards";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import type { NameTag } from "@/lib/xp/nameTag.types";
import { currentTestModeReader } from "@/lib/testMode/testMode";
import { xpByMemberId } from "@/lib/xp/xpOfMembers";

import { IpFigure } from "./IpFigure";

/**
 * AN IP LEADERBOARD: who has won the most Itsutsu Points here, all time, this
 * month and this week — three tables side by side where the board has the
 * page's width, one under another in a side column and on a phone. John,
 * 2026-09-26: "For leaderboards, show ALL TIME and Weekly and Monthly boards…
 * Could be 3 columns in Desktop and responsive in Mobile." The week and the
 * month both start in UTC (`startOfWeek`, `startOfMonth`), so everybody reads
 * one board. John, 2026-09-25: "EVERY game in every family is also going to have
 * a Leaderboard. So IP matters." IP is results only, and XP is taking part, so
 * each row shows both: a reader sees at once that they are two different
 * things. The same board serves a game, a family and the whole site
 * (`ipBoardOf`), so they read alike.
 *
 * A stranger sees the shut state rather than names: the players need an
 * invite, even where the page about the game is open (AGENTS.md, "reading is
 * open means the GAMES, not the people").
 */
export async function IpBoard({
  scope,
  title,
  playHref,
  whole = false,
  stacked = false,
  testId = "ip-board",
}: {
  /** One table under another, for a side column; three side by side otherwise. */
  stacked?: boolean;
  scope: IpScope;
  /** What the board is of, for the heading and the shut state: "Gomoku", "Five in a row", "every game". */
  title: string;
  /** Where "be the first" leads: this game's set-up screen, or the new game screen. */
  playHref: string;
  /** The page of the board itself: more rows, and no link on to it. */
  whole?: boolean;
  testId?: string;
}) {
  await connection();
  const [session, say] = await Promise.all([currentSession(), currentSpeaker()]);
  const heading = (
    <h2 className={SECTION_TITLE}>
      <Paired en={say.say("points.board.title")} kanji="点数番付" kanjiClassName="normal-case tracking-normal" />
    </h2>
  );
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={testId}>
        {heading}
        <p className="text-sm text-muted" data-testid={`${testId}-shut`}>
          {say.say("points.board.shut", { title })}
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
  const take = whole ? IP_WHOLE : IP_SHOWN;
  const reader = await currentTestModeReader();
  // One query a table, over the same totals (`ipBoardOf`); the three run side by side.
  const [allTime, thisMonth, thisWeek] = await Promise.all([
    ipBoardOf(scope, null, take, reader),
    ipBoardOf(scope, startOfMonth(), take, reader),
    ipBoardOf(scope, startOfWeek(), take, reader),
  ]);
  const ids = [...allTime, ...thisMonth, ...thisWeek].map((row) => row.memberId);
  const [{ names, tags }, xp] = await Promise.all([namesAndTagsOf(ids), xpByMemberId(ids)]);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid={testId}>
      {heading}
      <div className={`grid gap-4 ${stacked ? "" : "md:grid-cols-3"}`}>
        <IpTable say={say} label={say.say("points.board.allTime")} kanji="通算" rows={allTime} names={names} tags={tags} xp={xp} playHref={playHref} scope={scope} period={ALL_TIME} testId={`${testId}-all`} />
        <IpTable say={say} label={say.say("points.board.thisMonth")} kanji="今月" rows={thisMonth} names={names} tags={tags} xp={xp} playHref={playHref} scope={scope} period={{ month: monthOf(startOfMonth()), week: null }} testId={`${testId}-month`} />
        <IpTable say={say} label={say.say("points.board.thisWeek")} kanji="今週" rows={thisWeek} names={names} tags={tags} xp={xp} playHref={playHref} scope={scope} period={{ month: null, week: weekOf(startOfWeek()) }} testId={`${testId}-week`} />
      </div>
      <p className="text-xs text-muted">
        {say.say("points.board.explain", { site: SITE_NAME })}{" "}
        {whole ? null : (
          <Link href="/points" className="font-semibold text-ink underline-offset-2 hover:underline" data-testid={`${testId}-site`}>
            {say.say("points.board.siteLink")}
          </Link>
        )}
      </p>
    </section>
  );
}

function IpTable({
  say,
  label,
  kanji,
  rows,
  names,
  tags,
  xp,
  playHref,
  scope,
  period,
  testId,
}: {
  say: Speaker;
  label: string;
  kanji: string;
  rows: readonly IpRow[];
  names: Map<string, string>;
  /** The flag, badge and level beside each name, read with the names. */
  tags: ReadonlyMap<string, NameTag>;
  xp: Map<string, number | null>;
  playHref: string;
  /** What the board counts, which decides where each figure leads (`IpFigure`). */
  scope: IpScope;
  /** The span this table counted — this month, this week, or all time — which is the span each figure leads to. */
  period: RecordPeriod;
  testId: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1" data-testid={testId}>
      <h3 className="text-sm font-semibold">
        <Paired en={label} kanji={kanji} kanjiClassName="text-xs font-normal text-muted" />
      </h3>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm">
          <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
            <tr>
              <th className="w-8 py-1 text-left">#</th>
              <th className="py-1 text-left">{say.say("points.board.player")}</th>
              <th className="py-1 text-right">IP</th>
              <th className="py-1 pl-3 text-right" title={say.say("points.board.xpTitle", { site: SITE_NAME })}>
                {say.say("xp.unit")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              /* An empty board is data: its shape, and the way in. */
              <tr className="border-t border-rule">
                <td colSpan={4} className="py-2 text-sm text-muted" data-testid={`${testId}-empty`}>
                  {say.say("points.board.empty")}{" "}
                  <Link href={playHref} className="font-semibold text-ink underline-offset-2 hover:underline">
                    {say.say("points.board.beFirst")}
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((row, at) => {
                const earned = xp.get(row.memberId);
                return (
                  <tr key={row.memberId} className="border-t border-rule" data-testid="ip-row" data-member={row.memberId} data-ip={row.ip}>
                    <td className="py-1 text-muted tabular-nums">{at + 1}</td>
                    <td className="py-1">
                      <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback={say.say("points.board.aMember")} tag={tags.get(row.memberId)} />
                    </td>
                    <td className="py-1 text-right font-mono font-semibold tabular-nums">
                      <IpFigure scope={scope} memberId={row.memberId} ip={row.ip} month={period.month} week={period.week} testId="ip-row-figure" />
                    </td>
                    <td className="py-1 pl-3 text-right font-mono text-muted tabular-nums">{earned === null || earned === undefined ? "–" : thousands(earned)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
