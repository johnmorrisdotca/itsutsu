import { Paired } from "@/components/i18n/Paired";
import { PlayerName } from "@/components/players/PlayerName";
import Link from "next/link";

import { CardArrow } from "@/components/ui/CardArrow";
import { RAISED_LINK, STRETCHED_HOST } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONES, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import { STALE_AFTER_DAYS, type MyGame } from "@/lib/history/myGames";
import { MY_GAMES_COPY } from "./mine.constants";
import { OfferButtons } from "./OfferButtons";
import { ResignButton } from "./ResignButton";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";

/**
 * ONE GAME IN THE QUEUE, AS A ROW.
 *
 * Split out of `MyGamesList.tsx` when the finished group learned to page: that
 * file is the QUEUE — which groups there are, how many of each are shown, and
 * which page of the one that pages — and this is one line of one of them. Two
 * jobs that were in one file, and the size gate said so.
 *
 * The two halves talk through `MyGame` and nothing else, so there is no prop
 * here that knows about cursors or caps.
 */

/** "3 days ago", the way a list of games reads it. */
function ago(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function Row({ item, now }: { item: MyGame; now: Date }) {
  const { game, seat, group, offer, offerSide } = item;
  const black = game.blackName.trim() || SEAT_DISPLAY.one.label;
  const white = game.whiteName.trim() || SEAT_DISPLAY.two.label;
  /*
   * The other person's name, for the sentences an offer's row says. Read off
   * the seat this reader is NOT in, which on an offer is the other person
   * whichever colour they hold — a rematch swaps them, so "white" would be
   * wrong about half of them.
   */
  const them = (seat === STONES.black ? white : black).trim() || SEAT_DISPLAY.two.label;
  /*
   * One address either way. A match kept its identity when it finished and the
   * link to it did not: a finished game went to /history/<slug>/<id> and a
   * live one to /games/<slug>/<id>, so the same match had two hrefs depending
   * on when you looked.
   */
  const href = matchPath(game.variant, game.id);
  // A hot-seat game's names are two people at one keyboard and belong to nobody.
  const named = group !== "hotSeat";
  /*
   * AN OFFER IS NOT A GAME TO GIVE UP. Resign and Cancel are for a board two
   * people are playing; an offer is answered with Accept, Decline or Withdraw
   * and nothing else. Offering "Resign" on an offer would be a control that
   * ends a game one of the two has never agreed to play — and the routes refuse
   * it, so it would also be a button that does nothing.
   */
  const running = group !== "finished" && offer === null;
  return (
    <li
      /*
        STRETCHED_HOST rather than STRETCHED_ROW: a "your move" row is green
        because it is waiting on you, and a hover shade would paint over the
        one thing the row is saying. The arrow filling is the hover here.
      */
      /*
         An offer TO you is shaded like your move, because it is the same
         thing: something waiting on you. An offer you SENT is not, and a
         declined one is not — a green row over "Hanachan declined" would read
         as good news.
      */
      className={`${STRETCHED_HOST} flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
        group === "yourMove" || group === "offered"
          ? "border-moss/50 bg-moss-soft"
          : offer === "declined"
            ? "border-ochre/50 bg-ochre-soft"
            : "border-rule"
      }`}
      data-testid="my-game"
      data-id={game.id}
      data-stale={item.stale}
    >
      {/*
        The row leads to the game and the names lead to the people, so the
        row's link is stretched under the card and the names sit above it —
        the same construction the record table uses, because a link inside a
        link is not a thing a browser will render. The arrow at the far end is
        the sign that the row opens: John's "you play your move, then the next
        game opens up" starts with seeing which rows are doors.
      */}
      <Link href={href} data-card-link="" className="absolute inset-0 rounded-lg" aria-label={`${black} vs ${white}`} />
      {/*
        The board, so the queue can be scanned rather than read. John: "it's
        all just text. very ugly and hard to scan." A Reversi board and a
        Gomoku board are different at a glance and the words were not. Under
        the row's link, in flow, so it is part of the target and not a stop.
      */}
      <GameThumb variant={game.variant} />
      {/*
        `basis-56`: on a phone the words keep fourteen rems and the controls
        wrap under them, rather than the words wrapping four deep beside a
        Resign button. At a desk the row is one line either way.
      */}
      <span className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <span className="truncate font-medium">
          <PlayerName name={game.blackName} memberId={game.blackMemberId} fallback={SEAT_DISPLAY.one.label} linkable={named} className={RAISED_LINK} />
          <span className="px-1 text-muted">vs</span>
          <PlayerName name={game.whiteName} memberId={game.whiteMemberId} fallback={SEAT_DISPLAY.two.label} linkable={named} className={RAISED_LINK} />
        </span>
        <span className="text-xs text-muted">
          <GameName variant={game.variant} raised /> · {game.size}×{game.size} · {game.moveCount} moves ·{" "}
          {/*
            "you WOULD be white" on an offer, because you are not in it yet.
            The colour is the fact a reader most wants before answering — a
            rematch swaps them — and stating it as though the seat were
            already theirs would be the one thing an offer must not say.
          */}
          {offer === "offered" && offerSide === "to-me" ? "you would be " : "you are "}
          {STONE_DISPLAY[seat].label} {STONE_DISPLAY[seat].kanji} · {ago(item.since, now)}
        </span>
        {/*
          WHAT AN OFFER IS DOING, in a sentence, on the row. A declined offer is
          the one thing on this page somebody has to be TOLD rather than shown,
          and it says plainly that nothing was played and nothing was rated —
          so a refusal cannot read as a loss.
        */}
        {offer === null ? null : (
          <span className="text-xs font-medium text-ink-soft" data-testid="offer-state">
            {offer === "declined"
              ? MY_GAMES_COPY.offer.declined(them)
              : offer === "withdrawn"
                ? MY_GAMES_COPY.offer.withdrawn
                : offerSide === "to-me"
                  ? MY_GAMES_COPY.offer.offered
                  : MY_GAMES_COPY.offer.offerSent(them)}
          </span>
        )}
      </span>
      {item.stale ? (
        <span className="relative z-10 rounded-full border border-ochre/60 bg-ochre-soft px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase" title={MY_GAMES_COPY.staleHint(STALE_AFTER_DAYS)}>
          {MY_GAMES_COPY.stale}
        </span>
      ) : null}
      {/*
        Above the stretched row link, or the link swallows the click. Anything
        added to a row from here on needs the same, which is the cost of the
        row being a link at all.
      */}
      {/*
        Calling off an empty board is offered even where resigning is not. A
        host who says nobody may walk away means a game in progress, and there
        is nothing to walk away from before the first stone — leaving somebody
        stuck with an empty board for ever would be a rule protecting nothing.
      */}
      {running && (game.allowResign || game.moveCount === 0) ? (
        <span className={RAISED_LINK}>
          <ResignButton id={game.id} moves={game.moveCount} />
        </span>
      ) : null}
      {/*
        Accept and Decline where the offer is, so answering does not need the
        board first. Above the stretched row link — see the note on the resign
        button — or the link swallows the press. Only while the offer stands: a
        declined one is a row saying what happened, with nothing left to do.
      */}
      {offer === "offered" && offerSide !== null ? (
        <span className={RAISED_LINK}>
          <OfferButtons id={game.id} side={offerSide} />
        </span>
      ) : null}
      {/* `ml-auto` only matters once the controls have wrapped: the arrow keeps the row's far end. */}
      <CardArrow className="ml-auto" />
    </li>
  );
}
