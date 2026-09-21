import Link from "next/link";

import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { CountryMark } from "@/components/players/CountryMark";
import { PlayerName } from "@/components/players/PlayerName";
import { RowActions } from "@/components/ui/Controls";
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
      <ul className="flex flex-col">
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
              <PlayerName name={buddy.name} memberId={buddy.id} fallback={buddy.name} />
              <CountryMark country={buddy.country} />
              <span className="text-xs text-muted">
                {buddy.city}
                {buddy.localTime !== null ? `${buddy.city ? " · " : ""}${buddy.localTime} there` : ""}
              </span>
              {/*
                WHAT IS ALREADY GOING — AND IT DOES NOT LINK YET, WHICH IS A
                DEBT AND NOT A DESIGN.
                
                This site's rule is that a number about games leads to exactly
                those games. There is no page that shows "my running games
                against one person": `/play` shows all of yours and `/history`
                shows finished ones, and a link to either would show a LONGER
                list than the number beside it — which AGENTS.md names as the
                same fault as no link at all, wearing a link. So it says the
                figure plainly until `/play` can be narrowed to an opponent,
                which is its own row on the board.
              */}
              <span className="text-xs text-muted" data-testid="buddy-going">
                {with_.going === 0
                  ? "no games going"
                  : `${with_.going} going${with_.yours > 0 ? `, ${with_.yours} on you` : ""}`}
              </span>
              <span className="ml-auto">
                <RowActions>
                  {/* One press to the set-up screen against them; one more begins it. */}
                  <ChallengeButton memberId={buddy.id} label="Play" strong />
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
