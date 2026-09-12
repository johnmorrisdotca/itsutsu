import { OfferButtons } from "@/components/mine/OfferButtons";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { OFFER_PANEL_COPY } from "./live.constants";

/**
 * WHAT TO DO ABOUT AN OFFER, beside the board it is about.
 *
 * A panel rather than a banner, and FIRST in the column — above the rules — for
 * a reason that is about reading order rather than importance: an offer is the
 * one thing on this page a reader has to answer, and the rules directly below
 * it are what they are answering about. Deciding, then the thing decided.
 *
 * TWO PEOPLE, TWO SENTENCES. The one who was asked has a decision, and needs to
 * know what refusing costs them, which is nothing. The one who asked has
 * nothing to do but wait or take it back, and needs to know that no clock is
 * running against them while they do. Written as two branches rather than one
 * sentence with a name swapped in, because they are not the same sentence.
 *
 * A SERVER COMPONENT holding a client one: nothing here needs a browser, and
 * which of the two people is reading is decided on the server from their member
 * id — `offerIsMine` in `offers.ts`. Only the three buttons are interactive.
 */
export function OfferPanel({
  id,
  side,
  who,
}: {
  id: string;
  /** Which side of the offer this reader is on. */
  side: "to-me" | "from-me";
  /** The OTHER person, as this site prints a name. */
  who: string;
}) {
  const mine = side === "to-me";
  const copy = mine ? OFFER_PANEL_COPY.toMe : OFFER_PANEL_COPY.fromMe;
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="offer-panel">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.title}{" "}
        <span className="font-mincho normal-case tracking-normal">{copy.kanji}</span>
      </h2>
      <p className="text-xs text-muted">{copy.lead(who)}</p>
      <div className="flex justify-start">
        <OfferButtons id={id} side={side} />
      </div>
    </div>
  );
}
