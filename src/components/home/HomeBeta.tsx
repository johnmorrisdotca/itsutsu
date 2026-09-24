import Link from "next/link";

import { PANEL_CLASS, SECTION_HEADING, TONE_CLASS } from "@/components/ui/ui.constants";
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
export function HomeBeta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-beta" id="beta">
      <h2 className={SECTION_HEADING}>
        In beta, free, and looking for testers
        <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">試験公開</span>
      </h2>
      <p className="text-sm leading-relaxed text-ink-soft">
        Itsutsu is a beta: the games are real and every finished one is kept, but pages still change from week to week
        and some things will break. It is free, with nothing to pay and nothing to buy, and it is by invitation while
        it is small.
      </p>
      <TestersLine />
      <BetaAsk signedIn={signedIn} testId="front-beta" />
    </section>
  );
}

/**
 * THAT PEOPLE ARE HELPING, SAID WHERE IT CANNOT BE MISSED.
 *
 * John, 2026-09-24: "a small paragraph on the main page so it's very obvious
 * that people are helping test." It counts the testers who asked to be named,
 * and links the page that thanks them, which is open to everybody (John,
 * 2026-09-24: "Yes, all Thanks pages should be public").
 */
function TestersLine() {
  const count = BETA_TESTERS.length;
  const who =
    count === 0
      ? "Everybody who helps test is thanked by name"
      : `${count === 1 ? "One person is" : `${count} people are`} helping test Itsutsu already, and each is thanked by name`;
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.good}`} data-testid="front-thanks">
      {who}, under the name they play by, on{" "}
      <Link href="/thanks" className="font-medium underline underline-offset-4" data-testid="front-thanks-link">
        our thank-you page
      </Link>
      . We are grateful to every one of them.
    </p>
  );
}
