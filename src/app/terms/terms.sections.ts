import { sectionsFrom } from "@/components/layout/documentOutline";
import type { DocumentSection } from "@/components/layout/SectionedDocument";
import type { Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";

import { CONTACT, TERMS_OUTLINE } from "./terms.constants";

/** The terms of play said in the reader's language. */
export function termsSections(say: Speaker): readonly DocumentSection[] {
  return sectionsFrom(say, TERMS_OUTLINE, { contact: CONTACT, site: SITE_NAME });
}
