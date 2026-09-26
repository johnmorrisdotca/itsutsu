import Link from "@/components/ui/Link";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { communitiesSaid } from "@/lib/thanks/testers";

/**
 * HOW TO HELP TEST, AND HOW TO ASK TO JOIN: one wording for every page that
 * recruits.
 *
 * It was the body of the front page's beta panel. John, 2026-09-24, when the
 * Beta badge began leading to /thanks: "those thanks pages should also have any
 * information that we had on the main page that asks for them to contact us…
 * so the page isn't just about thanks but about getting more beta testers." So
 * the front page and the thank-you page draw the same words from here, and
 * cannot drift apart.
 *
 * A member is already in, so they are asked to say what they find. A stranger
 * is offered the one way to ask for an invite, the form on /join opened by
 * `?ask=1`. `testId` names the surface, so each page's spec finds its own copy.
 */
export function BetaAsk({ signedIn, testId }: { signedIn: boolean; testId: string }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-ink-soft">
        We need beta testers, and a tester needs no skill at any of these games. What helps most:
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-soft">
        <li>Play a few games, against a person or one of the computer players, on a phone as well as a computer.</li>
        <li>Tell us where a rule looked wrong, a page was confusing, or a move did not go where you put it.</li>
        <li>Say which games you would like to see here next, and which ones you played on the older sites.</li>
      </ul>
      {signedIn ? (
        <p className="text-sm leading-relaxed text-ink-soft" data-testid={`${testId}-member`}>
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
            <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4" data-testid={`${testId}-mail`}>
              {CONTACT_ADDRESS}
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ASK_FOR_INVITE_PATH} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2`} data-testid={`${testId}-ask`}>
              Ask for an invite
            </Link>
          </div>
        </>
      )}
    </>
  );
}
