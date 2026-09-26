import { BetaAsk } from "@/components/home/BetaAsk";
import { PageTitle, SectionHeading } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { findMembersByNames } from "@/lib/auth/members";
import { currentReader } from "@/lib/auth/currentReader";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { playerKey } from "@/lib/rating/playerKey";
import { BETA_TESTERS, communitiesSaid } from "@/lib/thanks/testers";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";

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
 * AND IT RECRUITS. The Beta badge on every page leads here, so it carries the
 * front page's way in as well — how to help, and how to ask for an invite —
 * through the same `BetaAsk`.
 *
 * AN EMPTY LIST IS SHOWN, NOT HIDDEN. Before the first name it says where the
 * names will go and how to be among them, which is the page's second job.
 */
export default async function ThanksPage() {
  const reader = await currentReader();
  const members = reader.signedIn ? await findMembersByNames(BETA_TESTERS.map((tester) => tester.name)) : null;
  // The flag, badge and level beside each name, as on every list.
  const tags = await nameTagsOf(members === null ? [] : [...members.values()].map((member) => member.id));
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title="Thank you"
        kanji="感謝"
        lead="Itsutsu is free and in beta. The people below have given their own time to play it before it was finished: finding the rule that was wrong, the button that did nothing, the page that made no sense on a phone, and telling us. Every fix they lead to is theirs as much as ours. We are very grateful, and this page is where we say so."
      />

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-testers">
        <SectionHeading title="Our beta testers" kanji="試験協力者" />
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
                      tag={tags.get(members.get(playerKey(tester.name))?.id ?? "")}
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

      {/*
        The page's second job, said as fully as the front page says it: the Beta
        badge on every page leads here, so this is where a curious visitor lands.
        John, 2026-09-24: "so the page isn't just about thanks but about getting
        more beta testers."
      */}
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-join" id="join">
        <SectionHeading title="Become a beta tester" kanji="協力募集" />
        <BetaAsk signedIn={reader.signedIn} testId="thanks-join" />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-communities">
        <SectionHeading title="If you played on the older sites" kanji="先達" />
        <p className="text-sm leading-relaxed text-ink-soft">
          People have played these games for years on {communitiesSaid()}. If you are one of them, we would be
          especially glad of your help. You already know how a game between people should
          feel when it is kept properly, which is exactly what we are trying to get right, and you will notice what we
          have missed long before we do. Bring a friend you used to play there, and bring your old record too: it can
          be copied over and shown beside what you play here.
        </p>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="thanks-how">
        <SectionHeading title="To be listed, or to stop being" kanji="掲載" />
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
