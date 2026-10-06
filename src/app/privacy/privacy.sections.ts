import { sectionsFrom } from "@/components/layout/documentOutline";
import type { DocumentSection } from "@/components/layout/SectionedDocument";
import type { Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";

import { CONTACT, PRIVACY_OUTLINE } from "./privacy.constants";

/**
 * The privacy page said in the reader's language.
 *
 * The one figure that is not typed in a sentence is how long a words-only account lives: it is filled from
 * `PLAYER_SESSION_DAYS` (the page passes it in), so the sentence cannot drift from the cookie. It is said once, as
 * `privacy.wordsAccount`, and set into the sentence about how you sign in.
 */
export function privacySections(say: Speaker, days: number): readonly DocumentSection[] {
  const wordsAccount = say.say("privacy.wordsAccount", { days: String(days) });
  return sectionsFrom(say, PRIVACY_OUTLINE, { contact: CONTACT, site: SITE_NAME, wordsAccount });
}
