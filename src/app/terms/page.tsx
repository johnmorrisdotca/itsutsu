import { GoverningNote } from "@/components/layout/GoverningNote";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SectionedDocument, longDate } from "@/components/layout/SectionedDocument";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

import { CONTACT, TERMS_CHANGED, TERMS_KANJI } from "./terms.constants";
import { termsSections } from "./terms.sections";

export async function generateMetadata() {
  const say = await currentSpeaker();
  return { title: say.say("terms.title"), description: say.say("terms.subtitle") };
}

/**
 * The terms of play (PRIV-05): one account each, your own moves, kindness at
 * the board, how an account is shut or ended, and what the site promises.
 *
 * Open to strangers (`OPEN_EXACTLY` in `proxy.ts`), like /privacy beside it,
 * because the reader deciding whether to ask for an invite is the one it is
 * for. Drawn by `SectionedDocument`, exactly as /privacy is, and in the same
 * way it opens, for a reader whose language is not English, with the line that
 * says the English version governs (ENJA-11).
 */
export default async function TermsPage() {
  const say = await currentSpeaker();
  return (
    <Page>
      <SiteHeader />

      <PageTitle title={say.say("terms.title")} kanji={TERMS_KANJI} lead={say.say("terms.subtitle")}>
        <GoverningNote say={say} phrase="terms.governing" testId="terms-governing" />
        <p className="text-xs text-muted" data-testid="terms-changed">
          {say.say("terms.lastChanged", { date: longDate(TERMS_CHANGED, say.locale) })}
        </p>
      </PageTitle>

      <SectionedDocument sections={termsSections(say)} contact={CONTACT} testId="terms-section" />
    </Page>
  );
}
