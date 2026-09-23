import { STAGE } from "@/lib/version";

/**
 * THE SITE SAYING IT IS A BETA, where a newcomer looks first. John,
 * 2026-09-23: "ITS site shows beta in the footer, but not in the Header… a
 * very nice looking, small and subtle Beta in the Home page for the Hero, and
 * in the header for all other pages, so people know."
 *
 * A pill in ochre, the site's colour for a caveat rather than an alarm, with
 * the word from `STAGE` — the footer's word, so the two can never disagree and
 * the day the site leaves beta is one edit.
 */
export function BetaMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border border-ochre/40 bg-ochre-soft px-1.5 py-px text-[0.6rem] leading-tight font-semibold tracking-[0.14em] text-ochre uppercase ${className}`}
      title={`Itsutsu is in ${STAGE.toLowerCase()}: new things arrive most days, and some rough edges are still being smoothed.`}
      data-testid="beta-mark"
    >
      {STAGE}
    </span>
  );
}
