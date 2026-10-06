import Link from "@/components/ui/Link";

import { PANEL_CLASS, SECTION_HEADING, TONE_CLASS } from "@/components/ui/ui.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { weave } from "@/lib/i18n/weave";
import { BETA_TESTERS } from "@/lib/thanks/testers";

import { BetaAsk } from "./BetaAsk";

/**
 * THE BETA, SAID PLAINLY, WITH THE TWO WAYS IN.
 *
 * John, 2026-09-24: both sites are in beta, charge nothing, are invite only,
 * and need people to test them — and a visitor should be able to find how to
 * ask for an invite and how to help from the front page. The only way to ask
 * was a folded line at the foot of /join, a page a stranger reaches only by
 * trying to open something they may not.
 *
 * The request itself is the form that already exists on /join
 * (`AskForInvite`), opened unfolded by `?ask=1`, so there is still one way to
 * ask and one set of checks on it. How to help and how to ask are `BetaAsk`,
 * which /thanks draws too.
 */
export async function HomeBeta({ signedIn }: { signedIn: boolean }) {
  const say = await currentSpeaker();
  const title = say.pair("home.beta.title", "試験公開");
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-beta" id="beta">
      <h2 className={SECTION_HEADING}>
        {title.text}
        {title.kanji === null ? null : <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">{title.kanji}</span>}
      </h2>
      <p className="text-sm leading-relaxed text-ink-soft">{say.say("home.beta.lead", { site: SITE_NAME })}</p>
      <TestersLine say={say} />
      <BetaAsk signedIn={signedIn} testId="front-beta" />
    </section>
  );
}

function TestersLine({ say }: { say: Speaker }) {
  const count = BETA_TESTERS.length;
  const link = (
    <Link href="/thanks" className="font-medium underline underline-offset-4" data-testid="front-thanks-link">
      {say.say("home.beta.thanksLink")}
    </Link>
  );
  const sentence = count === 0 ? say.say("home.beta.nobody") : say.count("home.beta.some", count, { site: SITE_NAME });
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.good}`} data-testid="front-thanks">
      {weave(sentence, { link })}
    </p>
  );
}
