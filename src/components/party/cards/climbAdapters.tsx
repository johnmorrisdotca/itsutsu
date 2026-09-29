"use client";

import { BIG_TWO_RULES } from "@/lib/cardGames/bigTwo/bigTwoRules";
import type { BigTwoGame } from "@/lib/cardGames/bigTwo/bigTwo.types";
import { cardWords } from "@/lib/cardGames/cards";
import type { CardId } from "@/lib/cardGames/cardGames.types";
import type { ClimbMove, ClimbTrick } from "@/lib/cardGames/climbing/climbing.types";
import { presidentTitle } from "@/lib/cardGames/president/president";
import { PRESIDENT_RULES } from "@/lib/cardGames/president/presidentRules";
import type { PresidentGame, PresidentMove } from "@/lib/cardGames/president/president.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

const TITLE_WORDS = { president: "President", vicePresident: "Vice-President", citizen: "Citizen", viceBeggar: "Vice-Beggar", beggar: "Beggar" } as const;

/**
 * THE PLAY TO BEAT, in the middle of the table: its cards side by side and who
 * laid them; and under it who has passed on this trick, since a pass holds
 * until the trick is over. An empty middle is a lead: anything goes.
 */
function ClimbCentre({ game, players }: CardCentreProps<ClimbTrick>) {
  const cards = game.pile?.cards ?? [];
  const width = 13;
  const step = cards.length > 1 ? Math.min(width * 0.62, (60 - width) / (cards.length - 1)) : 0;
  const left = 50 - (width + step * (cards.length - 1)) / 2;
  const passed = game.passed.flatMap((did, seat) => (did ? [players[seat]] : []));
  return (
    <>
      {game.pile === null ? (
        <TableWords left={20} top={20} width={60} testId="cards-pile-empty">
          {game.toPlay === null ? "" : `${players[game.toPlay]} leads: any play goes`}
        </TableWords>
      ) : (
        <>
          {cards.map((card, at) => (
            <LaidCard key={card} card={card} left={left + step * at} top={8} width={width} testId="cards-pile-card" />
          ))}
          <TableWords left={20} top={28} width={60}>
            {players[game.pile.seat]} played
          </TableWords>
        </>
      )}
      {passed.length === 0 ? null : (
        <TableWords left={10} top={38} width={80} testId="cards-passed">
          Passed: {passed.join(", ")}
        </TableWords>
      )}
    </>
  );
}

/** Play the cards chosen, or pass: the presses a climbing game offers the player to move. */
function climbActions<S extends ClimbTrick, M>(game: S, chosen: readonly CardId[], play: (game: S, move: M) => S | null, moves: readonly M[]): CardAction<M>[] {
  const move = { play: [...chosen] } as M;
  const ok = chosen.length > 0 && play(game, move) !== null;
  const actions: CardAction<M>[] = [
    { label: chosen.length > 1 ? `Play ${chosen.length} cards` : "Play", move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? "Choose the cards to play." : "Those cards do not beat the play on the table." },
  ];
  const pass = moves.find((one) => "pass" in (one as object));
  if (pass !== undefined) actions.push({ label: "Pass", move: pass, testId: "cards-pass" });
  return actions;
}

/** A double tap: the card on its own, or with the others chosen of its rank, if that beats the table. */
function climbQuick<S extends ClimbTrick, M>(game: S, card: CardId, chosen: readonly CardId[], play: (game: S, move: M) => S | null): M | null {
  const cards = chosen.includes(card) ? [...chosen] : [card];
  const move = { play: cards } as M;
  return play(game, move) === null ? null : move;
}

export const BIG_TWO_ADAPTER: CardAdapter<BigTwoGame, ClimbMove> = {
  kind: "bigTwo",
  rules: BIG_TWO_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 5,
  actions: (game, chosen) => climbActions(game, chosen, BIG_TWO_RULES.play, BIG_TWO_RULES.moves(game)),
  quick: (game, card, chosen) => climbQuick(game, card, chosen, BIG_TWO_RULES.play),
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.opening !== null) return `${name(game.toPlay)} leads, and the play must include the ${cardWords(game.opening)}.`;
    return game.pile === null ? `${name(game.toPlay)} leads: any single, pair, three or five-card hand.` : `${name(game.toPlay)} to beat it, or pass.`;
  },
  standing: (game, seat) => ({ score: String(game.penalties[seat]), note: `deal ${Math.min(game.deals.length + 1, game.size)} of ${game.size}` }),
  scoreWords: "Penalty points, fewest wins",
  Centre: ClimbCentre,
};

export const PRESIDENT_ADAPTER: CardAdapter<PresidentGame, PresidentMove> = {
  kind: "president",
  rules: PRESIDENT_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: (game) => (game.phase === "exchange" ? (game.owed[0]?.count ?? 1) : 4),
  actions: (game, chosen) => {
    if (game.phase === "exchange") {
      const owed = game.owed[0];
      const move: PresidentMove = { give: [...chosen] };
      const ok = owed !== undefined && chosen.length === owed.count && PRESIDENT_RULES.play(game, move) !== null;
      return [{ label: `Give ${owed?.count ?? 1}`, move: ok ? move : null, testId: "cards-give", strong: true, why: `Choose ${owed?.count === 1 ? "one card" : `${owed?.count} cards`} to give back.` }];
    }
    return climbActions<PresidentGame, PresidentMove>(game, chosen, PRESIDENT_RULES.play, PRESIDENT_RULES.moves(game));
  },
  quick: (game, card, chosen) => (game.phase === "playing" ? climbQuick<PresidentGame, PresidentMove>(game, card, chosen, PRESIDENT_RULES.play) : null),
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.phase === "exchange") {
      const owed = game.owed[0];
      return `${name(game.toPlay)}: give ${owed.count === 1 ? "a card" : `${owed.count} cards`} of your choosing back to ${name(owed.to)}.`;
    }
    return game.pile === null ? `${name(game.toPlay)} leads: one card, or two, three or four of a rank.` : `${name(game.toPlay)} to beat it, or pass.`;
  },
  standing: (game, seat) => ({
    score: String(game.scores[seat]),
    note: game.titles === null ? undefined : TITLE_WORDS[presidentTitle(game.titles, seat)],
  }),
  scoreWords: "Points, most wins",
  Centre: ClimbCentre as CardAdapter<PresidentGame, PresidentMove>["Centre"],
};
