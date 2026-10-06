/**
 * count.*: a number with its noun, said once and counted the reader's way.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 *
 * EVERY NOUN IS A PAIR, `.one` and `.other`, and `Speaker.count("count.move", n)`
 * picks the pair's form for the number and fills `{count}` with it, thousands
 * marked. English has a singular for exactly 1; Japanese has none and counts
 * with a counter word after the digits (1局, 3手, 5人), so it answers both forms
 * with the same text. A game between people is 局 and a game as a thing in the
 * catalogue is ゲーム, as `docs/plans/en-ja-everywhere/TERMS.md` says. A new noun
 * is two lines here and two in the Japanese dictionary.
 */
export const PHRASES_COUNT = {
  "count.gameKind.one": "{count} game",
  "count.gameKind.other": "{count} games",
  "count.gamePlayed.one": "{count} game",
  "count.gamePlayed.other": "{count} games",
  "count.move.one": "{count} move",
  "count.move.other": "{count} moves",
  "count.offer.one": "{count} offer",
  "count.offer.other": "{count} offers",
  "count.player.one": "{count} player",
  "count.player.other": "{count} players",
  "count.puzzle.one": "{count} puzzle",
  "count.puzzle.other": "{count} puzzles",
  "count.step.one": "{count} step",
  "count.step.other": "{count} steps",
  "count.level.one": "{count} level",
  "count.level.other": "{count} levels",
  "count.pair.one": "{count} pair",
  "count.pair.other": "{count} pairs",
} as const;
