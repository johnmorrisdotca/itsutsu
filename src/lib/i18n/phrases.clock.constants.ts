/**
 * clock.*: what each preset clock means (`src/lib/clock/clock.constants.ts`); the preset's own name is the English label beside its `kanji`.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_CLOCK = {
  "clock.noneDescription": "Take as long as you like.",
  "clock.blitzDescription": "3 minutes, then three 10-second periods.",
  "clock.rapidDescription": "10 minutes, then three 30-second periods.",
  "clock.classicalDescription": "30 minutes, then five 1-minute periods.",
} as const;
