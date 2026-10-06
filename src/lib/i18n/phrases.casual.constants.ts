/**
 * casual.*: the casual games' pages and Karakuri's levels.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * Its Japanese is `dictionaries/ja.drafted.casual.constants.ts`.
 */
export const PHRASES_CASUAL = {
  // How many levels, in a line
  "casual.levels.one": "{count} level",
  "casual.levels.other": "{count} levels",
  "casual.stories.one": "{count} story",
  "casual.stories.other": "{count} stories",
  "casual.offered": "{levels} to play alone.",
  "casual.boardLine": "{levels}. {board}",
  "casual.line": "{levels} to play alone; unrated, kept in your browser.",
  "casual.source": "On {site}: played alone, unrated, and worth no points",
  "casual.levelOf": "{word} {level} of {total}",
  "casual.cardGoing": "{word} {level} {going}",
  "casual.familyLine": "{count}, each played alone for a minute or two a level. Nothing here is rated or scored; the levels you win are kept in this browser.",
  // What the rules page says about the house
  "casual.house.alone": "Played alone, with a finger or the mouse, and on a phone as on a desk. Nothing here is rated, and a level won earns no points and no experience.",
  "casual.house.kept": "Your progress, the levels you have won in each game and the one you were on, is kept only in the browser you play in. Clear the site's data and it starts again; it follows you to no other device.",
  "casual.house.physics": "The physics is the Karakuri package's own and runs in your browser at a fixed sixtieth of a second a step, with nothing random in it, so a level plays the same way every time and on every device.",
  "casual.house.solved": "Every level can be won: each was proved by a search, or by playing it out, before it was kept.",
  "casual.house.restart": "Restart begins the level again; Give up ends it unsolved; New game goes back to choose a level, and leaves the one you were on where it is.",
} as const;
