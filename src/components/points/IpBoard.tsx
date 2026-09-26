import { connection } from "next/server";
import Link from "next/link";

import { thousands } from "@/components/about/XpCurve";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { IP_SHOWN, IP_WHOLE } from "@/lib/points/points.constants";
import { type IpRow, type IpScope, ipBoardOf } from "@/lib/points/ipBoards";
import { startOfMonth } from "@/lib/puzzles/server/puzzleBoards";
import { memberNamesOf } from "@/lib/puzzles/server/puzzleSolves";
import { currentTestModeReader } from "@/lib/testMode/testMode";
import { xpByMemberId } from "@/lib/xp/xpOfMembers";

/**
 * AN IP LEADERBOARD: who has won the most Itsutsu Points here, this month and
 * all time. John, 2026-09-25: "EVERY game in every family is also going to have
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
  /** One table under the other, for a side column; side by side otherwise. */
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
  const session = await currentSession();
  const heading = (
    <h2 className={SECTION_TITLE}>
      IP leaderboard <span className="font-mincho normal-case tracking-normal">点数番付</span>
    </h2>
  );
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={testId}>
        {heading}
        <p className="text-sm text-muted" data-testid={`${testId}-shut`}>
          Who has won the most at {title} is the playing half of this site, and that needs an invite.
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
  const take = whole ? IP_WHOLE : IP_SHOWN;
  const reader = await currentTestModeReader();
  const [thisMonth, allTime] = await Promise.all([ipBoardOf(scope, startOfMonth(), take, reader), ipBoardOf(scope, null, take, reader)]);
  const ids = [...thisMonth, ...allTime].map((row) => row.memberId);
  const [names, xp] = await Promise.all([memberNamesOf(ids), xpByMemberId(ids)]);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid={testId}>
      {heading}
      <div className={`grid gap-4 ${stacked ? "" : "md:grid-cols-2"}`}>
        <IpTable label="This month" kanji="今月" rows={thisMonth} names={names} xp={xp} playHref={playHref} testId={`${testId}-month`} />
        <IpTable label="All time" kanji="通算" rows={allTime} names={names} xp={xp} playHref={playHref} testId={`${testId}-all`} />
      </div>
      <p className="text-xs text-muted">
        IP, Itsutsu Points, is won by results alone: a win pays the most the game is worth, a draw half, and a close loss
        a little; beating a stronger player pays more. XP is for taking part.{" "}
        {whole ? null : (
          <Link href="/points" className="font-semibold text-ink underline-offset-2 hover:underline" data-testid={`${testId}-site`}>
            Every game together, and how each is priced →
          </Link>
        )}
      </p>
    </section>
  );
}

function IpTable({
  label,
  kanji,
  rows,
  names,
  xp,
  playHref,
  testId,
}: {
  label: string;
  kanji: string;
  rows: readonly IpRow[];
  names: Map<string, string>;
  xp: Map<string, number | null>;
  playHref: string;
  testId: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1" data-testid={testId}>
      <h3 className="text-sm font-semibold">
        {label} <span className="font-mincho text-xs font-normal text-muted">{kanji}</span>
      </h3>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm">
          <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
            <tr>
              <th className="w-8 py-1 text-left">#</th>
              <th className="py-1 text-left">Player</th>
              <th className="py-1 text-right">IP</th>
              <th className="py-1 pl-3 text-right" title="Experience 経験 — what this member has earned on Itsutsu">
                XP
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              /* An empty board is data: its shape, and the way in. */
              <tr className="border-t border-rule">
                <td colSpan={4} className="py-2 text-sm text-muted" data-testid={`${testId}-empty`}>
                  Nobody on it yet.{" "}
                  <Link href={playHref} className="font-semibold text-ink underline-offset-2 hover:underline">
                    Be the first →
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
                      <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback="A member" />
                    </td>
                    <td className="py-1 text-right font-mono font-semibold tabular-nums">{thousands(row.ip)}</td>
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
