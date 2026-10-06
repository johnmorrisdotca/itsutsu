/**
 * handicapoffer.*: why a handicap switch is not offered (`src/lib/gomoku/handicapOffer.ts`).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_HANDICAPOFFER = {
  "handicapoffer.already": "Already a rule of {game} for {colour}.",
  "handicapoffer.twoStones": "Only in a game that places two stones a turn.",
  "handicapoffer.captures": "Only in a game with captures.",
} as const;
