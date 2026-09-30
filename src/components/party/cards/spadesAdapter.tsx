"use client";

import { NIL, SPADES_BIDS, contractOf, partnerOf, teamOf } from "@/lib/cardGames/spades/spades";
import { SPADES_RULES } from "@/lib/cardGames/spades/spadesRules";
import type { SpadesGame, SpadesMove } from "@/lib/cardGames/spades/spades.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

/** A bid in words: "nil", "4". */
const bidWords = (bid: number) => (bid === NIL ? "nil" : String(bid));

/**
 * THE TRICK ON THE TABLE, from the viewer's seat, as Hearts lays it: each card
 * where its player sits, theirs at the foot, and between tricks the last one
 * and who took it. While the bids go round, the table says what each seat has
 * bid so far.
 */
function SpadesCentre({ game, viewer, players }: CardCentreProps<SpadesGame>) {
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null && game.phase === "playing" ? game.lastTrick.winner : null;
  const bids = game.bids.flatMap((bid, seat) => (bid === null ? [] : [`${players[seat]} ${bidWords(bid)}`]));
  return (
    <>
      {game.phase === "bidding" ? null : showing.map((play) => <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, 4)} testId="cards-trick-card" />)}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {players[taken]} took the trick
        </TableWords>
      )}
      {game.phase === "bidding" ? (
        <TableWords left={15} top={18} width={70} testId="cards-bids">
          {bids.length === 0 ? "Bidding: how many tricks will each of you take?" : `Bids: ${bids.join(", ")}`}
        </TableWords>
      ) : null}
    </>
  );
}

/** Spades at the table: a bid, then one card played a trick. */
export const SPADES_ADAPTER: CardAdapter<SpadesGame, SpadesMove> = {
  kind: "spades",
  rules: SPADES_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen) => {
    if (game.phase === "bidding") {
      return SPADES_BIDS.map((bid): CardAction<SpadesMove> => ({ label: bid === NIL ? "Nil" : String(bid), move: { bid }, testId: `cards-bid-${bidWords(bid)}` }));
    }
    const move: SpadesMove | null = chosen.length === 1 ? { play: chosen[0] } : null;
    const ok = move !== null && SPADES_RULES.play(game, move) !== null;
    return [{ label: "Play", move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? "Choose a card to play." : "That card cannot be played now: follow the suit led if you can, and lead a spade only once spades are broken." }];
  },
  quick: (game, card) => {
    if (game.phase !== "playing") return null;
    const move: SpadesMove = { play: card };
    return SPADES_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.phase === "bidding") return `${name(game.toPlay)} to bid, partnered with ${name(partnerOf(game.toPlay))} across the table: how many tricks, or nil for none.`;
    const lead = game.trick.length === 0 ? "to lead" : "to play";
    return `${name(game.toPlay)} ${lead}.${game.spadesBroken ? " Spades are broken." : ""}`;
  },
  standing: (game, seat) => {
    const team = teamOf(seat);
    const bid = game.bids[seat];
    const contract = contractOf(game, team);
    // The partnership's tricks towards its contract, a nil's counting none, once both partners have bid.
    const together = game.tricks[team] * (game.bids[team] === NIL ? 0 : 1) + game.tricks[team + 2] * (game.bids[team + 2] === NIL ? 0 : 1);
    const pair = contract === null ? "" : `; the pair ${together} of ${contract}`;
    const deal = game.phase === "over" ? undefined : bid === null ? "to bid" : `bid ${bidWords(bid)}, took ${game.tricks[seat]}${pair}`;
    const bags = game.bags[team] === 0 ? "" : ` · ${game.bags[team]} ${game.bags[team] === 1 ? "bag" : "bags"}`;
    return { score: String(game.scores[team]), note: deal === undefined ? (bags === "" ? undefined : bags.slice(3)) : `${deal}${bags}` };
  },
  scoreWords: "Partnership points, across the table",
  Centre: SpadesCentre,
};

