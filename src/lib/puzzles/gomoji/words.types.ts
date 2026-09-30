/**
 * How many words a Gomoji hides at once: one, a Futago's two (`futago.ts`),
 * or a Yotsugo's four (`yotsugo.ts`). Never three: a count the set-up screen
 * does not offer is a puzzle nobody could have asked for.
 */
export type WordCount = 1 | 2 | 4;

/**
 * How a Gomoji of one word is played: found, as ever; as a Nige 逃げ, a word
 * that dodges (`dodge.ts`); or as a Sakasa 逆さ, a word to avoid
 * (`backwards.ts`). Chosen on the set-up screen, and from then said by the seed.
 */
export type GomojiWay = "find" | "dodge" | "backwards";
