import Link from "@/components/ui/Link";

import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";
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
export async function BetaAsk({ signedIn, testId }: { signedIn: boolean; testId: string }) {
  const say = await currentSpeaker();
  const mail = (
    <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4" data-testid={signedIn ? undefined : `${testId}-mail`}>
      {CONTACT_ADDRESS}
    </a>
  );
  return (
    <>
      <p className="text-sm leading-relaxed text-ink-soft">{say.say("home.ask.lead")}</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-soft">
        <li>{say.say("home.ask.play")}</li>
        <li>{say.say("home.ask.report")}</li>
        <li>{say.say("home.ask.say")}</li>
      </ul>
      {signedIn ? (
        <p className="text-sm leading-relaxed text-ink-soft" data-testid={`${testId}-member`}>
          {weave(say.say("home.ask.member"), { mail })}
        </p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-ink-soft">
            {weave(say.say("home.ask.stranger", { sites: communitiesSaid(say) }), { mail })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ASK_FOR_INVITE_PATH} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2`} data-testid={`${testId}-ask`}>
              {say.say("home.askInvite")}
            </Link>
          </div>
        </>
      )}
    </>
  );
}
