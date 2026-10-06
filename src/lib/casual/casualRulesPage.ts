import { gameArtPath } from "@/lib/gomoku/artwork";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { CASUAL_DISPLAY, CASUAL_SPECS } from "./casual.constants";
import type { CasualKind } from "./casual.types";

/** "5 levels" or "4 stories", from the game's own spec. */
export function casualLevelsWords(kind: CasualKind): string {
  const { levels } = CASUAL_SPECS[kind];
  return kind === "choiceStory" ? `${levels} stories` : `${levels} levels`;
}

/**
 * A casual game's rules page, in the game template: Object, Board, Play,
 * House. The same `RulesPage` shape every game builds, so the one rules page
 * draws it and a reader who has read one has read them all. The facts come
 * from the game's copy and spec, never from a second description that could
 * drift.
 */
export function casualRulesPage(kind: CasualKind): RulesPage {
  const copy = CASUAL_DISPLAY[kind];
  const spec = CASUAL_SPECS[kind];
  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    alsoKnownAs: [],
    from: null,
    wikipedia: null,
    object: [copy.tagline, copy.rules[0]],
    board: [`${casualLevelsWords(kind)[0].toUpperCase()}${casualLevelsWords(kind).slice(1)}. ${copy.board}`],
    play: copy.rules.slice(1),
    house: [
      "Played alone, with a finger or the mouse, and on a phone as on a desk. Nothing here is rated, and a level won earns no points and no experience.",
      "Your progress, the levels you have won in each game and the one you were on, is kept only in the browser you play in. Clear the site's data and it starts again; it follows you to no other device.",
      spec.physics
        ? "The physics is the Karakuri package's own and runs in your browser at a fixed sixtieth of a second a step, with nothing random in it, so a level plays the same way every time and on every device."
        : "Every level can be won: each was proved by a search, or by playing it out, before it was kept.",
      "Restart begins the level again; Give up ends it unsolved; New game goes back to choose a level, and leaves the one you were on where it is.",
    ],
    image: gameArtPath(kind),
  };
}
