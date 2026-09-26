import Link from "next/link";

import { thousands } from "@/components/about/XpCurve";
import { SITE_SCOPE, type IpStanding, ipStandingOf } from "@/lib/points/ipBoards";
import { startOfMonth } from "@/lib/puzzles/server/puzzleBoards";
import { currentTestModeReader } from "@/lib/testMode/testMode";

/**
 * A PLAYER'S IP ON THEIR PAGE, beside their level and XP: the total they have
 * won, and where it puts them on the site's board, all time and this month,
 * each place a link to that board. John, 2026-09-25: "XP is site wide
 * experience… IP aka Points is only about games. Pure ability" — so the page
 * that says how long somebody has been here also says how well they play.
 *
 * Two queries for the one page, over the same totals `/points` lists
 * (`ipStandingOf`), so the place here is the place there.
 */
export async function PlayerIp({ memberId }: { memberId: string }) {
  const reader = await currentTestModeReader();
  const [all, month] = await Promise.all([
    ipStandingOf(memberId, SITE_SCOPE, null, reader),
    ipStandingOf(memberId, SITE_SCOPE, startOfMonth(), reader),
  ]);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm" data-testid="player-ip" data-ip={all?.ip ?? 0}>
      <span className="font-mono font-semibold tabular-nums">{thousands(all?.ip ?? 0)} IP</span>
      {all === null ? (
        <Link href="/points" className="text-xs text-muted underline underline-offset-4" data-testid="player-ip-none">
          None won yet: IP is for results →
        </Link>
      ) : (
        <>
          <Place standing={all} when="all time" testId="player-ip-all" />
          <Place standing={month} when="this month" testId="player-ip-month" />
        </>
      )}
    </p>
  );
}

function Place({ standing, when, testId }: { standing: IpStanding; when: string; testId: string }) {
  if (standing === null) return null;
  return (
    <Link href="/points" className="text-xs text-muted underline underline-offset-4" data-testid={testId} data-place={standing.place}>
      #{standing.place} {when}
    </Link>
  );
}
