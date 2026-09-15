import { headers } from "next/headers";
import QRCode from "qrcode";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InvitePanel, type SeatInvite } from "@/components/live/InvitePanel";
import { SharedGame } from "@/components/live/SharedGame";
import { SharedRules } from "@/components/live/SharedRules";
import { SitAsPanel } from "@/components/live/SitAsPanel";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { NotesPanel } from "@/components/game/NotesPanel";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { isOffered } from "@/lib/history/offers";
import type { Across } from "@/lib/history/acrossTheBoard";
import { OfferPanel } from "@/components/live/OfferPanel";
import { SeatFullNotice } from "./SeatFullNotice";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { isHotSeat } from "@/lib/history/liveGame";
import { gameRatingRefusal } from "@/lib/rating/rateable";
import { matchPath, seatPath } from "@/lib/gomoku/slugs";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { seatPickList } from "@/lib/phrase/seatPick";
import { markSeatTaken, seatIsFree } from "@/lib/history/seats";
import { currentMemberId } from "@/lib/auth/currentSession";
import { appearanceFor } from "@/lib/auth/members";
import { appearanceFrom } from "@/components/board/appearance";
import { prisma } from "@/lib/prisma";
import { forkOffered } from "@/lib/history/fork";
import { RivalryPanel } from "@/components/history/RivalryPanel";
import { RIVALRY_MOMENTS } from "@/lib/record/rivalry.constants";

/*
 * THE LIVE MATCH: the board being played, and the panel beside it — the offer,
 * the rules, a fork, the notes, and the ways into a free seat.
 *
 * Moved here whole from `MatchPage.tsx`, with the one helper only it used, when
 * that file reached the 500-line gate. `MatchPage` still decides which of a
 * match's presentations a reader gets; this is the one it hands a match that is
 * still being played.
 */

/** The site's own origin, taken from the request so links work behind any host. */
async function origin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:6600";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function LiveMatch({
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
          handicap: game.handicap,
          headStart: game.headStart,
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
  const appearance = appearanceFrom(await appearanceFor(await currentMemberId()));

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
      {/* Before the first stone: who these two are to each other. See RivalryPanel. */}
      {game.moveCount === 0 ? (
        <RivalryPanel of={{ seats: { black: game.blackMemberId, white: game.whiteMemberId } }} variant={game.variant} moment={RIVALRY_MOMENTS.before} />
      ) : null}

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
