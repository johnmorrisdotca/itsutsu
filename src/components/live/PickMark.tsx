/**
 * The round check that says "this is the one you picked".
 *
 * The companion of CardArrow, and deliberately its twin: same circle, same
 * size, same corner of the card. A card on /games opens something, and says
 * so with a chevron; a card here IS a choice, and says so with a check. One
 * shape for "a card is a thing you act on", two glyphs for the two acts —
 * rather than a second visual vocabulary for the second act.
 *
 * Unlike the chevron it is NOT drawn at rest. The chevron is an affordance
 * that has to be visible on a touch screen, where nothing hovers, to say the
 * card can be tapped at all; this is a report of state, and eleven checks on
 * eleven cards would report nothing. It appears on the chosen one only.
 *
 * `peer-checked` rather than a prop, so it reads the radio's own state: the
 * mark cannot say one thing while the input holds another. That means it must
 * be a LATER SIBLING of the input inside the label, which is what its callers
 * do.
 *
 * `aria-hidden`, because the radio beside it already tells a screen reader
 * that this one is checked. Drawing it into the accessible name would be the
 * same fact said twice.
 */
export function PickMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        "pointer-events-none inline-flex size-6 shrink-0 items-center justify-center rounded-full" +
        " border border-rule-strong text-transparent opacity-0 transition" +
        " peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-checked:opacity-100" +
        ` ${className}`
      }
      data-testid="pick-mark"
    >
      {/* Half the circle, whatever the circle's size, the way CardArrow does it. */}
      <svg
        viewBox="0 0 16 16"
        className="size-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
      </svg>
    </span>
  );
}
