/**
 * How many words a Gomoji hides at once: one, a Futago's two (`futago.ts`),
 * or a Yotsugo's four (`yotsugo.ts`). Never three: a count the set-up screen
 * does not offer is a puzzle nobody could have asked for.
 */
export type WordCount = 1 | 2 | 4;
