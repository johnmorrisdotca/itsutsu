import Link from "@/components/ui/Link";

import { currentMemberId } from "@/lib/auth/currentSession";
import { ACTIVE_GAME_LIMIT, activeGameCount } from "@/lib/history/activeGames";
import { SEATED_LIVE_PATH } from "@/lib/history/myFinished";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";

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
  const say = await currentSpeaker();
  const mine = await currentMemberId();
  const held = mine === null ? null : await activeGameCount(mine);
  return (
    <p
      className="rounded-xl border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm"
      role="status"
      data-testid="seat-full-notice"
    >
      <strong className="font-semibold">{say.say("gamepages.seatWaiting")}</strong>{" "}
      {held === null ? (
        <>{say.say("gamepages.seatLimit")}</>
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
          {weave(say.say("gamepages.seatHeldLine", { limit: String(ACTIVE_GAME_LIMIT) }), {
            held: (
              <Link
                href={SEATED_LIVE_PATH}
                className="font-medium underline underline-offset-4"
                title={say.say("gamepages.heldTitle")}
                data-testid="seat-full-held"
              >
                {say.say(say.form("gamepages.heldLink", held), { count: say.number(held) })}
              </Link>
            ),
          })}
        </>
      )}{" "}
      {weave(say.say("gamepages.seatFinish"), {
        link: (
          <Link href="/play" className="font-medium underline underline-offset-4">
            {say.say("gamepages.yourGames")}
          </Link>
        ),
      })}
    </p>
  );
}
