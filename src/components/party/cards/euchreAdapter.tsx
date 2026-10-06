"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { cardNamed, suitNamed } from "@/lib/cardGames/cardSay";
import type { CardSuit } from "@/lib/cardGames/cardGames.types";
import { dealerOf, partnerOf, teamOf } from "@/lib/cardGames/euchre/euchre";
import { EUCHRE_RULES } from "@/lib/cardGames/euchre/euchreRules";
import type { EuchreGame, EuchreMove } from "@/lib/cardGames/euchre/euchre.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

const SUIT_SIGNS: Record<CardSuit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

/**
 * THE TABLE: while trumps are being made, the card turned up in the middle
 * (turned down once everybody has passed it); then the trick, from the
 * viewer's seat as Hearts and Spades lay it, and which suit is trumps and who
 * made them.
 */
function EuchreCentre({ game, viewer, players }: CardCentreProps<EuchreGame>) {
  const say = useSpeaker();
  if (game.phase === "order" || game.phase === "call") {
    return (
      <>
        <LaidCard card={game.phase === "order" ? game.upcard : null} left={43.5} top={8} testId="cards-upcard" />
        <TableWords left={15} top={30} width={70} testId="cards-making">
          {game.phase === "order"
            ? say.say("ctable.euchre.orderUpQuestion", { name: players[dealerOf(game.deal)], card: cardNamed(game.upcard, say) })
            : say.say("ctable.euchre.turnedDown", { card: cardNamed(game.upcard, say) })}
        </TableWords>
      </>
    );
  }
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null && game.phase === "playing" ? game.lastTrick.winner : null;
  return (
    <>
      {showing.map((play) => (
        <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, 4)} testId="cards-trick-card" />
      ))}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {say.say("ctable.tookTrick", { name: players[taken] })}
        </TableWords>
      )}
      {game.trump === null || game.maker === null ? null : (
        <TableWords left={1} top={1} width={42} testId="cards-trumps">
          {SUIT_SIGNS[game.trump]} {say.say("ctable.euchre.trumpsBy", { suit: suitNamed(game.trump, say), name: players[game.maker] })}
        </TableWords>
      )}
    </>
  );
}

/** Euchre at the table: the making of trumps, the dealer's discard, then one card played a trick. */
export const EUCHRE_ADAPTER: CardAdapter<EuchreGame, EuchreMove> = {
  kind: "euchre",
  rules: EUCHRE_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen, _target, _name, say) => {
    const dealer = dealerOf(game.deal);
    if (game.phase === "order") {
      const card = cardNamed(game.upcard, say);
      const up = say.say(game.toPlay === dealer ? "ctable.euchre.pickUp" : "ctable.euchre.orderUp", { card });
      return [
        { label: up, move: { order: true }, testId: "cards-order" },
        { label: say.say("ctable.pass"), move: { pass: true }, testId: "cards-pass" },
      ];
    }
    if (game.phase === "call") {
      const calls = EUCHRE_RULES.moves(game).flatMap((move): CardAction<EuchreMove>[] => ("call" in move ? [{ label: say.say("ctable.euchre.call", { sign: SUIT_SIGNS[move.call], suit: suitNamed(move.call, say) }), move, testId: `cards-call-${move.call}` }] : []));
      return game.toPlay === dealer ? calls : [...calls, { label: say.say("ctable.pass"), move: { pass: true }, testId: "cards-pass" }];
    }
    const card = chosen.length === 1 ? chosen[0] : null;
    if (game.phase === "discard") {
      return [{ label: say.say("ctable.euchre.throw"), move: card === null ? null : { discard: card }, testId: "cards-discard-card", strong: true, why: say.say("ctable.euchre.throwWhy") }];
    }
    const move: EuchreMove | null = card === null ? null : { play: card };
    const ok = move !== null && EUCHRE_RULES.play(game, move) !== null;
    return [{ label: say.say("ctable.play"), move: ok ? move : null, testId: "cards-play", strong: true, why: card === null ? say.say("ctable.chooseCard") : say.say("ctable.euchre.cannotPlay") }];
  },
  quick: (game, card) => {
    if (game.phase === "discard") return { discard: card };
    if (game.phase !== "playing") return null;
    const move: EuchreMove = { play: card };
    return EUCHRE_RULES.play(game, move) === null ? null : move;
  },
  // The turned card the dealer has just picked up, marked until one is thrown away.
  arrived: (game, seat) => (game.phase === "discard" && seat === dealerOf(game.deal) ? [game.upcard] : []),
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    const who = say.say("ctable.euchre.who", { name: name(game.toPlay), partner: name(partnerOf(game.toPlay)) });
    if (game.phase === "order") return say.say("ctable.euchre.orderStatus", { who, card: cardNamed(game.upcard, say) });
    if (game.phase === "call") return game.toPlay === dealerOf(game.deal) ? say.say("ctable.euchre.mustName", { name: name(game.toPlay) }) : say.say("ctable.euchre.nameTrumps", { who });
    if (game.phase === "discard") return say.say("ctable.euchre.pickedUp", { name: name(game.toPlay), card: cardNamed(game.upcard, say) });
    return say.say(game.trick.length === 0 ? "ctable.toLead" : "ctable.toPlay", { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => {
    const team = teamOf(seat);
    const together = game.tricks[team] + game.tricks[team + 2];
    const making = game.maker !== null && teamOf(game.maker) === team;
    const vars = { took: String(game.tricks[seat]), together: String(together) };
    return {
      score: String(game.scores[team]),
      note: game.phase === "playing" ? say.say(making ? "ctable.euchre.noteMaking" : "ctable.euchre.note", vars) : seat === dealerOf(game.deal) && game.phase !== "over" ? say.say("ctable.dealerNote") : undefined,
    };
  },
  scoreWords: (say) => say.say("ctable.euchre.scoreWords"),
  Centre: EuchreCentre,
};
