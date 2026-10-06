/**
 * Solitaire's two set-up choices, in English: the kind of deal, and how the score is kept. The English half of
 * a pair: the Japanese is `SOLITAIRE_OPTIONS_JA` (`puzzles.ja.cards.constants.ts`), laid over this by `solitaireOptions`.
 */
export const SOLITAIRE_OPTIONS = {
  deals: {
    winnable: { label: "Winnable deals", kanji: "必勝", says: "Every deal has already been won by our solver, so it can be won." },
    any: { label: "Any deal", kanji: "運任せ", says: "The shuffle as it falls, as with a real deck: some deals cannot be won." },
  },
  scores: {
    none: { label: "No score", kanji: "無", says: "Just the clock and the count of moves." },
    standard: { label: "Standard", kanji: "標準", says: "10 a card home, 5 from the waste to a column and for a card turned over; a bonus for speed." },
    vegas: { label: "Vegas", kanji: "賭", says: "52 down for the deck and 5 back for every card home: points only, never money." },
  },
} as const;
