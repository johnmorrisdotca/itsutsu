import Link from "@/components/ui/Link";

import { gamesHref } from "@/components/games/GameCount";
import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { PlayerName } from "@/components/players/PlayerName";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";
import { RowActions } from "@/components/ui/Controls";
import { RAISED_LINK } from "@/components/ui/ui.constants";
import { fetchBuddies } from "@/lib/social/buddies";
import { gamesWithEach } from "@/lib/social/buddyGames";

/**
 * THE PEOPLE YOU PLAY, ON A PAGE OF THEIR OWN.
 *
 * John, 2026-09-21: "We need Buddy LIst page." There was a buddy list, folded
 * into a tab of the account screen beside the ignore roll and the invitations
 * — three things that answer three different questions, and only one of them
 * is "who do I play". It sits here now, where every other list of people on
 * this site lives, and the account screen points at it rather than drawing a
 * second copy that would drift.
 *
 * TWO CLICKS TO A BOARD, which is the rule this page was built under — John,
 * the same day: "no game or process should take 3 screens/clicks." Press the
 * offer beside a name and the set-up screen arrives already against them;
 * press Begin and you are playing. Nothing between.
 *
 * AND IT SAYS WHAT IS ALREADY GOING. A buddy list that only offered NEW games
 * would be the one list on the site that hides what you have with somebody —
 * so each row carries the games running between the two of you and how many
 * are waiting on you, both from one read for the whole list (`gamesWithEach`),
 * and both linking to those games rather than printing a number and stopping.
 */
export async function BuddyList({ memberId }: { memberId: string }) {
  const [buddies, games] = await Promise.all([fetchBuddies(memberId), gamesWithEach(memberId)]);
  // The flag, badge and level beside each name, as on the members list, in one read for the page.
  const tags = await nameTagsOf(buddies.map((buddy) => buddy.id));

  if (buddies.length === 0) {
    /*
     * AN EMPTY LIST IS A LIST, and it shows the way in rather than an apology
     * — the rule /backlog and every empty ladder here keep. There is nothing
     * to draw as a table, so what stands in its place is the one thing to do
     * about it.
     */
    return (
      <div className="flex flex-col gap-3" data-testid="buddy-list">
        <p className="text-sm text-muted">
          Nobody yet. A buddy is somebody you want to find again: star them on the{" "}
          <Link href="/players" className="underline underline-offset-4">
            members list
          </Link>{" "}
          or on their own page, and they are listed here, most recently seen first — with the games
          you have going and a game to offer beside each name.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="buddy-list">
      <p className="text-sm text-muted">
        The people you play, most recently seen first. {buddies.length}{" "}
        {buddies.length === 1 ? "person" : "people"}.
      </p>
      {/*
        The table's size and the table's name: John, 2026-09-26, "Buddies has
        totally different name formatting. Larger font and no flags etc..."
      */}
      <ul className="flex flex-col text-sm">
        {buddies.map((buddy) => {
          const with_ = games.get(buddy.id) ?? { going: 0, yours: 0 };
          return (
            <li
              key={buddy.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule py-2 first:border-t-0"
              data-testid="buddy-row"
              data-member={buddy.id}
            >
              <RecencyMark recency={buddy.recency} />
              <span>
                <PlayerName name={buddy.name} memberId={buddy.id} fallback={buddy.name} tag={tags.get(buddy.id) ?? { country: buddy.country, kind: MEMBER_KINDS.member, level: null }} />
              </span>
              <span className="text-xs text-muted">
                {buddy.city}
                {buddy.localTime !== null ? `${buddy.city ? " · " : ""}${buddy.localTime} there` : ""}
              </span>
              {/*
                A NUMBER ABOUT GAMES LEADS TO EXACTLY THOSE GAMES. The figure
                counts the games running between the two of you (`gamesBetween`),
                and `/play?with=<them>` lists the same set from the same `where`
                — so the promise is kept by construction. It said the figure
                plainly with no link until that page existed; a link to all of
                /play would have shown a longer list than the number.
              */}
              <span className="text-xs text-muted" data-testid="buddy-going">
                {with_.going === 0 ? (
                  "no games going"
                ) : (
                  <Link
                    href={`/play?with=${encodeURIComponent(buddy.id)}`}
                    className={`${RAISED_LINK} underline underline-offset-4`}
                    data-testid="buddy-going-link"
                  >
                    {with_.going} going{with_.yours > 0 ? `, ${with_.yours} on you` : ""}
                  </Link>
                )}
              </span>
              {/* And every game the two of you have FINISHED, in the record narrowed to the pair: the past half of "what you have with somebody". */}
              <Link
                href={gamesHref({ memberId, against: buddy.id })}
                className={`${RAISED_LINK} text-xs text-muted underline underline-offset-4`}
                data-testid="buddy-played"
              >
                games together
              </Link>
              <span className="ml-auto">
                <RowActions>
                  {/* One press to the set-up screen against them; one more begins it. */}
                  <ChallengeButton memberId={buddy.id} strong />
                  <BuddyButton memberId={buddy.id} isBuddy />
                </RowActions>
              </span>
            </li>
          );
        })}
      </ul>
      <RecencyLegend />
    </div>
  );
}
