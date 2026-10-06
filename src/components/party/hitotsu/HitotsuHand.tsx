"use client";

import type { HitotsuCard } from "@johnmorrisdotca/hitotsu";

import { HITOTSU_HAND_CARD_PX } from "./hitotsu.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { HitotsuCardView, hitotsuCardLabel } from "./HitotsuCardView";
import { hitotsuLanguage } from "./hitotsuPresses";

/** How much of a card a hand shows at most when there is room to spare. */
const WIDEST_STEP = 0.62;

/**
 * A HAND OF HITOTSU CARDS, fanned along a row, overlapping as much as the
 * width needs and no more. A card that can be played now is lit; a chosen one
 * rises. Tap to choose, and tap a chosen card again to play it where that is
 * the only thing it can do (`onPress` decides). As `CardHand` is for the
 * ordinary deck.
 */
export function HitotsuHand({
  cards,
  chosen,
  playable,
  onPress,
  label,
}: {
  cards: readonly HitotsuCard[];
  chosen: HitotsuCard | null;
  playable: readonly HitotsuCard[];
  onPress?: (card: HitotsuCard) => void;
  label: string;
}) {
  const say = useSpeaker();
  const count = cards.length;
  const width = `min(${HITOTSU_HAND_CARD_PX}px, 100%)`;
  const reach = 1 + WIDEST_STEP * Math.max(0, count - 1);
  return (
    <div className="w-full" role="group" aria-label={label} data-testid="hitotsu-hand">
      <div className="relative mx-auto pt-[4%]" style={{ width: `min(100%, ${HITOTSU_HAND_CARD_PX * reach}px)` }}>
        <span aria-hidden="true" className="invisible block aspect-[5/7]" style={{ width }} />
        {cards.map((card, index) => {
          const up = card === chosen;
          const goes = playable.includes(card);
          return (
            <button
              key={card}
              type="button"
              className={`absolute block rounded-[9%/6.5%] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-moss ${goes || onPress === undefined ? "" : "brightness-75"}`}
              style={{
                width,
                top: 0,
                left: count > 1 ? `calc((100% - ${width}) * ${index / (count - 1)})` : 0,
                transform: up ? "translateY(-4%)" : "translateY(4%)",
                zIndex: index + 1,
              }}
              aria-label={`${hitotsuCardLabel(card, hitotsuLanguage(say))}${up ? say.say("ctable.chosenSuffix") : ""}${goes ? "" : say.say("party.hitotsu.noGo")}`}
              aria-pressed={up}
              disabled={onPress === undefined}
              onClick={() => onPress?.(card)}
              data-testid="hitotsu-hand-card"
              data-card={card}
              data-goes={goes ? "true" : "false"}
            >
              <HitotsuCardView card={card} chosen={up} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
