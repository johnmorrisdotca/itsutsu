import type { Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";

/**
 * A MEMBER WHO HAS NOT CHOSEN A NAME is stored as "Guest" and four characters (`freeGuestName`), and printed
 * shortened as "Guest A." (`shownName`). The word is the site's own, not anybody's name, so a reader of Japanese
 * is shown it in Japanese ("ゲスト A.") while the stored name, the address and the record keep the English
 * placeholder, which is what makes it findable and never changes under a member.
 */
const GUEST_PLACEHOLDER = /^Guest(?: ([A-Z0-9]{1,4}\.?))?$/;

/** A name as a reader is shown it: a guest placeholder said in the reader's language, any other name unchanged. */
export function inReadersLanguage(shown: string, say: Speaker): string {
  const match = GUEST_PLACEHOLDER.exec(shown);
  if (match === null || say.locale === DEFAULT_LOCALE) return shown;
  const guest = say.say("points.board.guest");
  return match[1] === undefined ? guest : `${guest} ${match[1]}`;
}
