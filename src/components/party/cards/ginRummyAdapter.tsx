"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { cardNamed } from "@/lib/cardGames/cardSay";
import type { Speaker } from "@/lib/i18n/i18n";
import { GIN_RUMMY_RULES } from "@/lib/cardGames/ginRummy/ginRummyRules";
import { canKnockWith, deadwoodIn, deadwoodOf } from "@/lib/cardGames/ginRummy/ginRummy";
import type { GinGame, GinMove, GinResult } from "@/lib/cardGames/ginRummy/ginRummy.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

/** How the last hand ended, in a line: "Ann knocked and took 12", "Ben went gin for 41", "Drawn: the stock ran out". */
function resultWords(result: GinResult, name: (seat: number) => string, say: Speaker): string {
  if (result.kind === "drawn") return say.say("ctable.gin.drawn");
  const knocker = name(result.knocker!);
  const points = String(result.points);
  if (result.kind === "gin") return say.say("ctable.gin.went", { name: knocker, points });
  if (result.kind === "undercut") return say.say("ctable.gin.undercut", { name: knocker, winner: name(result.winner!), points });
  return say.say("ctable.gin.knocked", { name: knocker, points });
}

/** Whether a new hand has just been dealt after one that ended, and not both players have thrown in it yet: each sees how the last was laid down. */
function freshHand(game: GinGame): boolean {
  return game.results.length > 0 && game.throws < 2;
}

/** One seat's hand laid down at the end of the last hand: its melds, then its deadwood, in a row of small cards. */
function LaidHand({ result, seat, top, name }: { result: GinResult; seat: number; top: number; name: string }) {
  const layout = result.layouts[seat];
  const cards = [...layout.melds.flat(), ...layout.deadwood];
  const width = 6.2;
  const step = Math.min(width * 0.95, 70 / Math.max(1, cards.length));
  return (
    <>
      <TableWords left={1} top={top + 3} width={18}>
        {name} · {deadwoodOf(layout.deadwood)}
      </TableWords>
      {cards.map((card, at) => (
        <LaidCard key={card} card={card} left={20 + step * at + (at >= layout.melds.flat().length ? 2 : 0)} top={top} width={width} testId="cards-laid-down" />
      ))}
    </>
  );
}

/**
 * THE STOCK AND THE DISCARD PILE, side by side, and under them the deadwood in
 * the viewer's hand at its best. Just after a hand ends, until both players
 * have thrown a card in the next, the table shows how the last one was laid
 * down instead: both hands, melds first (a card laid off among the melds it
 * went onto), and who scored.
 */
function GinCentre({ game, viewer, players }: CardCentreProps<GinGame>) {
  const say = useSpeaker();
  const last = game.results.at(-1);
  if (last !== undefined && (freshHand(game) || game.phase === "over")) {
    return (
      <>
        <TableWords left={5} top={2} width={90} testId="cards-gin-result">
          {resultWords(last, (seat) => players[seat] ?? "", say)}
        </TableWords>
        <LaidHand result={last} seat={0} top={10} name={players[0] ?? ""} />
        <LaidHand result={last} seat={1} top={29} name={players[1] ?? ""} />
      </>
    );
  }
  const top = game.discard.at(-1) ?? null;
  const mine = viewer === null ? null : game.hands[viewer];
  return (
    <>
      {game.stock.length === 0 ? null : <LaidCard card={null} left={30} top={6} testId="cards-stock" />}
      <TableWords left={22} top={29} width={30}>
        {say.say("ctable.stock", { count: String(game.stock.length) })}
      </TableWords>
      {top === null ? null : <LaidCard card={top} left={55} top={6} testId="cards-discard" />}
      {mine === null || mine.length !== 10 ? null : (
        <TableWords left={25} top={37} width={50} testId="cards-deadwood">
          {say.say("ctable.gin.deadwood", { points: String(deadwoodIn(mine)) })}
        </TableWords>
      )}
    </>
  );
}

/** Gin Rummy at the table: draw from the stock or take the discard, then throw a card or knock with it. */
export const GIN_RUMMY_ADAPTER: CardAdapter<GinGame, GinMove> = {
  kind: "ginRummy",
  rules: GIN_RUMMY_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen, _target, _name, say) => {
    if (game.phase === "draw") {
      const top = game.discard.at(-1);
      const actions: CardAction<GinMove>[] = [{ label: say.say("ctable.gin.drawStock"), move: { draw: "stock" }, testId: "cards-draw-stock", strong: true }];
      if (top !== undefined) actions.push({ label: say.say("ctable.gin.take", { card: cardNamed(top, say) }), move: { draw: "discard" }, testId: "cards-take" });
      return actions;
    }
    const card = chosen.length === 1 ? chosen[0] : null;
    const hand = game.toPlay === null ? [] : game.hands[game.toPlay];
    const throwable = card !== null && card !== game.taken;
    const knockable = throwable && canKnockWith(hand, card);
    const gin = knockable && deadwoodIn(hand.filter((held) => held !== card)) === 0;
    return [
      {
        label: say.say("ctable.gin.throw"),
        move: throwable ? { discard: card } : null,
        testId: "cards-discard-card",
        strong: !knockable,
        why: card === null ? say.say("ctable.gin.throwWhy") : say.say("ctable.gin.noBack"),
      },
      { label: say.say(gin ? "ctable.gin.ginButton" : "ctable.gin.knock"), move: knockable ? { knock: card } : null, testId: "cards-knock", strong: knockable },
    ];
  },
  quick: (game, card) => {
    if (game.phase !== "discard" || card === game.taken) return null;
    return { discard: card };
  },
  // The card just taken from the pile, marked in the hand until it is thrown or the turn ends.
  arrived: (game, seat) => (game.toPlay === seat && game.taken !== null ? [game.taken] : []),
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.phase === "draw") return say.say("ctable.gin.drawStatus", { name: name(game.toPlay) });
    return say.say("ctable.gin.throwStatus", { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => {
    const picked = game.picked[seat] ?? [];
    return { score: String(game.scores[seat]), note: game.phase === "over" || picked.length === 0 ? undefined : say.say("ctable.gin.took", { cards: say.joined(picked.map((card) => cardNamed(card, say))) }) };
  },
  scoreWords: (say) => say.say("ctable.pointsMost"),
  Centre: GinCentre,
};
