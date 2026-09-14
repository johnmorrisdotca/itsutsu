import Link from "next/link";

import { currentMemberId } from "@/lib/auth/currentSession";
import { activeGameCount, activeGameLimit } from "@/lib/history/activeGames";
import { SEATED_LIVE_PATH } from "@/lib/history/myFinished";

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
            THE NUMBER LEADS TO EXACTLY THE GAMES IT COUNTED.

            It is the CAP's: `activeGameCount` counts games still being played
            with this MEMBER in a seat, which is what the limit refused on. It
            once led to all of /play, which is the BROWSER's queue — seats held
            by cookie, games offered to the reader, finished ones it keeps — so
            it opened a longer list than it counted. Then it was a plain number,
            which kept the promise by breaking the rule that a count of games is
            a link. The answer was to build the page: `/play?all=seated` lists
            `seatedLive`, the same where this count reads, and says on the page
            what it was narrowed to.
          */}
          You are seated at{" "}
          <Link
            href={SEATED_LIVE_PATH}
            className="font-medium underline underline-offset-4"
            title="The games still being played with you in a seat — the ones the limit counts."
            data-testid="seat-full-held"
          >
            {held} games still being played
          </Link>
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
