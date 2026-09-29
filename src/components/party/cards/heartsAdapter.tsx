"use client";

import { HEARTS_RULES } from "@/lib/cardGames/hearts/heartsRules";
import { passOffset } from "@/lib/cardGames/hearts/hearts";
import type { HeartsGame, HeartsMove } from "@/lib/cardGames/hearts/hearts.types";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

/** Where this deal's three cards go, in words: "to the left", "across", or nowhere. */
function passWords(game: HeartsGame): string {
  const seats = game.players.length;
  const offset = passOffset(game.deal, seats);
  if (offset === 0) return "nowhere: this deal keeps them";
  if (offset === 1) return "to the left";
  if (offset === seats - 1) return "to the right";
  return "across";
}

/**
 * THE TRICK ON THE TABLE, from the viewer's seat: each card where its player
 * sits, theirs at the foot. Between tricks, the last one stays in place and
 * says who took it, until the next card is played.
 */
function HeartsCentre({ game, viewer, players }: CardCentreProps<HeartsGame>) {
  const seats = game.players.length;
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null ? game.lastTrick.winner : null;
  return (
    <>
      {showing.map((play) => (
        <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, seats)} testId="cards-trick-card" />
      ))}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {players[taken]} took the trick
        </TableWords>
      )}
      {game.phase === "passing" ? (
        <TableWords left={20} top={21} width={60}>
          Passing three cards {passWords(game)}
        </TableWords>
      ) : null}
    </>
  );
}

/** Hearts at the table: three cards passed, then one played a trick. */
export const HEARTS_ADAPTER: CardAdapter<HeartsGame, HeartsMove> = {
  kind: "hearts",
  rules: HEARTS_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: (game) => (game.phase === "passing" ? 3 : 1),
  actions: (game, chosen) => {
    if (game.phase === "passing") {
      const move: HeartsMove = { pass: [...chosen] };
      const ok = chosen.length === 3 && HEARTS_RULES.play(game, move) !== null;
      return [{ label: `Pass three ${passWords(game)}`, move: ok ? move : null, testId: "cards-pass", strong: true, why: `Choose three cards to pass (${chosen.length} chosen).` }];
    }
    const move: HeartsMove | null = chosen.length === 1 ? { play: chosen[0] } : null;
    const ok = move !== null && HEARTS_RULES.play(game, move) !== null;
    return [{ label: "Play", move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? "Choose a card to play." : "That card cannot be played now: follow the suit led if you can." }];
  },
  quick: (game, card) => {
    if (game.phase !== "playing") return null;
    const move: HeartsMove = { play: card };
    return HEARTS_RULES.play(game, move) === null ? null : move;
  },
  // The three cards passed in, marked until the first trick of the deal is taken.
  arrived: (game, seat) => (game.phase === "playing" && game.lastTrick === null ? (game.received[seat] ?? []) : []),
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.phase === "passing") return `${name(game.toPlay)}: choose three cards to pass ${passWords(game)}.`;
    const lead = game.trick.length === 0 ? "to lead" : "to play";
    return `${name(game.toPlay)} ${lead}.${game.heartsBroken ? " Hearts are broken." : ""}`;
  },
  standing: (game, seat) => ({ score: String(game.scores[seat]), note: game.phase === "over" ? undefined : `${game.points[seat]} this deal` }),
  scoreWords: "Points, fewest wins",
  Centre: HeartsCentre,
};
