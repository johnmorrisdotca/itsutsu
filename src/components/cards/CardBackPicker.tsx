"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import { CARD_BACK_CHOICES, CARD_BOX } from "./Cards.constants";
import { useCardBackChoice } from "./cardBackChoice";
import { CardBackOf } from "./ChosenCardBack";

/**
 * THE BACK OF THE CARDS, CHOSEN BY LOOKING: a row of small cards, one of each
 * back, the chosen one ringed, as the felt's patches sit beside it
 * (`FeltPatches`). No words on the page: each says its name to a screen
 * reader and on hover. A card is a card's shape, never a square: a square
 * patch is a board's.
 */
const BACK_NAMES: Record<(typeof CARD_BACK_CHOICES)[number], PhraseKey> = {
  itsutsu: "ctable.back.itsutsu",
  "classic-red": "ctable.back.classicRed",
  "classic-blue": "ctable.back.classicBlue",
  "ink-dots": "ctable.back.inkDots",
};

export function CardBackPicker() {
  const say = useSpeaker();
  const { back, choose } = useCardBackChoice();
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label={say.say("ctable.back.aria")} data-testid="card-back-picker">
      {CARD_BACK_CHOICES.map((each) => {
        const chosen = back === each;
        return (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={chosen}
            aria-label={say.say("ctable.back.label", { name: say.say(BACK_NAMES[each]) })}
            title={say.say("ctable.back.label", { name: say.say(BACK_NAMES[each]) })}
            onClick={() => choose(each)}
            data-testid={`card-back-${each}`}
            className={`surface-light block h-7 w-5 cursor-pointer rounded-[3px] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-moss ${
              chosen ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:ring-1 hover:ring-rule-strong hover:ring-offset-1 hover:ring-offset-paper"
            }`}
          >
            <svg viewBox={`0 0 ${CARD_BOX.width} ${CARD_BOX.height}`} className="block h-full w-full" aria-hidden="true">
              <CardBackOf back={each} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
