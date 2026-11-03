"use client";

import { STACK_UP_RULES, STACK_UP_PILES, stackUpFits, stackUpWinners } from "@johnmorrisdotca/toranpu/stack-up";
import type { StackUpGame, StackUpMove } from "@johnmorrisdotca/toranpu/stack-up";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";

import type { CardAction, CardAdapter, CardCentreProps, CardHandViewProps } from "./cardTable.types";
import { StackUpFace, stackUpValue } from "./StackUpCard";
import { TableWords } from "./CardTableParts";

/** What a card is called to a reader: its number, or Wild. */
const cardWord = (card: string, say: Speaker): string => (card === "nw" ? say.say("ctable.stackUp.wild") : String(stackUpValue(card)));

/** A length in hundredths of the table's width. */
const cqw = (value: number) => `${value}cqw`;

const PILES = Array.from({ length: STACK_UP_PILES }, (_, at) => at);
const CARD_WIDTH = 11;
/** Where the four piles in a row stand, in hundredths of the table's width. */
const COLUMNS = [26, 40, 54, 68] as const;

/** One card lying on the table at a place, or an empty place where none lies. */
function Spot({ card, left, top, testId, say }: { card: string | null | undefined; left: number; top: number; testId: string; say: Speaker }) {
  return (
    <span className="absolute block" style={{ left: cqw(left), top: cqw(top), width: cqw(CARD_WIDTH) }} data-testid={testId} data-laid={card ?? "empty"}>
      <span className="block aspect-[5/7]">
        {card === undefined ? <span className="block h-full w-full rounded-[7%/5%] border-2 border-dashed border-[#2b1d0e]/40" /> : <StackUpFace card={card} label={card === null ? say.say("pcard.pile.faceDown") : cardWord(card, say)} />}
      </span>
    </span>
  );
}

/**
 * The table: the draw pile and the four building piles in a row across the top, each showing the card on top and how
 * many are in it; below them the stock pile of the seat at the table and its four discard piles, tops showing.
 */
function StackUpCentre({ game, viewer }: CardCentreProps<StackUpGame>) {
  const say = useSpeaker();
  const seat = viewer ?? game.toPlay ?? 0;
  const stock = game.stocks[seat] ?? [];
  return (
    <>
      <TableWords left={2} top={9} width={19} testId="stackup-draw">
        {say.say("ctable.stackUp.draw", { n: String(game.draw.length) })}
      </TableWords>
      {PILES.map((at) => {
        const pile = game.building[at] ?? [];
        const top = pile[pile.length - 1];
        return (
          <span key={at} data-testid="stackup-pile" data-pile={at} data-count={pile.length}>
            <Spot card={top} left={COLUMNS[at]!} top={3} testId={`stackup-pile-${at}`} say={say} />
            <TableWords left={COLUMNS[at]! - 2.5} top={21} width={CARD_WIDTH + 5}>
              {say.say("ctable.stackUp.pile", { n: String(at + 1) })} · {pile.length}
            </TableWords>
          </span>
        );
      })}
      <span data-testid="stackup-stock" data-count={stock.length}>
        <Spot card={stock[stock.length - 1]} left={6} top={26} testId="stackup-stock-top" say={say} />
        <TableWords left={2} top={44} width={19}>
          {say.say("ctable.stackUp.stockTop", { n: String(stock.length) })}
        </TableWords>
      </span>
      {PILES.map((at) => {
        const pile = game.discards[seat]?.[at] ?? [];
        return (
          <span key={at} data-testid="stackup-discard" data-pile={at} data-count={pile.length}>
            <Spot card={pile[pile.length - 1]} left={COLUMNS[at]!} top={26} testId={`stackup-discard-${at}`} say={say} />
            <TableWords left={COLUMNS[at]! - 2.5} top={44} width={CARD_WIDTH + 5}>
              {say.say("ctable.stackUp.discards", { n: String(at + 1) })}
              <br />
              {pile.length}
            </TableWords>
          </span>
        );
      })}
    </>
  );
}

