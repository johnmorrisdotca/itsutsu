import type { Speaker } from "@/lib/i18n/i18n";

import { CONTACT_ADDRESS, MAIL_CAPS, MAIL_REFUSAL_PHRASE } from "./mail.constants";
import type { MailRefusal } from "./mail.types";

/**
 * What a person is told when an email they asked for was not sent, in their language. The two figures a refusal can
 * name (a day's limit and the contact address) are read from where they live, never typed into a sentence.
 */
export function mailRefusalText(say: Speaker, refusal: MailRefusal): string {
  return say.say(MAIL_REFUSAL_PHRASE[refusal], { limit: String(MAIL_CAPS.memberDay), address: CONTACT_ADDRESS });
}
