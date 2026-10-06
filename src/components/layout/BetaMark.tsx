import Link from "@/components/ui/Link";

import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { SITE_NAME } from "@/lib/i18n/siteName";

/**
 * THE SITE SAYING IT IS A BETA, where a newcomer looks first. John,
 * 2026-09-23: "ITS site shows beta in the footer, but not in the Header… a
 * very nice looking, small and subtle Beta in the Home page for the Hero, and
 * in the header for all other pages, so people know."
 *
 * A pill in ochre, the site's colour for a caveat rather than an alarm, with
 * the word `chrome.stage` — the footer's word, so the two can never disagree and
 * the day the site leaves beta is one edit.
 *
 * And it leads to the people helping build it. John, 2026-09-24: "For our Beta
 * badges, clicking on them should take us to the Beta testers page or thank
 * you page!" So it is a link to /thanks, which is open to everybody, so a
 * visitor with no invite can follow it too.
 */
export async function BetaMark({ className = "" }: { className?: string }) {
  const say = await currentSpeaker();
  return (
    <Link
      href="/thanks"
      className={`inline-block rounded-full border border-ochre/40 bg-ochre-soft px-1.5 py-px text-[0.6rem] leading-tight font-semibold tracking-[0.14em] text-ochre uppercase select-none hover:border-ochre ${className}`}
      title={say.say("chrome.betaTitle", { site: SITE_NAME })}
      data-testid="beta-mark"
    >
      {say.say("chrome.stage")}
    </Link>
  );
}
