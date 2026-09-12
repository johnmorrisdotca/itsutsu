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
          You have{" "}
          {/*
            The count leads to the games it counted, which is this site's rule
            about any number that refers to games — and here it is also the
            only useful thing to do about the refusal: the game to finish is
            in that list.
          */}
          <Link href="/play" className="font-medium underline underline-offset-4">
            {held} games on the go
          </Link>
          , and {activeGameLimit()} at once is the limit here, so it was not claimed for you.
        </>
      )}{" "}
      Finish or resign one and follow the same link again — it has not been used up.
    </p>
  );
}
