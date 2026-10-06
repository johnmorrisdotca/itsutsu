import { gamesHref } from "@/components/games/GameCount";
import type { IpScope } from "@/lib/points/ipBoards";
import { puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";

/**
 * Where an IP figure's games are, or null where no one page lists them.
 *
 * One game's board sums the games of it that paid the member IP, so it leads to
 * that game's record narrowed to exactly those (`ip=paid`), and to the month
 * or the week when the board was this month's or this week's. One puzzle's board sums the member's best
 * solve of each grid, so it leads to that puzzle's record narrowed to them,
 * where the same sum is printed with its rows marked.
 *
 * A family's board and the site's add games of several kinds and puzzles
 * together, and the record lists one game or one puzzle at a time: no page
 * shows that set, and a link to a part of it would open a smaller list than
 * the number — the fault this rule exists to stop, wearing a link.
 */
export function ipHref(scope: IpScope, memberId: string, month: string | null, week: string | null = null): string | null {
  const [variant] = scope.variants;
  const [puzzle] = scope.puzzles;
  // A Houseki win is a level kept in this site's own table and in the winner's browser: no page lists those wins yet, so its figure is printed plain.
  if ((scope.houseki ?? []).length > 0) return null;
  if (scope.variants.length === 1 && scope.puzzles.length === 0 && variant !== undefined) {
    return gamesHref({ variant, memberId, ip: "paid", month, week });
  }
  if (scope.puzzles.length === 1 && scope.variants.length === 0 && puzzle !== undefined) {
    return puzzleRecordHref(puzzle, { member: memberId, month, week });
  }
  return null;
}
