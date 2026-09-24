import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { findMembersByNames } from "@/lib/auth/members";
import { currentReader } from "@/lib/auth/currentReader";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { playerKey } from "@/lib/rating/playerKey";
import { BETA_TESTERS, communitiesSaid } from "@/lib/thanks/testers";

export const metadata = { title: "Thank you" };

/**
 * THANK YOU, TO THE PEOPLE TESTING THE SITE.
 *
 * John, 2026-09-24: testers give their time to a site that charges nothing,
 * and they should find a place that credits them, written so they feel it was
 * worth it. By the name they play under, and only because they asked to be
 * named: see `BETA_TESTERS`.
 *
 * OPEN TO EVERYBODY. John, 2026-09-24: "Yes, all Thanks pages should be
 * public." A thank-you only members can read thanks nobody in public, and
 * every name here was put here by its owner asking, so this is the one open
 * page that names members. It is still careful about how: the player pages
 * are behind the invite, so a stranger reads each handle as plain text and
 * only a member gets it as a link.
 *
 * FOR A MEMBER, EACH NAME LEADS TO ITS PAGE BY THE MEMBER'S ID, found in one
 * query for the whole list, so the address never carries somebody's whole
 * name.
 *
 * AN EMPTY LIST IS SHOWN, NOT HIDDEN. Before the first name it says where the
 * names will go and how to be among them, which is the page's second job.
 */
export default async function ThanksPage() {
  const reader = await currentReader();
  const members = reader.signedIn ? await findMembersByNames(BETA_TESTERS.map((tester) => tester.name)) : null;
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className="flex flex-col gap-3">
        <h1 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold">
          Thank you
          <span className="whitespace-nowrap font-mincho text-sm font-normal opacity-70">感謝</span>
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
          Itsutsu is free and in beta. The people below have given their own time to play it before it was finished:
          finding the rule that was wrong, the button that did nothing, the page that made no sense on a phone, and
          telling us. Every fix they lead to is theirs as much as ours. We are very grateful, and this page is where we
          say so.
        </p>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-testers">
        <h2 className="flex flex-wrap items-baseline gap-x-2 font-semibold">
          Our beta testers
          <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">試験協力者</span>
        </h2>
        {BETA_TESTERS.length === 0 ? (
          <p className="text-sm text-muted" data-testid="thanks-empty">
            The first names will go here. If you have been testing and would like to be thanked by the name you play
            under, write to us and we will add you with pleasure.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-rule">
            {BETA_TESTERS.map((tester) => (
              <li key={tester.name} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0" data-testid="thanks-tester">
                <span className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                  {members ? (
                    <PlayerName
                      name={tester.name}
                      memberId={members.get(playerKey(tester.name))?.id ?? null}
                      fallback={tester.name}
                    />
                  ) : (
                    <span data-testid="thanks-tester-name">{tester.name}</span>
                  )}
                  {tester.from ? <span className="text-xs font-normal text-muted">from {tester.from}</span> : null}
                  <span className="text-xs font-normal text-muted">since {tester.since}</span>
                </span>
                <span className="text-sm text-muted">{tester.helped}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-communities">
        <h2 className="flex flex-wrap items-baseline gap-x-2 font-semibold">
          If you played on the older sites
          <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">先達</span>
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          People have played these games for years on {communitiesSaid()}. If you are one of them, we would be
          especially glad of your help. You already know how a game between people should
          feel when it is kept properly, which is exactly what we are trying to get right, and you will notice what we
          have missed long before we do. Bring a friend you used to play there, and bring your old record too: it can
          be copied over and shown beside what you play here.
        </p>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-how">
        <h2 className="flex flex-wrap items-baseline gap-x-2 font-semibold">
          To be listed, or to stop being
          <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">掲載</span>
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          Write to{" "}
          <a href={`mailto:${CONTACT_ADDRESS}`} className="underline underline-offset-4" data-testid="thanks-mail">
            {CONTACT_ADDRESS}
          </a>{" "}
          with the name you play under here and, if you like, the site you came from and what you have been looking at.
          Nobody is listed without asking, and anybody can be taken off by saying so.
        </p>
      </section>
    </Page>
  );
}
