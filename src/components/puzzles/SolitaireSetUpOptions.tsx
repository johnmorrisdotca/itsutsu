"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { SolitaireScoring } from "@/lib/puzzles/solitaire/scoring";
import { SOLITAIRE_SCORING_LIST } from "@/lib/puzzles/solitaire/scoring";

const DEAL_WORDS = {
  winnable: { label: "Winnable deals", kanji: "必勝", says: "Every deal has already been won by our solver, so it can be won." },
  any: { label: "Any deal", kanji: "運任せ", says: "The shuffle as it falls, as with a real deck: some deals cannot be won." },
} as const;

const SCORE_WORDS: Record<SolitaireScoring, { label: string; kanji: string; says: string }> = {
  none: { label: "No score", kanji: "無", says: "Just the clock and the count of moves." },
  standard: { label: "Standard", kanji: "標準", says: "10 a card home, 5 from the waste to a column and for a card turned over; a bonus for speed." },
  vegas: { label: "Vegas", kanji: "賭", says: "52 down for the deck and 5 back for every card home: points only, never money." },
};

/**
 * SOLITAIRE'S OWN SET-UP CHOICES, under the puzzle's options, as Kumimoji's
 * are: the kind of deal, and how the score is kept. Draw one or three is the
 * size tiles beside the preview, and the passes through the stock the level.
 *
 * THE KIND OF DEAL writes into the address (`deal=any`), since it decides
 * which deal the seed names (`solitaire/generate.ts`); winnable, the default,
 * leaves the address as it was. THE SCORE is this reader's way of counting,
 * kept in this browser (`useSolitaireScoring`), and offered again beside the
 * table.
 */
export function SolitaireSetUpOptions({ anyDeal, setAnyDeal, scoring, setScoring }: { anyDeal: boolean; setAnyDeal: (any: boolean) => void; scoring: SolitaireScoring; setScoring: (scoring: SolitaireScoring) => void }) {
  const deal = anyDeal ? DEAL_WORDS.any : DEAL_WORDS.winnable;
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Deals" data-testid="solitaire-deals">
        {([false, true] as const).map((any) => {
          const words = any ? DEAL_WORDS.any : DEAL_WORDS.winnable;
          return (
            <button
              key={String(any)}
              type="button"
              role="radio"
              aria-checked={anyDeal === any}
              className={`${PICK_WORD_CHIP} ${anyDeal === any ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => setAnyDeal(any)}
              data-testid={`solitaire-deal-${any ? "any" : "winnable"}`}
            >
              {words.label} <span className="font-mincho opacity-70">{words.kanji}</span>
            </button>
          );
        })}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="solitaire-deal-blurb">
        {deal.says}
      </p>
      <SolitaireScoreChips chosen={scoring} onChoose={setScoring} />
    </>
  );
}

/** How the score is kept: on the set-up, and beside the table, the one choice in both. */
export function SolitaireScoreChips({ chosen, onChoose }: { chosen: SolitaireScoring; onChoose: (scoring: SolitaireScoring) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Score" data-testid="solitaire-scoring">
        {SOLITAIRE_SCORING_LIST.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={chosen === each}
            className={`${PICK_WORD_CHIP} ${chosen === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => onChoose(each)}
            data-testid={`solitaire-scoring-${each}`}
          >
            {SCORE_WORDS[each].label} <span className="font-mincho opacity-70">{SCORE_WORDS[each].kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="solitaire-scoring-blurb">
        {SCORE_WORDS[chosen].says}
      </p>
    </div>
  );
}
