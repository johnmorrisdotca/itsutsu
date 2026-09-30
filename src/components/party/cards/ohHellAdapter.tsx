"use client";

import { suitWords } from "@/lib/cardGames/cards";
import type { CardSuit } from "@/lib/cardGames/cardGames.types";
import { dealerOf, ohHellBids } from "@/lib/cardGames/ohHell/ohHell";
import { OH_HELL_RULES } from "@/lib/cardGames/ohHell/ohHellRules";
import type { OhHellGame, OhHellMove } from "@/lib/cardGames/ohHell/ohHell.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

/** Trumps in words, as the table writes them: "Clubs are trumps". */
function trumpWords(trump: CardSuit): string {
  const suit = suitWords(trump);
  return `${suit[0].toUpperCase()}${suit.slice(1)} are trumps`;
}

/**
 * THE TABLE: the turned card in the corner, which names trumps; while the
 * bids go round, what each seat has bid and how many tricks there are; then
 * the trick, from the viewer's seat as Hearts lays it, and between tricks
 * the last one and who took it.
 */
function OhHellCentre({ game, viewer, players }: CardCentreProps<OhHellGame>) {
  const seats = game.players.length;
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null && game.phase === "playing" ? game.lastTrick.winner : null;
  const bids = game.bids.flatMap((bid, seat) => (bid === null ? [] : [`${players[seat]} ${bid}`]));
  return (
    <>
      <LaidCard card={game.turned} left={2} top={2} width={9} testId="cards-turned" />
      <TableWords left={0} top={16} width={14} testId="cards-trumps">
        {trumpWords(game.trump as CardSuit)}
      </TableWords>
      {game.phase === "bidding" ? (
        <TableWords left={18} top={18} width={64} testId="cards-bids">
          {`${game.cards} ${game.cards === 1 ? "card" : "cards"} each. ${bids.length === 0 ? "How many tricks will each of you take?" : `Bids: ${bids.join(", ")}`}`}
        </TableWords>
      ) : (
        showing.map((play) => <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, seats)} testId="cards-trick-card" />)
      )}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {players[taken]} took the trick
        </TableWords>
      )}
    </>
  );
}

/** Oh Hell at the table: a bid, then one card played a trick. */
export const OH_HELL_ADAPTER: CardAdapter<OhHellGame, OhHellMove> = {
  kind: "ohHell",
  rules: OH_HELL_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen) => {
    if (game.phase === "bidding") return ohHellBids(game).map((bid): CardAction<OhHellMove> => ({ label: String(bid), move: { bid }, testId: `cards-bid-${bid}` }));
    const move: OhHellMove | null = chosen.length === 1 ? { play: chosen[0] } : null;
    const ok = move !== null && OH_HELL_RULES.play(game, move) !== null;
    return [{ label: "Play", move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? "Choose a card to play." : "Follow the suit led if you can." }];
  },
  quick: (game, card) => {
    if (game.phase !== "playing") return null;
    const move: OhHellMove = { play: card };
    return OH_HELL_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.phase === "bidding") {
      const dealer = game.toPlay === dealerOf(game.deal, game.players.length);
      const others = game.bids.reduce<number>((sum, bid) => sum + (bid ?? 0), 0);
      const barred = game.cards - others;
      return dealer && barred >= 0 ? `${name(game.toPlay)} deals, and bids last: anything but ${barred}.` : `${name(game.toPlay)} to bid: exactly how many tricks, from none to ${game.cards}.`;
    }
    return `${name(game.toPlay)} ${game.trick.length === 0 ? "to lead" : "to play"}.`;
  },
  standing: (game, seat) => {
    const bid = game.bids[seat];
    const note = game.phase === "over" ? undefined : bid === null ? (seat === dealerOf(game.deal, game.players.length) ? "deals" : "to bid") : `bid ${bid}, took ${game.tricks[seat]}`;
    return { score: String(game.scores[seat]), note };
  },
  scoreWords: "Points, most wins",
  Centre: OhHellCentre,
};
