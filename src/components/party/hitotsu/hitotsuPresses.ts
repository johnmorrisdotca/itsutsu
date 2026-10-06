import { HITOTSU_COLOUR_LOOK, colourWords, movesFor, waysFor, type HitotsuCard, type HitotsuGame, type HitotsuMove } from "@johnmorrisdotca/hitotsu";

import { hitotsuScreenWords } from "@/components/party/partyWords";
import type { Speaker } from "@/lib/i18n/i18n";

/** The language the package is asked for: Japanese for a reader of Japanese, English for anyone else. */
export const hitotsuLanguage = (say: Speaker): "en" | "ja" => (say.locale === "ja" ? "ja" : "en");

export { callMatters, movesFor, playableFor, quickMove } from "@johnmorrisdotca/hitotsu";

/** A press the player may make: its words, the move (null while it cannot be made), and why not. */
export type HitotsuPress = { label: string; move: HitotsuMove | null; testId: string; strong?: boolean; why?: string; colour?: string };

/**
 * THE PRESSES UNDER A HAND, with this card chosen: Play (or Jump in), one per
 * colour for a wild, one per player for a seven that swaps; then Draw, Keep
 * it, Pass, Take, Challenge — whichever the rules offer now.
 */
export function hitotsuPresses(game: HitotsuGame, seat: number, chosen: HitotsuCard | null, call: boolean, name: (seat: number) => string, say: Speaker): HitotsuPress[] {
  const HITOTSU_COPY = hitotsuScreenWords(say.locale);
  const moves = movesFor(game, seat);
  if (moves.length === 0) return [];
  const mine = game.toPlay === seat;
  const presses: HitotsuPress[] = [];
  const ways = chosen === null ? [] : waysFor(game, seat, chosen, call);
  const jumping = !mine;
  if (ways.some((way) => way.colour !== undefined)) {
    for (const way of ways) {
      const colour = way.colour!;
      presses.push({ label: HITOTSU_COPY.callColour(colourWords(colour, hitotsuLanguage(say))), move: way, testId: `hitotsu-colour-${colour}`, strong: true, colour: HITOTSU_COLOUR_LOOK[colour].fill });
    }
  } else if (ways.some((way) => way.swap !== undefined)) {
    for (const way of ways) presses.push({ label: HITOTSU_COPY.swapWith(name(way.swap!)), move: way, testId: `hitotsu-swap-${way.swap}`, strong: true });
  } else if (mine || chosen !== null) {
    presses.push({
      label: jumping ? HITOTSU_COPY.jumpIn : HITOTSU_COPY.play,
      move: ways[0] ?? null,
      testId: jumping ? "hitotsu-jump" : "hitotsu-play",
      strong: true,
      why: chosen === null ? HITOTSU_COPY.playWhy : HITOTSU_COPY.notThat,
    });
  }
  for (const move of moves) {
    if ("draw" in move) presses.push({ label: HITOTSU_COPY.draw, move, testId: "hitotsu-draw" });
    if ("pass" in move) presses.push({ label: game.drawn !== null ? HITOTSU_COPY.keep : HITOTSU_COPY.pass, move, testId: "hitotsu-pass" });
    if ("take" in move) presses.push({ label: HITOTSU_COPY.take(game.pending), move, testId: "hitotsu-take" });
    if ("challenge" in move) presses.push({ label: HITOTSU_COPY.challenge, move, testId: "hitotsu-challenge" });
  }
  return presses;
}

/** The line over the table: whose turn it is and what they are to do. */
export function hitotsuStatus(game: HitotsuGame, name: (seat: number) => string, say: Speaker): string {
  const HITOTSU_COPY = hitotsuScreenWords(say.locale);
  if (game.toPlay === null) return "";
  const who = name(game.toPlay);
  if (game.challenge !== null) return HITOTSU_COPY.challengeOpen(who, name(game.challenge.by));
  if (game.pending > 0) return HITOTSU_COPY.facing(who, game.pending);
  if (game.drawn !== null) return HITOTSU_COPY.drew(who);
  return say.say("party.hitotsu.playLine", { name: who, colour: colourWords(game.colour, hitotsuLanguage(say)) });
}

/** What the last move did beyond the card, in words: "Ben took four.", "Cy was caught: two cards." */
export function hitotsuNewsLine(game: HitotsuGame, name: (seat: number) => string, say: Speaker): string {
  return say.sentences(
    game.news
    .map((news) => {
      switch (news.kind) {
        case "caught":
          return say.say("party.hitotsu.caught", { name: name(news.seat) });
        case "took":
          return say.say("party.hitotsu.took", { name: name(news.seat), count: String(news.count) });
        case "challenge":
          return say.say(news.guilty ? "party.hitotsu.challengeGuilty" : "party.hitotsu.challengeInnocent", { name: name(news.seat), by: name(news.by) });
        case "swap":
          return say.say("party.hitotsu.swap", { name: name(news.seat), other: name(news.with) });
        case "rotate":
          return say.say("party.hitotsu.rotate");
        case "jump":
          return say.say("party.hitotsu.jump", { name: name(news.seat) });
        case "skipped":
          return say.say("party.hitotsu.skipped", { name: name(news.seat) });
        case "reversed":
          return say.say("party.hitotsu.reversed");
        case "drew":
          return say.count("party.hitotsu.drew", news.count, { name: name(news.seat) });
      }
    }),
  );
}
