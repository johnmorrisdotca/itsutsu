import { gunjinSideWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A SIDE'S MARK, in the colour its pieces are drawn in: a round chip with its
 * letter, so a side is told by the letter as well as by the colour. The pieces
 * are the package's and keep its two colours whatever a player chose for a
 * table's marbles, so the chip is the package's red and blue and not a marble.
 */
export function GunjinSide({ seat }: { seat: number }) {
  const say = useSpeaker();
  const GUNJIN_SIDES = gunjinSideWords(say.locale);
  const side = GUNJIN_SIDES[seat === 0 ? 0 : 1];
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs leading-none font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
      style={{ background: side.fill }}
      aria-hidden="true"
      data-side={side.label.toLowerCase()}
    >
      {side.letter}
    </span>
  );
}
