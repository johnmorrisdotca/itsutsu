"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { NIL, SPADES_BIDS, contractOf, partnerOf, teamOf } from "@/lib/cardGames/spades/spades";
import { SPADES_RULES } from "@/lib/cardGames/spades/spadesRules";
import type { SpadesGame, SpadesMove } from "@/lib/cardGames/spades/spades.types";
import type { Speaker } from "@/lib/i18n/i18n";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

/** A bid in words: "nil", "4". */
const bidWords = (bid: number, say: Speaker) => (bid === NIL ? say.say("ctable.nil") : String(bid));

/**
 * THE TRICK ON THE TABLE, from the viewer's seat, as Hearts lays it: each card
 * where its player sits, theirs at the foot, and between tricks the last one
 * and who took it. While the bids go round, the table says what each seat has
 * bid so far.
 */
function SpadesCentre({ game, viewer, players }: CardCentreProps<SpadesGame>) {
  const say = useSpeaker();
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null && game.phase === "playing" ? game.lastTrick.winner : null;
  const bids = game.bids.flatMap((bid, seat) => (bid === null ? [] : [say.say("ctable.bidOf", { name: players[seat], bid: bidWords(bid, say) })]));
  return (
    <>
      {game.phase === "bidding" ? null : showing.map((play) => <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, 4)} testId="cards-trick-card" />)}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {say.say("ctable.tookTrick", { name: players[taken] })}
        </TableWords>
      )}
      {game.phase === "bidding" ? (
        <TableWords left={15} top={18} width={70} testId="cards-bids">
          {bids.length === 0 ? say.say("ctable.spades.bidTitle") : say.say("ctable.bidsLine", { bids: say.joined(bids) })}
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
  actions: (game, chosen, _target, _name, say) => {
    if (game.phase === "bidding") {
      return SPADES_BIDS.map((bid): CardAction<SpadesMove> => ({ label: bid === NIL ? say.say("ctable.nilButton") : String(bid), move: { bid }, testId: `cards-bid-${bid === NIL ? "nil" : bid}` }));
    }
    const move: SpadesMove | null = chosen.length === 1 ? { play: chosen[0] } : null;
    const ok = move !== null && SPADES_RULES.play(game, move) !== null;
    return [{ label: say.say("ctable.play"), move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? say.say("ctable.chooseCard") : say.say("ctable.spades.cannotPlay") }];
  },
  quick: (game, card) => {
    if (game.phase !== "playing") return null;
    const move: SpadesMove = { play: card };
    return SPADES_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.phase === "bidding") return say.say("ctable.spades.bidStatus", { name: name(game.toPlay), partner: name(partnerOf(game.toPlay)) });
    const key = game.trick.length === 0 ? (game.spadesBroken ? "ctable.spades.toLeadBroken" : "ctable.toLead") : game.spadesBroken ? "ctable.spades.toPlayBroken" : "ctable.toPlay";
    return say.say(key, { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => {
    const team = teamOf(seat);
    const bid = game.bids[seat];
    const contract = contractOf(game, team);
    // The partnership's tricks towards its contract, a nil's counting none, once both partners have bid.
    const together = game.tricks[team] * (game.bids[team] === NIL ? 0 : 1) + game.tricks[team + 2] * (game.bids[team + 2] === NIL ? 0 : 1);
    const pair = contract === null ? "" : say.say("ctable.spades.pair", { together: String(together), contract: String(contract) });
    const deal = game.phase === "over" ? undefined : bid === null ? say.say("ctable.toBidNote") : `${say.say("ctable.bidTook", { bid: bidWords(bid, say), took: String(game.tricks[seat]) })}${pair}`;
    const bags = game.bags[team] === 0 ? "" : say.count("ctable.spades.bags", game.bags[team]);
    const note = deal === undefined ? (bags === "" ? undefined : bags) : bags === "" ? deal : `${deal} · ${bags}`;
    return { score: String(game.scores[team]), note };
  },
  scoreWords: (say) => say.say("ctable.spades.scoreWords"),
  Centre: SpadesCentre,
};
