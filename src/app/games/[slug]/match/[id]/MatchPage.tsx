import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InvitePanel, type SeatInvite } from "@/components/live/InvitePanel";
import { SharedGame } from "@/components/live/SharedGame";
import { SharedRules } from "@/components/live/SharedRules";
import { SitAsPanel } from "@/components/live/SitAsPanel";
import { GameViewClient } from "@/components/game/GameViewClient";
import { FiledMatchPage } from "./FiledMatchPage";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { NotesPanel } from "@/components/game/NotesPanel";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import { isOffered, offerIsMine, offeredSeat, offererSeat, wasRefused } from "@/lib/history/offers";
import { acrossTheBoard, mutedColours, type Across } from "@/lib/history/acrossTheBoard";
import { OfferPanel } from "@/components/live/OfferPanel";
import { RefusedOfferPage } from "./RefusedOfferPage";
import { SeatFullNotice } from "./SeatFullNotice";
import { shownName } from "@/lib/rating/shownName";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { isHotSeat } from "@/lib/history/liveGame";
import { gameRatingRefusal } from "@/lib/rating/rateable";
import { matchPath, seatPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { seatCookieName } from "@/lib/history/seatCookie";
import { seatPickList } from "@/lib/phrase/seatPick";
import { markSeatTaken, resolveSeat, seatIsFree } from "@/lib/history/seats";
import { currentEmail, currentMemberId } from "@/lib/auth/currentSession";
import { appearanceFor, gameDefaultsFor } from "@/lib/auth/members";
import { appearanceFrom } from "@/components/board/appearance";
import { prisma } from "@/lib/prisma";
import { forkOffered } from "@/lib/history/fork";

/** The site's own origin, taken from the request so links work behind any host. */
async function origin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:6600";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

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
   * The address names the game as well as the match, and either player may
   * change the game until the first stone is down. So the slug in the address
   * goes stale the moment somebody does — and this said "there is no page at
   * this address" about the board they were sitting at, because it had just
   * stopped being a game of that name.
   *
   * The id is the identity; the slug is how the address reads. A real game
   * reached by the name it used to go under leads to the game, at the address
   * it goes under now — which also mends every link anybody sent out before
   * the rules were settled.
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
    const mine = await currentEmail();
    const board = await appearanceFor(mine);
    const defaults = await gameDefaultsFor(mine);
    return (
      <Page width="wide">
        <SiteHeader />
        <SeatFullNotice shown={seatFull} />
        <GameViewClient
          variant={game.variant as RuleVariant}
          trackPath
          match={{ game, at: move }}
          appearance={board}
          signedIn={mine !== null}
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
  const mine = await currentEmail();
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

async function LiveMatch({
  game,
  token,
  seat,
  move,
  opponent,
  ignoring,
  seatFull,
  offer,
}: {
  game: GameDetail;
  token: string | null;
  seat: Stone | null;
  /** The position the address names, for forking a new game from it. */
  move: number;
  opponent: Across | null;
  /** Whether a seat link turned this reader away for holding too many games. */
  seatFull: boolean;
  /** Colours whose player this reader has ignored. */
  ignoring: readonly Stone[];
  /** An unanswered offer this reader is one of the two people in. */
  offer: { side: "to-me" | "from-me"; who: string } | null;
}) {
  /*
   * Seat links are only handed out to someone who already holds one. A reader
   * with no claim, or the wrong one, gets a board they can watch and not
   * touch — so a shared spectator link cannot be turned into a seat.
   *
   * And only for a seat still waiting for somebody. The token IS the
   * credential — it plays that seat on its own, with no cookie and no account
   * — so this used to show each player the other's, for the length of the
   * game, which meant either of them could play the other's moves. A seat
   * somebody is already sitting in has no link worth giving out and every
   * reason not to have one on screen.
   *
   * Fetched before `refusal` below, which reads the tokens too: hot seat is
   * a fact about them, not about the names.
   */
  const tokens = await prisma.game.findUnique({
    where: { id: game.id },
    select: {
      blackToken: true,
      whiteToken: true,
      openSeat: true,
      openedAt: true,
      blackClaimedAt: true,
      whiteClaimedAt: true,
      moveCount: true,
      /*
       * AND WHETHER THIS GAME IS AN OFFER, which `seatIsFree` below now
       * requires rather than accepting as optional — because forgetting it
       * here is exactly what went wrong. Without it that function was handed
       * `undefined`, read it as "not an offer", and reported the offeree's
       * seat as free: so the board offered the four-words panel and a seat
       * link for a seat that had been promised to one person by name. The
       * route refused, so it was a control that did nothing, which is the
       * failure the note below about hidden controls warns about, inverted.
       * Found by `e2e/offers.spec.ts` driving the real board.
       */
      offeredAt: true,
      /*
       * The two member ids used to be read here as well, for `settled` — a seat
       * bound to a member is a person already in this game whether or not they
       * have opened it. Nothing beside the board asks whether the rules are still
       * open any more (see below), so they go: a column fetched for a reader that
       * no longer exists is a comment about the past wearing a query.
       */
    },
  });

  /*
   * Whether this game will move a rating, and if it will not, why.
   *
   * Said here, while the game is still being played, because afterwards there
   * is nothing to say it with: the ladder has not moved and there is no gap on
   * a page to click on. A seat still posted on the noticeboard is left alone —
   * it has no name on it because nobody has taken it yet, which is a game
   * waiting rather than a game that will not count.
   *
   * `gameRatingRefusal` is the same question the write side asks before ever
   * calling `recordResult` — hot seat and the name-fold rule both, not either
   * alone. Checking the names alone would show a hot-seat game between two
   * ordinary, different names as an on-track rated game right up to the
   * moment it finished, which is exactly what ten of twelve production rows
   * did.
   *
   * THE NAMES AS PLAYED, not the names to show: `ratingRefusal` (inside
   * `gameRatingRefusal`) asks whether one person held both seats, keyed by
   * the name a game was played under, not by however it renders today. See
   * `playedAs` on `GameSummary` — reading the resolved `blackName` here would
   * let this page explain a refusal the database never made.
   */
  /*
   * AND AN OFFER IS LEFT ALONE FOR THE SAME REASON A POSTED SEAT IS. It has a
   * name on the other seat, so the name-fold rule would happily answer — but
   * nobody is in that seat yet, so any answer would be about a game that does
   * not exist. A game waiting to be agreed is not a game that will not count.
   */
  const refusal =
    game.openSeat === null && !isOffered(game)
      ? gameRatingRefusal({
          rated: game.rated,
          hotSeat: tokens !== null && isHotSeat(tokens),
          blackName: game.playedAs.black,
          whiteName: game.playedAs.white,
        })
      : null;

  /*
   * The board this member likes, on the board they are actually playing on.
   * The shared game drew the default and nothing else, so a board dressed on
   * the account followed them into a local game and stopped at the door of a
   * real one.
   */
  const appearance = appearanceFrom(await appearanceFor(await currentEmail()));

  /*
   * A seat holder opening the game is that seat's holder arriving, and until
   * now only a seat link said so. A challenge binds both seats to accounts at
   * the moment it is sent and neither player ever follows a link, so nothing
   * was ever stamped for either of them — which left a challenged game's rules
   * open to change right up to the first stone, the very window the rest of
   * this was closing. Written once per seat, and only when it is not already
   * written, so an ordinary view of a game costs nothing.
   */
  const arriving =
    tokens !== null && seat !== null && (seat === STONES.black ? tokens.blackClaimedAt : tokens.whiteClaimedAt) === null;
  if (arriving) await markSeatTaken(game.id, seat);

  /*
   * Seats still waiting for somebody, regardless of whether THIS reader holds
   * one — unlike `invites` below, which only exists for a reader already
   * seated. This is what lets `SitAsPanel` offer the kitchen-table way in: a
   * free seat can be claimed with four words by anybody looking at this
   * screen, seated or not, on a device signed in as somebody else entirely.
   */
  const freeSeats: Stone[] =
    tokens === null ? [] : [STONES.black, STONES.white].filter((stone) => seatIsFree(tokens, stone));

  /*
   * Who could sit down here, for `SitAsPanel` to print as names to tap. Read on
   * the server and handed over as a prop rather than fetched by the panel: a
   * route that answers "who holds an account here" is a route somebody can ask,
   * and there is no need for one — this page is already a server render, and the
   * question is only asked when a seat is actually free.
   */
  const seatPicks = freeSeats.length === 0 ? [] : await seatPickList();

  /*
   * NOTHING IS ASKED HERE ANY MORE, so nothing reads `rulesAreSettled`. The panel
   * beside the board was a form for a game nobody had answered and is a statement
   * at every stage now: the rules are agreed on the doorstep before the game is
   * written, and "we do not want to see that Game board with all the settings on
   * the side". The rule itself has not moved — `PUT /api/games/<id>/settings` still
   * asks it and still answers 409 — which is where it belongs, since hiding a
   * control whose route still answers is how the seat links went wrong.
   */
  let invites: SeatInvite[] = [];
  if (seat !== null) {
    if (tokens !== null) {
      const base = await origin();
      const pairs: [Stone, string][] = [
        [STONES.black, tokens.blackToken],
        [STONES.white, tokens.whiteToken],
      ];

      invites = await Promise.all(
        pairs
          .filter(([stone]) => seatIsFree(tokens, stone))
          .map(async ([stone, seatToken]) => {
            const url = `${base}${seatPath(game.variant, game.id, seatToken)}`;
            return {
              stone,
              url,
              qr: await QRCode.toDataURL(url, { width: 320, margin: 1 }),
            };
          }),
      );
    }
  }

  return (
    <Page width="wide" gap="gap-6">
      <SiteHeader />
      <SeatFullNotice shown={seatFull} />

      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <div className="w-full min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[min(100%,36rem)]">
            <SharedGame
              initial={game}
              token={token}
              seat={seat}
              basePath={matchPath(game.variant, game.id)}
              opponent={opponent}
              ignoring={ignoring}
              offer={offer}
              appearance={appearance}
            />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          {/*
            THE ANSWER, FIRST IN THE PANEL. An offer is the one thing on this
            page a reader has to do something about, so it sits above the
            rules rather than under them — and the rules directly below it are
            what they are deciding about, which is the order somebody reads in.
          */}
          {offer !== null ? (
            <OfferPanel id={game.id} side={offer.side} who={offer.who} />
          ) : null}
          <SharedRules game={game} refusal={refusal} />
          {/*
            And nothing to fork off a board nobody has agreed to play on yet.
            Forking an offer would propose a second game out of a position that
            is itself still a question.
          */}
          {offer === null && forkOffered({ move, last: game.moveCount, seated: seat !== null }) ? (
            <div className={`${PANEL_CLASS} flex flex-col gap-2`}>
              <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Fork <span className="font-mincho normal-case tracking-normal">分岐</span>
              </h2>
              <p className="text-xs text-muted">
                Start a second game from this exact position, against the same opponent. Both games go on. You settle
                the clock and whether it counts before it starts; the board and the rules come with the position.
              </p>
              <ChallengeButton
                from={{ id: game.id, move }}
                variant={game.variant}
                label={`Play from move ${move}`}
              />
            </div>
          ) : null}
          {seat !== null ? (
            <div className={PANEL_CLASS}>
              <NotesPanel gameKey={`shared:${game.id}`} />
            </div>
          ) : null}
          {/*
            Two independent ways into a free seat, and either may show at
            once: a link to scan on a device of its own, and four words to
            tap on this one. `SitAsPanel` asks nothing about who is signed in
            here — that is the whole point of it — so it shows for any reader
            while a seat is waiting, whether or not they already hold one.
          */}
          {freeSeats.length > 0 ? <SitAsPanel gameId={game.id} freeSeats={freeSeats} members={seatPicks} /> : null}
          {/*
            `offer === null` on the watching notice: the offeree HAS no seat and
            no link — that is what "tokenless until accepted" means — so telling
            them to open one would be a dead end pointing at a thing that does
            not exist. The panel above is their way in, and it is the only one.
          */}
          {invites.length > 0 ? (
            <InvitePanel invites={invites} yourStone={seat} />
          ) : offer === null && seat === null && freeSeats.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-rule px-4 py-6 text-sm text-muted">
              You are watching this game. Open your own seat link to play.
            </p>
          ) : null}
        </aside>
      </div>
  </Page>
  );
}
