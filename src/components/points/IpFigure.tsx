import Link from "@/components/ui/Link";

import { thousands } from "@/components/about/XpCurve";
import { gamesHref } from "@/components/games/GameCount";
import type { IpScope } from "@/lib/points/ipBoards";
import { puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";

/**
 * Where an IP figure's games are, or null where no one page lists them.
 *
 * One game's board sums the games of it that paid the member IP, so it leads to
 * that game's record narrowed to exactly those (`ip=paid`), and to the month
 * when the board was this month's. One puzzle's board sums the member's best
 * solve of each grid, so it leads to that puzzle's record narrowed to them,
 * where the same sum is printed with its rows marked.
 *
 * A family's board and the site's add games of several kinds and puzzles
 * together, and the record lists one game or one puzzle at a time: no page
 * shows that set, and a link to a part of it would open a smaller list than
 * the number — the fault this rule exists to stop, wearing a link.
 */
export function ipHref(scope: IpScope, memberId: string, month: string | null): string | null {
  const [variant] = scope.variants;
  const [puzzle] = scope.puzzles;
  if (scope.variants.length === 1 && scope.puzzles.length === 0 && variant !== undefined) {
    return gamesHref({ variant, memberId, ip: "paid", month });
  }
  if (scope.puzzles.length === 1 && scope.variants.length === 0 && puzzle !== undefined) {
    return puzzleRecordHref(puzzle, { member: memberId, month });
  }
  return null;
}

/**
 * AN IP FIGURE, LEADING TO THE GAMES IT WAS WON IN — the rule `GameCount`
 * keeps for a count of games, kept for a sum of points. Where the figure's
 * scope has no one page (`ipHref` says why), it is printed plain and says so
 * on hover: a decision made here, never a link quietly left off.
 */
export function IpFigure({
  scope,
  memberId,
  ip,
  month = null,
  suffix = "",
  className = "",
  testId = "ip-figure",
}: {
  scope: IpScope;
  memberId: string;
  ip: number;
  /** "2026-09" when the figure is one month's. */
  month?: string | null;
  /** A unit after the number, " IP". */
  suffix?: string;
  className?: string;
  testId?: string;
}) {
  const href = ipHref(scope, memberId, month);
  const text = `${thousands(ip)}${suffix}`;
  if (href === null || ip === 0) {
    return (
      <span
        className={className}
        title={ip === 0 ? undefined : "Won across several games and puzzles: each game's own board leads to its games"}
        data-testid={testId}
      >
        {text}
      </span>
    );
  }
  return (
    <Link href={href} className={`underline-offset-2 hover:underline ${className}`} title="The games this IP was won in" data-testid={testId}>
      {text}
    </Link>
  );
}
