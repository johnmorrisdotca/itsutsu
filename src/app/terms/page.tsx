import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SectionedDocument, longDate } from "@/components/layout/SectionedDocument";
import { SiteHeader } from "@/components/layout/SiteHeader";

import { CONTACT, TERMS_CHANGED, TERMS_SECTIONS, TERMS_SUBTITLE, TERMS_TITLE } from "./terms.constants";

export const metadata = {
  title: TERMS_TITLE.en,
  description: TERMS_SUBTITLE,
};

/**
 * The terms of play (PRIV-05): one account each, your own moves, kindness at
 * the board, how an account is shut or ended, and what the site promises.
 *
 * Open to strangers (`OPEN_EXACTLY` in `proxy.ts`), like /privacy beside it,
 * because the reader deciding whether to ask for an invite is the one it is
 * for. Drawn by `SectionedDocument`, exactly as /privacy is.
 */
export default function TermsPage() {
  return (
    <Page>
      <SiteHeader />

      <PageTitle title={TERMS_TITLE.en} kanji={TERMS_TITLE.kanji} lead={TERMS_SUBTITLE}>
        <p className="text-xs text-muted" data-testid="terms-changed">
          Last changed {longDate(TERMS_CHANGED)}
        </p>
      </PageTitle>

      <SectionedDocument sections={TERMS_SECTIONS} contact={CONTACT} testId="terms-section" />
    </Page>
  );
}
