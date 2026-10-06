"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { suitNamed } from "@/lib/cardGames/cardSay";
import type { CardSuit } from "@/lib/cardGames/cardGames.types";
import { dealerOf, ohHellBids } from "@/lib/cardGames/ohHell/ohHell";
import { OH_HELL_RULES } from "@/lib/cardGames/ohHell/ohHellRules";
import type { OhHellGame, OhHellMove } from "@/lib/cardGames/ohHell/ohHell.types";
import type { Speaker } from "@/lib/i18n/i18n";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

/** Trumps in words, as the table writes them: "Clubs are trumps", or クラブが切り札です. */
function trumpWords(trump: CardSuit, say: Speaker): string {
  const suit = suitNamed(trump, say);
  return say.say("ctable.ohhell.trumps", { suit: say.locale === "ja" ? suit : `${suit[0].toUpperCase()}${suit.slice(1)}` });
}

/**
 * THE TABLE: the turned card in the corner, which names trumps; while the
 * bids go round, what each seat has bid and how many tricks there are; then
 * the trick, from the viewer's seat as Hearts lays it, and between tricks
 * the last one and who took it.
 */
function OhHellCentre({ game, viewer, players }: CardCentreProps<OhHellGame>) {
  const say = useSpeaker();
  const seats = game.players.length;
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null && game.phase === "playing" ? game.lastTrick.winner : null;
  const bids = game.bids.flatMap((bid, seat) => (bid === null ? [] : [say.say("ctable.bidOf", { name: players[seat], bid: String(bid) })]));
  return (
    <>
      <LaidCard card={game.turned} left={2} top={2} width={9} testId="cards-turned" />
      <TableWords left={0} top={16} width={14} testId="cards-trumps">
        {trumpWords(game.trump as CardSuit, say)}
      </TableWords>
      {game.phase === "bidding" ? (
        <TableWords left={18} top={18} width={64} testId="cards-bids">
          {bids.length === 0 ? say.count("ctable.ohhell.bidTitle", game.cards) : say.count("ctable.ohhell.bidsLine", game.cards, { bids: say.joined(bids) })}
        </TableWords>
      ) : (
        showing.map((play) => <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, seats)} testId="cards-trick-card" />)
      )}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {say.say("ctable.tookTrick", { name: players[taken] })}
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
  actions: (game, chosen, _target, _name, say) => {
    if (game.phase === "bidding") return ohHellBids(game).map((bid): CardAction<OhHellMove> => ({ label: String(bid), move: { bid }, testId: `cards-bid-${bid}` }));
    const move: OhHellMove | null = chosen.length === 1 ? { play: chosen[0] } : null;
    const ok = move !== null && OH_HELL_RULES.play(game, move) !== null;
    return [{ label: say.say("ctable.play"), move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? say.say("ctable.chooseCard") : say.say("ctable.ohhell.cannotPlay") }];
  },
  quick: (game, card) => {
    if (game.phase !== "playing") return null;
    const move: OhHellMove = { play: card };
    return OH_HELL_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.phase === "bidding") {
      const dealer = game.toPlay === dealerOf(game.deal, game.players.length);
      const others = game.bids.reduce<number>((sum, bid) => sum + (bid ?? 0), 0);
      const barred = game.cards - others;
      return dealer && barred >= 0 ? say.say("ctable.ohhell.dealerBids", { name: name(game.toPlay), barred: String(barred) }) : say.say("ctable.ohhell.toBid", { name: name(game.toPlay), cards: String(game.cards) });
    }
    return say.say(game.trick.length === 0 ? "ctable.toLead" : "ctable.toPlay", { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => {
    const bid = game.bids[seat];
    const note =
      game.phase === "over"
        ? undefined
        : bid === null
          ? seat === dealerOf(game.deal, game.players.length)
            ? say.say("ctable.dealerNote")
            : say.say("ctable.toBidNote")
          : say.say("ctable.bidTook", { bid: String(bid), took: String(game.tricks[seat]) });
    return { score: String(game.scores[seat]), note };
  },
  scoreWords: (say) => say.say("ctable.pointsMost"),
  Centre: OhHellCentre,
};
