import { cookies } from "next/headers";

import { HereNowPanel } from "@/components/mine/HereNowPanel";
import { OpenGamesBoard } from "@/components/mine/OpenGamesBoard";
import { currentReader } from "@/lib/auth/currentReader";
import { sweepOpenSeats } from "@/lib/bots/botSeats";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { OPEN_GAMES_SHOWN, fetchOpenSeats } from "@/lib/history/openGames";
import { filterOpenSeats, posterOf, type OpenSeatFilter } from "@/lib/history/openSeatsFilter";
import { posterKeyOf } from "@/lib/history/posterStanding";
import { fetchPosterStandings } from "@/lib/history/posterStandingRead";
import { seatClaims } from "@/lib/history/seatCookie";
import { ignoredMemberIds } from "@/lib/social/ignores";
import { fetchHereNow } from "@/lib/social/presence";

/**
 * THE SEATS OTHER MEMBERS HAVE POSTED, AND WHO IS HERE: on My games, beside
 * the games you have going, because sitting down in somebody's waiting seat is
 * your own play — ItsYourTurn's Waiting Games, next to its My Games.
 *
 * It was the top of /games, under a one-line form that set a game up a second
 * way. John, 2026-09-24: "in Games there is a Post a Seat button which seems
 * to do a lot of what New Game does… Games page has a FULL page of text before
 * you get down to the different families." New game is where a game is set up,
 * and /games is the library.
 *
 * For a member only, as it always was: every seat carries a member's name.
 */
export async function OpenSeatsSection({ filter }: { filter: OpenSeatFilter }) {
  const reader = await currentReader();
  if (!reader.signedIn) return null;
  const claims = seatClaims((await cookies()).getAll());
  sweepOpenSeats();
  const mine = reader.memberId;
  const [seatGames, here, ignored] = await Promise.all([
    fetchOpenSeats([...claims.keys()]),
    fetchHereNow(),
    mine === null ? Promise.resolve(new Set<string>()) : ignoredMemberIds(mine),
  ]);
  /*
   * Two seats never belong on somebody's board: their own, which they cannot
   * sit across from, and one posted by a member they ignore — the ignore list
   * is a rule about who may reach you, and a seat is a way in. Keyed by member
   * id, never by a browser's seat cookies: a seat belongs to the account on
   * every device.
   */
  const theirs = (game: GameSummary) => {
    const poster = game.openSeat === STONES.black ? game.whiteMemberId : game.blackMemberId;
    if (poster === null) return true;
    if (mine !== null && poster === mine) return false;
    return !ignored.has(poster);
  };
  // Narrowed first, then cut: a list cut to thirty and then narrowed loses seats the narrowing would have kept.
  const usable = seatGames.filter(theirs);
  /* Every poster's strength, read once for the whole board, so the rating filter reads the figure the row prints. */
  const standings = await fetchPosterStandings(usable.map((game) => posterOf(game)));
  const narrowed = filterOpenSeats(usable, filter, (poster) => standings.get(posterKeyOf(poster))?.rating?.rating ?? null);
  return (
    <section className="flex flex-col gap-4" data-testid="open-seats-section">
      <OpenGamesBoard games={narrowed.slice(0, OPEN_GAMES_SHOWN)} shown={narrowed.length} total={usable.length} filter={filter} standings={standings} />
      <HereNowPanel here={here} me={reader.memberId} />
    </section>
  );
}
