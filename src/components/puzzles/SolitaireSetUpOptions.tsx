"use client";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { SolitaireScoring } from "@/lib/puzzles/solitaire/scoring";
import { SOLITAIRE_SCORING_LIST } from "@/lib/puzzles/solitaire/scoring";

import { solitaireOptions } from "./cardWords";

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
  const say = useSpeaker();
  const { deals: DEAL_WORDS } = solitaireOptions(say.locale);
  const deal = anyDeal ? DEAL_WORDS.any : DEAL_WORDS.winnable;
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label={say.say("pcard.dealsAria")} data-testid="solitaire-deals">
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
              <Paired en={words.label} kanji={words.kanji} kanjiClassName="opacity-70" inReadersLanguage />
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
  const say = useSpeaker();
  const { scores: SCORE_WORDS } = solitaireOptions(say.locale);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label={say.say("pcard.scoreAria")} data-testid="solitaire-scoring">
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
            <Paired en={SCORE_WORDS[each].label} kanji={SCORE_WORDS[each].kanji} kanjiClassName="opacity-70" inReadersLanguage />
          </button>
        ))}
      </div>
      <p className="min-h-8 text-xs text-muted" data-testid="solitaire-scoring-blurb">
        {SCORE_WORDS[chosen].says}
      </p>
    </div>
  );
}
