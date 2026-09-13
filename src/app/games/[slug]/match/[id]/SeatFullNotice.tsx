import Link from "next/link";

import { currentMemberId } from "@/lib/auth/currentSession";
import { activeGameCount, activeGameLimit } from "@/lib/history/activeGames";

/**
 * Why a seat link did not seat you, on the page it sent you to.
 *
 * It says what to do about it and that the invitation is still good, because
 * a refusal that reads as a dead end sends somebody away from a game they
 * were invited to.
 *
 * Its own file beside the match page, which shows it: a notice explaining one
 * refusal is a job of its own, and the page had grown past the size gate with
 * three of them in it.
 */
export async function SeatFullNotice({ shown }: { shown: boolean }) {
  if (!shown) return null;
  /*
   * The numbers are read HERE rather than carried on the address. The ticket
   * asks for the count in the refusal — "since a bare refusal reads as a
   * fault" — and a number passed through a query is one a reader can edit,
   * so the page would be quoting them back their own guess. One extra count,
   * only ever on this path.
   */
  const mine = await currentMemberId();
  const held = mine === null ? null : await activeGameCount(mine);
  return (
    <p
      className="rounded-xl border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm"
      role="status"
      data-testid="seat-full-notice"
    >
      <strong className="font-semibold">Your seat is still waiting.</strong>{" "}
      {held === null ? (
        <>You already have as many games on the go as this site allows at once, so it was not claimed for you.</>
      ) : (
        <>
          {/*
            THE NUMBER DOES NOT LINK, AND THAT IS THE RULE KEPT RATHER THAN
            BROKEN. It used to lead to /play, which shows a LONGER list than
            this number counted — "a count must link to the set it counted, not
            a set that contains it", which AGENTS.md calls the same fault as no
            link at all, wearing a link.

            The two really are different questions, and both are right about
            their own. This number is the CAP's: `activeGameCount` counts games
            still being played with this MEMBER in a seat, because that is what
            the limit is about and what it refused on — an anonymous seat
            belongs to no member to be over it. /play is the BROWSER's queue:
            the member's seats AND any this browser holds by cookie, plus games
            offered to them, plus the finished ones it keeps. So a reader who
            followed the number and counted the rows would find more than the
            sentence said and conclude the site had miscounted — which is the
            one thing the count is quoted here to prevent.

            No page shows exactly the set this counted, so it is a plain number
            with the reason beside it, and the way to act on it is in words at
            the end. Named in `gameLinks.coverage.test.ts`'s exceptions with
            this reason, rather than left looking like an oversight.
          */}
          You are seated at{" "}
          <span
            className="font-medium"
            title="Games still being played with you in a seat. Your games list also holds games offered to you and ones already over."
            data-testid="seat-full-held"
          >
            {held} games still being played
          </span>
          , and {activeGameLimit()} at once is the limit here, so it was not claimed for you.
        </>
      )}{" "}
      Finish or resign one in{" "}
      <Link href="/play" className="font-medium underline underline-offset-4">
        your games
      </Link>{" "}
      and follow the same link again — it has not been used up.
    </p>
  );
}
