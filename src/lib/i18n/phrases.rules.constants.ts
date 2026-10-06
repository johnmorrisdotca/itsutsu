/**
 * rules.*: the headings and lines around a game's rules page. The rules themselves are a game's own copy (ENJA-05).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_RULES = {
  "rules.object": "Objective",
  "rules.board": "Board",
  "rules.play": "How to play",
  "rules.house": "House rules",
  "rules.learn": "Learn",
  "rules.inspiredBy":
    "Inspired by {name}. The name belongs to its owner; this is our own version of the rules.",
  "rules.alsoKnownAs": "Also known as {names}.",
  "rules.from": "From {country}",
  "rules.imageAlt": "A game of {game} in progress",
  "rules.play.button": "Play →",
  "rules.everyGamePlayed": "Every game of {game} played here",
  "rules.wikipedia": "Read about {game} on Wikipedia ↗",
} as const;
