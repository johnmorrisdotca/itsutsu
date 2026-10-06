import Link from "@/components/ui/Link";

import { LevelName } from "@/components/xp/LevelName";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";
import { countText } from "@/lib/rating/figures";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";
import type { RecordScope } from "@/lib/rating/recordScope";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { xpRankOf, type XpBoardPage } from "@/lib/xp/xpBoard";
import { xpLevelFor } from "@/lib/xp/xpCurve";
import { xpTotalIn } from "@/lib/xp/xpScope";
import type { ViewerXp } from "@/lib/xp/xpViewer";
import type { TestModeReader } from "@/lib/testMode/testMode";

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
  reader,
}: {
  viewer: ViewerXp | null;
  board: XpBoardPage;
  who: DirectoryWho;
  scope: RecordScope;
  reader: TestModeReader;
}) {
  if (viewer === null) return null;
  const say = await currentSpeaker();

  /* A reader is a person, and a board narrowed to the computer players is not
     one they can be on: said, rather than a rank counted among programs. */
  if (who === DIRECTORY_WHO.computers) {
    return (
      <p className="text-sm" data-testid="your-xp">
        {say.say("xp.standing.computers")}
      </p>
    );
  }

  const total = xpTotalIn(viewer, scope);
  const level = xpLevelFor(total);
  const shown = board.items.some((row) => row.id === viewer.memberId);

  if (total <= 0) {
    return (
      <p className="text-sm" data-testid="your-xp">
        {weave(say.say("xp.standing.none"), {
          level: (
            <Link href={levelPath(level)} className="underline underline-offset-4">
              {say.say("xp.standing.levelName", { level: String(level), name: xpLevelName(level, say.locale) })}
            </Link>
          ),
          finish: (
            <Link href="/games/new" className="underline underline-offset-4">
              {say.say("xp.standing.finish")}
            </Link>
          ),
        })}
      </p>
    );
  }

  const rank = shown ? null : await xpRankOf(total, who, scope, reader);

  return (
    <p className="text-sm" data-testid="your-xp" data-rank={rank ?? undefined}>
      {weave(say.say("xp.standing.have"), {
        total: countText(total, say.locale),
        badge: <LevelName level={level} linkable={false} />,
        name: (
          <Link href={levelPath(level)} className="underline underline-offset-4">
            {xpLevelName(level, say.locale)}
          </Link>
        ),
      })}
      {rank === null ? (
        <span className="text-muted"> {say.say("xp.standing.marked")}</span>
      ) : (
        /* Ties share a number: two members on one total are level with each
           other, and separating them by `id` would be an order nobody can see. */
        <span className="text-muted">
          {" "}
          {say.say(who === DIRECTORY_WHO.people ? "xp.standing.rankPeople" : "xp.standing.rankBoard", {
            rank: countText(rank, say.locale),
            total: countText(board.total, say.locale),
          })}
        </span>
      )}
    </p>
  );
}
