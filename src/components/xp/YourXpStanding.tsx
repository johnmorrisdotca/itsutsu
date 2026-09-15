import Link from "next/link";

import { LevelName } from "@/components/xp/LevelName";
import { countText } from "@/lib/rating/figures";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";
import type { RecordScope } from "@/lib/rating/recordScope";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { xpRankOf, type XpBoardPage } from "@/lib/xp/xpBoard";
import { xpLevelFor } from "@/lib/xp/xpCurve";
import { xpTotalIn } from "@/lib/xp/xpScope";
import type { ViewerXp } from "@/lib/xp/xpViewer";

/**
 * Where the reader stands, above the XP leaderboard on /xp.
 *
 * "Show The Data, Not The Way To It": the fact a member came for is their own
 * place, so it is on the page. Their row is marked in the table as well, and
 * when it is on this page that marking is the whole answer — so the RANK, which
 * costs a `count`, is only asked for when they are not among the rows on screen.
 * See `xpRankOf`. Their total is the one the board is counting.
 */
export async function YourXpStanding({
  viewer,
  board,
  who,
  scope,
}: {
  viewer: ViewerXp | null;
  board: XpBoardPage;
  who: DirectoryWho;
  scope: RecordScope;
}) {
  if (viewer === null) return null;

  /* A reader is a person, and a board narrowed to the computer players is not
     one they can be on: said, rather than a rank counted among programs. */
  if (who === DIRECTORY_WHO.computers) {
    return (
      <p className="text-sm" data-testid="your-xp">
        This board is narrowed to the computer players, so you are not among them.
      </p>
    );
  }

  const total = xpTotalIn(viewer, scope);
  const level = xpLevelFor(total);
  const shown = board.items.some((row) => row.id === viewer.memberId);

  if (total <= 0) {
    return (
      <p className="text-sm" data-testid="your-xp">
        You are on{" "}
        <Link href={levelPath(level)} className="underline underline-offset-4">
          level {level}, {xpLevelName(level)}
        </Link>{" "}
        with no experience yet, so you are not on the board.{" "}
        <Link href="/games/new" className="underline underline-offset-4">
          Finish a game
        </Link>{" "}
        and you will be.
      </p>
    );
  }

  const rank = shown ? null : await xpRankOf(total, who, scope);

  return (
    <p className="text-sm" data-testid="your-xp" data-rank={rank ?? undefined}>
      You have {countText(total)} XP and stand at <LevelName level={level} linkable={false} />
      {", "}
      <Link href={levelPath(level)} className="underline underline-offset-4">
        {xpLevelName(level)}
      </Link>
      {rank === null ? (
        <span className="text-muted"> — your row is marked below.</span>
      ) : (
        /* Ties share a number: two members on one total are level with each
           other, and separating them by `id` would be an order nobody can see. */
        <span className="text-muted">
          {" "}
          — {countText(rank)} of {countText(board.total)} {who === DIRECTORY_WHO.people ? "among the people" : "on the board"}.
        </span>
      )}
    </p>
  );
}
