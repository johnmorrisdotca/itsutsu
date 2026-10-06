import { GoverningNote } from "@/components/layout/GoverningNote";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SectionedDocument, longDate } from "@/components/layout/SectionedDocument";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { PLAYER_SESSION_DAYS } from "@/lib/auth/session";

import { CONTACT, PRIVACY_CHANGED, PRIVACY_KANJI } from "./privacy.constants";
import { privacySections } from "./privacy.sections";

export async function generateMetadata() {
  const say = await currentSpeaker();
  return { title: say.say("privacy.title"), description: say.say("privacy.subtitle", { site: SITE_NAME }) };
}

/**
 * What Itsutsu keeps about a member, who can see it, and how to have it
 * removed.
 *
 * Open to strangers (`OPEN_EXACTLY` in `proxy.ts`), because the reader who
 * most needs it is deciding whether to ask for an invite, or whether a child
 * may. Every sentence is one the code keeps; see `privacy.constants.ts` and
 * the test beside it. Drawn by `SectionedDocument`, as /terms is.
 *
 * In the reader's language, and for a reader whose language is not English it
 * opens with the line that says the English version governs (ENJA-11).
 */
export default async function PrivacyPage() {
  const say = await currentSpeaker();
  return (
    <Page>
      <SiteHeader />

      <PageTitle title={say.say("privacy.title")} kanji={PRIVACY_KANJI} lead={say.say("privacy.subtitle", { site: SITE_NAME })}>
        <GoverningNote say={say} phrase="privacy.governing" testId="privacy-governing" />
        <p className="text-xs text-muted" data-testid="privacy-changed">
          {say.say("privacy.lastChanged", { date: longDate(PRIVACY_CHANGED, say.locale) })}
        </p>
      </PageTitle>

      <SectionedDocument sections={privacySections(say, PLAYER_SESSION_DAYS)} contact={CONTACT} testId="privacy-section" />
    </Page>
  );
}
