import type { WarGame, WarTurn } from "@johnmorrisdotca/toranpu/war";

import type { Speaker } from "../../i18n/i18n";
import { cardNamed, ranksNamed } from "../cardSay";
import { rankOf } from "../cards";
import type { CardId } from "../cardGames.types";

/*
 * WHAT WAR SAYS AT THE TABLE, in words: what the last turn laid and who took
 * it, and how a game ended. Pure, so the words are tested without a screen.
 */

/** What one seat laid in a turn: the card turned up first (the tie, in a war), how many lay face down, and the card turned up last. */
export function laidBy(last: WarTurn, seat: number): { first: CardId | null; down: number; final: CardId | null } {
  const mine = last.laid.filter((one) => one.seat === seat);
  const up = mine.filter((one) => !one.down);
  return { first: up[0]?.card ?? null, down: mine.length - up.length, final: up.length > 1 ? up[up.length - 1].card : null };
}

/** The last turn in a line: what each turned over, and who took the cards. */
export function warWords(game: WarGame, name: (seat: number) => string, say: Speaker): string {
  const last = game.last;
  if (last === null) return say.say("ctable.war.begin");
  const [one, two] = [laidBy(last, 0), laidBy(last, 1)];
  const seen = (cards: ReturnType<typeof laidBy>) => cards.final ?? cards.first;
  if (last.wars === 0) {
    const [a, b] = [one.first, two.first];
    if (a === null || b === null) return "";
    const turned = { a: name(0), ca: cardNamed(a, say), b: name(1), cb: cardNamed(b, say) };
    return last.winner === null ? say.say("ctable.war.turned", turned) : say.say("ctable.war.turnedTakes", { ...turned, winner: name(last.winner) });
  }
  const tied = one.first === null ? "" : say.say("ctable.war.tied", { rank: ranksNamed(rankOf(one.first), say) });
  const [a, b] = [seen(one), seen(two)];
  if (a === null || b === null || last.winner === null) return say.sentences([tied, say.say("ctable.war.neither")].filter((part) => part !== ""));
  const rest = say.say("ctable.war.takesAll", { a: name(0), ca: cardNamed(a, say), b: name(1), cb: cardNamed(b, say), winner: name(last.winner), count: String(last.laid.length) });
  return say.sentences([tied, rest].filter((part) => part !== ""));
}

/** How the game ended, in a line, and whether it was a draw: nobody can call level piles a win. */
export function warEnding(game: WarGame, name: (seat: number) => string, say: Speaker): { line: string; draw: boolean } {
  const [more, other] = game.hands[0].length >= game.hands[1].length ? [0, 1] : [1, 0];
  const draw = game.hands[0].length === game.hands[1].length && game.ended !== "cleared";
  if (game.ended === "cleared") return { line: say.say("ctable.war.holdsAll", { name: name(more) }), draw: false };
  if (game.ended === "short") return { line: say.say("ctable.war.short", { loser: name(other), winner: name(more) }), draw };
  if (game.ended === "drawn") return { line: say.say("ctable.war.drawnWar"), draw: true };
  return {
    line: draw ? say.say("ctable.war.turnsDraw", { count: String(game.hands[0].length) }) : say.say("ctable.war.turnsMore", { name: name(more) }),
    draw,
  };
}