/** A hand of Stack Up cards, in a row, tapped to choose one. */
function StackUpHand({ game, seat, chosen, onChoose, label }: CardHandViewProps<StackUpGame>) {
  const say = useSpeaker();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label} data-testid="stackup-hand" data-card-hand="">
      {(game.hands[seat] ?? []).map((card, at) => {
        const picked = chosen.includes(card);
        return (
          <button
            key={`${card}-${at}`}
            type="button"
            aria-pressed={picked}
            aria-label={cardWord(card, say)}
            data-card={card}
            data-testid="stackup-hand-card"
            onClick={() => onChoose(card)}
            className={`block w-14 shrink-0 select-none rounded-[7%/5%] shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-transform ${picked ? "ring-[3px] ring-moss -translate-y-1.5" : ""}`}
          >
            <span className="block aspect-[5/7]">
              <StackUpFace card={card} label="" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Every button the seat to play has: the chosen hand card on a pile or a discard pile, or, with none chosen, the stock and the discard tops on a pile, and a pass. */
function actionsFor(game: StackUpGame, chosen: readonly string[], say: Speaker): CardAction<StackUpMove>[] {
  const seat = game.toPlay;
  if (seat === null) return [];
  const actions: CardAction<StackUpMove>[] = [];
  const card = chosen[0];
  if (card !== undefined) {
    game.building.forEach((pile, to) => {
      if (stackUpFits(card, pile)) actions.push({ label: say.say("ctable.stackUp.playOn", { pile: String(to + 1) }), move: { play: card, from: "hand", to }, testId: `stackup-play-${to}`, strong: true });
    });
    PILES.forEach((to) => actions.push({ label: say.say("ctable.stackUp.discardOn", { pile: String(to + 1) }), move: { discard: card, to }, testId: `stackup-put-${to}` }));
    return actions;
  }
  const stock = game.stocks[seat] ?? [];
  const top = stock[stock.length - 1];
  game.building.forEach((pile, to) => {
    if (top !== undefined && stackUpFits(top, pile))
      actions.push({ label: say.say("ctable.stackUp.stockOn", { card: cardWord(top, say), pile: String(to + 1) }), move: { play: top, from: "stock", to }, testId: `stackup-stock-${to}`, strong: true });
    game.discards[seat]?.forEach((discard, from) => {
      const card = discard[discard.length - 1];
      if (card !== undefined && stackUpFits(card, pile))
        actions.push({ label: say.say("ctable.stackUp.discardPlay", { from: String(from + 1), card: cardWord(card, say), pile: String(to + 1) }), move: { play: card, from: "discard", pile: from, to }, testId: `stackup-lift-${from}-${to}` });
    });
  });
  if ((game.hands[seat] ?? []).length === 0) actions.push({ label: say.say("ctable.stackUp.pass"), move: { pass: true }, testId: "stackup-pass", strong: true });
  return actions;
}

/** Stack Up at the table: choose a card and press where it goes, or press the stock or a discard top onto a pile. */
export const STACK_UP_ADAPTER: CardAdapter<StackUpGame, StackUpMove> = {
  kind: "stackUp",
  rules: STACK_UP_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen, _target, _name, say) => actionsFor(game, chosen, say),
  quick: () => null,
  status: (game, _name, say) => (game.phase === "over" ? "" : say.say("ctable.stackUp.turnStatus")),
  ending: (game, name, say) => {
    const winners = stackUpWinners(game);
    if (game.ended === "emptied") return { line: say.say("ctable.stackUp.emptied", { name: name(winners[0] ?? 0) }), draw: false };
    return { line: say.say(winners.length > 1 ? "ctable.stackUp.stuckDraw" : "ctable.stackUp.stuck"), draw: winners.length > 1 };
  },
  standing: (game, seat, say) => ({ score: say.count("ctable.stackUp.cards", game.stocks[seat]?.length ?? 0) }),
  scoreWords: (say) => say.say("ctable.stackUp.scoreWords"),
  Centre: StackUpCentre,
  Hand: StackUpHand,
};
