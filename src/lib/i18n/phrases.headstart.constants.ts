/**
 * headstart.*: a head start in words: what each traditional head start is, how many of it was given, and the free turns (`src/lib/gomoku/headStartWords.ts`). The name is the English label beside its `kanji`.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_HEADSTART = {
  "headstart.stonesDescription": "Stones set on the star points before the first move. The other colour then moves first, and komi is half a point.",
  "headstart.cornersDescription": "Discs of this colour on the corners before the first move, which nothing can ever turn.",
  "headstart.menDescription": "Men taken off the other side's back row before the first move: odds of a man, as the clubs gave them.",
  "headstart.fromGo": "Go",
  "headstart.fromOthello": "Othello",
  "headstart.fromDraughts": "Draughts",
  "headstart.stones.one": "1 handicap stone",
  "headstart.stones.other": "{count} handicap stones",
  "headstart.corners.one": "1 corner",
  "headstart.corners.other": "{count} corners",
  "headstart.men.one": "a man off the other side",
  "headstart.men.other": "{count} men off the other side",
  "headstart.freeTurn.one": "1 free turn",
  "headstart.freeTurn.other": "{count} free turns",
  "headstart.described": "{colour} head start: {parts}",
} as const;
