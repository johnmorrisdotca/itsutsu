import Link from "next/link";

import { BUTTON_BASE, BUTTON_STRONG, PANEL_CLASS, TONE_CLASS } from "@/components/ui/ui.constants";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { BETA_TESTERS, communitiesSaid } from "@/lib/thanks/testers";

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
 * ask and one set of checks on it. A member is already in, so they are not
 * asked for a code they have used: they are asked to say what they find.
 */
export function HomeBeta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-beta" id="beta">
      <h2 className="flex flex-wrap items-baseline gap-x-2 font-semibold">
        In beta, free, and looking for testers
        <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">試験公開</span>
      </h2>
      <p className="text-sm leading-relaxed text-ink-soft">
        Itsutsu is a beta: the games are real and every finished one is kept, but pages still change from week to week
        and some things will break. It is free, with nothing to pay and nothing to buy, and it is by invitation while
        it is small.
      </p>
      <p className="text-sm leading-relaxed text-ink-soft">
        We need beta testers, and a tester needs no skill at any of these games. What helps most:
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-soft">
        <li>Play a few games, against a person or one of the computer players, on a phone as well as a computer.</li>
        <li>Tell us where a rule looked wrong, a page was confusing, or a move did not go where you put it.</li>
        <li>Say which games you would like to see here next, and which ones you played on the older sites.</li>
      </ul>
      <TestersLine signedIn={signedIn} />
      {signedIn ? (
        <p className="text-sm leading-relaxed text-ink-soft" data-testid="front-beta-member">
          You are already in, which makes you a tester. Write to{" "}
          <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4">
            {CONTACT_ADDRESS}
          </a>{" "}
          with anything you find, and hand the other seat of a game to a friend: two people on one board is the best test
          there is.
        </p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-ink-soft">
            To join, ask for an invite and say a line about yourself. If you would like to test, say so in the same
            note. Players from {communitiesSaid()} are especially welcome. You can also write to{" "}
            <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4" data-testid="front-beta-mail">
              {CONTACT_ADDRESS}
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ASK_FOR_INVITE_PATH}
              className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2`}
              data-testid="front-beta-ask"
            >
              Ask for an invite
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * THAT PEOPLE ARE HELPING, SAID WHERE IT CANNOT BE MISSED.
 *
 * John, 2026-09-24: "a small paragraph on the main page so it's very obvious
 * that people are helping test." It counts the testers who asked to be named,
 * and says where they are thanked. The thank-you page names members, so it is
 * behind the invite like every page that does: a member is given the link, a
 * stranger is told the page exists.
 */
function TestersLine({ signedIn }: { signedIn: boolean }) {
  const count = BETA_TESTERS.length;
  const who =
    count === 0
      ? "Everybody who helps test is thanked by name"
      : `${count === 1 ? "One person is" : `${count} people are`} helping test Itsutsu already, and each is thanked by name`;
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.good}`} data-testid="front-thanks">
      {who}, under the name they play by,{" "}
      {signedIn ? (
        <>
          on{" "}
          <Link href="/thanks" className="font-medium underline underline-offset-4" data-testid="front-thanks-link">
            our thank-you page
          </Link>
        </>
      ) : (
        "on a thank-you page inside the site"
      )}
      . We are grateful to every one of them.
    </p>
  );
}
