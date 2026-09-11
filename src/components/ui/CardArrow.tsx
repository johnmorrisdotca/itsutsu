import { CARD_ARROW_CLASS } from "./ui.constants";

/**
 * The round chevron that says a card opens.
 *
 * John asked for it in these words: "a nice round chevron pointing right in a
 * circle, to take us to that game." It sits at the right edge of a card whose
 * whole face is a link — see STRETCHED_CARD in ui.constants.ts — and it is an
 * AFFORDANCE, not a destination: it is `aria-hidden`, it is not itself a link,
 * and a click on it lands on the card's stretched face like a click anywhere
 * else. A chevron that went somewhere of its own would be a second link to the
 * same place, or worse, to a different one.
 *
 * DRAWN AT REST, FAINTLY, ON EVERY DEVICE; firmed up — filled, full strength —
 * when the card's link is hovered or focused. Not hidden until hover, which is
 * what was asked for and would have been wrong on the iPad John plays on with
 * his daughter: a touch screen has no hover, so a hint that exists only on
 * hover is a hint the iPad never gets. iOS's own lists keep their disclosure
 * chevron visible at all times, which is the convention that reader already
 * knows. Detecting a coarse pointer instead was rejected as a heuristic that
 * an iPad with a trackpad and a touchscreen laptop both get wrong. The card
 * being tappable is the part that matters on touch; the chevron says so.
 *
 * Keyboard readers get the same thing as pointer readers: `card-focus` fires
 * on the stretched link's `:focus-visible`, and the card's ring is drawn by
 * STRETCHED_CARD at the same moment.
 *
 * `transition` for the fill, and nothing here about reduced motion because
 * globals.css already zeroes every transition on the site under
 * `prefers-reduced-motion: reduce`.
 */
export function CardArrow({
  className = "",
}: {
  /** Where it sits, or how big: `size-6` for a row in a list, `absolute …` for a grid that has no slot for it. */
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`${CARD_ARROW_CLASS} ${className}`.trim()} data-testid="card-arrow">
      {/* Half the circle, whatever the circle's size, so a small row gets a small chevron. */}
      <svg
        viewBox="0 0 16 16"
        className="size-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3.5 10.5 8 6 12.5" />
      </svg>
    </span>
  );
}
