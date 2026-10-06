import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SectionedDocument, longDate } from "@/components/layout/SectionedDocument";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { currentLocale } from "@/lib/i18n/currentLocale";
import { PLAYER_SESSION_DAYS } from "@/lib/auth/session";

import { CONTACT, PRIVACY_CHANGED, PRIVACY_SUBTITLE, PRIVACY_TITLE, privacySections } from "./privacy.constants";

export const metadata = {
  title: PRIVACY_TITLE.en,
  description: PRIVACY_SUBTITLE,
};

/**
 * What Itsutsu keeps about a member, who can see it, and how to have it
 * removed.
 *
 * Open to strangers (`OPEN_EXACTLY` in `proxy.ts`), because the reader who
 * most needs it is deciding whether to ask for an invite, or whether a child
 * may. Every sentence is one the code keeps; see `privacy.constants.ts` and
 * the test beside it. Drawn by `SectionedDocument`, as /terms is.
 */
export default async function PrivacyPage() {
  const locale = await currentLocale();
  return (
    <Page>
      <SiteHeader />

      <PageTitle title={PRIVACY_TITLE.en} kanji={PRIVACY_TITLE.kanji} lead={PRIVACY_SUBTITLE}>
        <p className="text-xs text-muted" data-testid="privacy-changed">
          Last changed {longDate(PRIVACY_CHANGED, locale)}
        </p>
      </PageTitle>

      <SectionedDocument sections={privacySections(PLAYER_SESSION_DAYS)} contact={CONTACT} testId="privacy-section" />
    </Page>
  );
}
