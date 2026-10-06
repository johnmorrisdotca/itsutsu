"use client";

import type { ComponentType } from "react";

import { BIG_TWO_RULES } from "@/lib/cardGames/bigTwo/bigTwoRules";
import type { BigTwoGame } from "@/lib/cardGames/bigTwo/bigTwo.types";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { cardNamed } from "@/lib/cardGames/cardSay";
import type { Speaker } from "@/lib/i18n/i18n";
import type { CardId } from "@/lib/cardGames/cardGames.types";
import type { ClimbMove, ClimbTrick } from "@/lib/cardGames/climbing/climbing.types";
import { presidentTitle } from "@/lib/cardGames/president/president";
import { PRESIDENT_RULES } from "@/lib/cardGames/president/presidentRules";
import type { PresidentGame, PresidentMove } from "@/lib/cardGames/president/president.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

const TITLE_WORDS = { president: "ctable.climb.titlePresident", vicePresident: "ctable.climb.titleVice", citizen: "ctable.climb.titleCitizen", viceBeggar: "ctable.climb.titleViceBeggar", beggar: "ctable.climb.titleBeggar" } as const;

/**
 * THE PLAY TO BEAT, in the middle of the table: its cards side by side and who
 * laid them; and under it who has passed on this trick, since a pass holds
 * until the trick is over. An empty middle is a lead: anything goes.
 */
function ClimbCentre({ game, players }: CardCentreProps<ClimbTrick>) {
  const say = useSpeaker();
  const cards = game.pile?.cards ?? [];
  const width = 13;
  const step = cards.length > 1 ? Math.min(width * 0.62, (60 - width) / (cards.length - 1)) : 0;
  const left = 50 - (width + step * (cards.length - 1)) / 2;
  const passed = game.passed.flatMap((did, seat) => (did ? [players[seat]] : []));
  return (
    <>
      {game.pile === null ? (
        <TableWords left={20} top={20} width={60} testId="cards-pile-empty">
          {game.toPlay === null ? "" : say.say("ctable.climb.leadAny", { name: players[game.toPlay] })}
        </TableWords>
      ) : (
        <>
          {cards.map((card, at) => (
            <LaidCard key={card} card={card} left={left + step * at} top={8} width={width} testId="cards-pile-card" />
          ))}
          <TableWords left={20} top={28} width={60}>
            {say.say("ctable.climb.laidBy", { name: players[game.pile.seat] })}
          </TableWords>
        </>
      )}
      {passed.length === 0 ? null : (
        <TableWords left={10} top={38} width={80} testId="cards-passed">
          {say.say("ctable.climb.passed", { names: say.joined(passed) })}
        </TableWords>
      )}
    </>
  );
}

/** Play the cards chosen, or pass: the presses a climbing game offers the player to move. */
function climbActions<S extends ClimbTrick, M>(game: S, chosen: readonly CardId[], play: (game: S, move: M) => S | null, moves: readonly M[], say: Speaker): CardAction<M>[] {
  const move = { play: [...chosen] } as M;
  const ok = chosen.length > 0 && play(game, move) !== null;
  const actions: CardAction<M>[] = [
    { label: chosen.length > 1 ? say.say("ctable.playCount", { count: String(chosen.length) }) : say.say("ctable.play"), move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? say.say("ctable.chooseCards") : say.say("ctable.noBeat") },
  ];
  const pass = moves.find((one) => "pass" in (one as object));
  if (pass !== undefined) actions.push({ label: say.say("ctable.pass"), move: pass, testId: "cards-pass" });
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
  actions: (game, chosen, _target, _name, say) => climbActions(game, chosen, BIG_TWO_RULES.play, BIG_TWO_RULES.moves(game), say),
  quick: (game, card, chosen) => climbQuick(game, card, chosen, BIG_TWO_RULES.play),
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.opening !== null) return say.say("ctable.climb.openingCard", { name: name(game.toPlay), card: cardNamed(game.opening, say) });
    return game.pile === null ? say.say("ctable.climb.leadBigTwo", { name: name(game.toPlay) }) : say.say("ctable.climb.beat", { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => ({ score: String(game.penalties[seat]), note: say.say("ctable.climb.deal", { n: String(Math.min(game.deals.length + 1, game.size)), total: String(game.size) }) }),
  scoreWords: (say) => say.say("ctable.climb.bigTwoScoreWords"),
  Centre: ClimbCentre,
};

export const PRESIDENT_ADAPTER: CardAdapter<PresidentGame, PresidentMove> = {
  kind: "president",
  rules: PRESIDENT_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: (game) => (game.phase === "exchange" ? (game.owed[0]?.count ?? 1) : 4),
  actions: (game, chosen, _target, _name, say) => {
    if (game.phase === "exchange") {
      const owed = game.owed[0];
      const move: PresidentMove = { give: [...chosen] };
      const ok = owed !== undefined && chosen.length === owed.count && PRESIDENT_RULES.play(game, move) !== null;
      return [{ label: say.say("ctable.climb.give", { count: String(owed?.count ?? 1) }), move: ok ? move : null, testId: "cards-give", strong: true, why: say.count("ctable.climb.giveWhy", owed?.count ?? 1) }];
    }
    return climbActions<PresidentGame, PresidentMove>(game, chosen, PRESIDENT_RULES.play, PRESIDENT_RULES.moves(game), say);
  },
  quick: (game, card, chosen) => (game.phase === "playing" ? climbQuick<PresidentGame, PresidentMove>(game, card, chosen, PRESIDENT_RULES.play) : null),
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.phase === "exchange") {
      const owed = game.owed[0];
      return say.count("ctable.climb.giveStatus", owed.count, { name: name(game.toPlay), to: name(owed.to) });
    }
    return game.pile === null ? say.say("ctable.climb.leadPresident", { name: name(game.toPlay) }) : say.say("ctable.climb.beat", { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => ({
    score: String(game.scores[seat]),
    note: game.titles === null ? undefined : say.say(TITLE_WORDS[presidentTitle(game.titles, seat)]),
  }),
  scoreWords: (say) => say.say("ctable.pointsMost"),
  Centre: ClimbCentre as ComponentType<CardCentreProps<PresidentGame>>,
};
