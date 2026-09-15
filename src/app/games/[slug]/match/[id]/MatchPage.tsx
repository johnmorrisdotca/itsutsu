import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GameViewClient } from "@/components/game/GameViewClient";
import { FiledMatchPage } from "./FiledMatchPage";
import { LiveMatch } from "./LiveMatch";
import { SEAT_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import { isOffered, offerIsMine, offeredSeat, offererSeat, wasRefused } from "@/lib/history/offers";
import { acrossTheBoard, mutedColours } from "@/lib/history/acrossTheBoard";
import { RefusedOfferPage } from "./RefusedOfferPage";
import { SeatFullNotice } from "./SeatFullNotice";
import { shownName } from "@/lib/rating/shownName";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { isHotSeat } from "@/lib/history/liveGame";
import { matchPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat } from "@/lib/history/seats";
import { currentMemberId } from "@/lib/auth/currentSession";
import { currentReader } from "@/lib/auth/currentReader";
import { appearanceFor, gameDefaultsFor } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

/**
 * A match, at /games/<slug>/match/<id>.
 *
 * ONE ADDRESS, WHATEVER THE MATCH IS DOING. The board is the shared one while
 * it is being played, moving as the other side moves; once it is over the same
 * address is the replay. A move number on the end names a position —
 * /games/gomoku/match/<id>/12 is the board after the twelfth stone — and that
 * is true in both states.
 *
 * It used to be two addresses, /games/<slug>/<id> and /history/<slug>/<id>,
 * each redirecting to the other at the moment the last stone landed. So every
 * link anybody had sent out changed meaning the day the game finished, and the
 * page a reader arrived at was decided by a redirect rather than by the
 * address they held. A match is one thing; it now has one address, and this
 * function is where the two presentations of it are chosen between.
 *
 * A seat is claimed through /seat/<token>, which puts the credential in a
 * cookie and leaves it out of the address. So a seat link can be scanned from
 * a phone, and the address that phone then shows can be read aloud, sent on
 * or screenshotted without handing the seat to anyone.
 */
export async function MatchPage({
  slug,
  id,
  move,
  seatFull = false,
}: {
  slug: string;
  id: string;
  move?: number;
  /**
   * The seat link could not seat this reader, because they are already
   * holding the most games the site allows at once.
   *
   * Said on the page rather than at the link, because the claim route is a
   * route handler and a person following an invitation deserves the site
   * around the answer rather than a bare document. The seat is NOT stamped
   * when this happens, so the link they were sent still works later.
   */
  seatFull?: boolean;
}) {
  const game = await fetchGameDetail(id);
  if (game === null) notFound();
  /*
   * The address names the game as well as the match, and the slug in it can
   * disagree with the row: a link typed or edited by hand, or one sent out
   * before 0.170.6, when a seat holder could still change the game on a board
   * nobody had moved on. That door is shut now — `changesTheGame` refuses any
   * change of variant, so the game is decided when the match is made and only
   * the board, opening, clock, pace and ratings may move before the first
   * stone. This used to say "either player may change the game until the
   * first stone is down", which stopped being true then.
   *
   * The reason for the redirect survives the door closing. The id is the
   * identity; the slug is how the address reads. A real game reached under a
   * name that is not its own leads to the game, at the address it goes under,
   * rather than "there is no page at this address" about a board that exists —
   * which also mends every link anybody sent out while the door was open.
   */
  if (slugFor(game.variant) !== slug) redirect(matchPath(game.variant, id, move));
  if (move !== undefined && (!Number.isInteger(move) || move < 0 || move > game.moveCount)) {
    notFound();
  }

  const claim = await resolveSeat(id, (await cookies()).get(seatCookieName(id))?.value, await currentMemberId());
  const token = claim?.token;
  const seat = claim?.seat ?? null;

  /*
   * A match that is over is the same match, at the same address, read
   * differently: the replay, the conversation, the applause, the rematch. It
   * was a redirect to a second address until the two were folded into one, and
   * a redirect is what made a link to a game stop working the day it finished.
   */
  /*
   * AN OFFER THAT WAS REFUSED IS NOT A MATCH, so it does not get the match
   * page. It is filed `status: finished` — that is how it leaves the cap, the
   * lobby and every sweep — so without this it fell through to the replay,
   * which would have drawn a board, a move list and a result line for a game
   * nobody ever agreed to play. "Unfinished 中断" over an empty board, reading
   * as a game that was started and given up.
   *
   * A page rather than a 404, because the offerer follows a link to it from
   * their own queue and a dead end is the one thing this page must not be.
   */
  if (wasRefused(game)) return <RefusedOfferPage game={game} />;
  if (game.status !== "active") return <FiledMatchPage id={id} move={move} />;

  /*
   * A hot-seat match — two people at one screen — opens on the full board,
   * with undo and the rest, in the browser that holds its key. Anyone else
   * who has the address may watch it.
   */
  const tokens = await prisma.game.findUnique({
    where: { id },
    select: { blackToken: true, whiteToken: true, blackMemberId: true, whiteMemberId: true },
  });
  if (tokens !== null && isHotSeat(tokens) && claim !== null) {
    // The member's own board, so a phone and a laptop set out the same one.
    const reader = await currentReader();
    const board = await appearanceFor(reader.memberId);
    const defaults = await gameDefaultsFor(reader.memberId);
    return (
      <Page width="wide">
        <SiteHeader />
        <SeatFullNotice shown={seatFull} />
        <GameViewClient
          variant={game.variant as RuleVariant}
          trackPath
          match={{ game, at: move }}
          appearance={board}
          // An account to write the board back to, not a session — see /games/<slug>/play.
          savesToAccount={reader.hasAccount}
          defaults={defaults}
        />
      </Page>
    );
  }

  /*
   * WHO IS ACROSS THE BOARD, AND WHO THIS READER HAS MUTED — both in
   * `acrossTheBoard.ts`, which also keeps the reason the second one is asked
   * for a WATCHER and not only for a player.
   */
  // Muted by member id: the ignore list is kept that way, and so is every seat.
  const mine = await currentMemberId();
  const opponent = tokens === null ? null : await acrossTheBoard(seat, tokens, game);
  const ignoring = tokens === null ? [] : await mutedColours(mine, tokens);

  /*
   * WHICH SIDE OF AN OFFER THIS READER IS ON, worked out here because it needs
   * their member id and everything below is a client component.
   *
   * `null` for a stranger watching an offered game, which is right: an offer is
   * addressed to one person, and a watcher is shown the board and the ordinary
   * "you are watching" line. Nothing about who was asked is printed for them.
   */
  const mineId = await currentMemberId();
  const side = offerIsMine(game, mineId);
  /*
   * The OTHER person's seat, which is a different seat for each of the two
   * readers: whoever is looking at this wants the other one named. Derived from
   * the offer rather than from "white", because a rematch swaps the colours and
   * a fixed colour would be wrong about half of them.
   */
  const theirSeat = side === "to-me" ? offererSeat(game) : offeredSeat(game);
  /*
   * `isOffered` as well as a side, because `side` is true of a REFUSED offer
   * too — the offerer has to be told which of theirs was declined — and this
   * prop is what puts Accept and Decline on the board. An offer that has been
   * answered has nothing left to answer.
   */
  const offer =
    side === null || theirSeat === null || !isOffered(game)
      ? null
      : {
          side,
          who: shownName(
            (theirSeat === STONES.black ? game.blackName : game.whiteName).trim() ||
              SEAT_DISPLAY.two.label,
          ),
        };

  return (
    <LiveMatch
      game={game}
      token={token ?? null}
      seat={seat}
      move={move ?? game.moveCount}
      opponent={opponent}
      ignoring={ignoring}
      seatFull={seatFull}
      offer={offer}
    />
  );
}
