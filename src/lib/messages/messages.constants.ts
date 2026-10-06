import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/** The longest message: a few sentences, not a letter. */
export const MESSAGE_TEXT_MAX = 500;

/** How much of a conversation a page shows, newest last. */
export const THREAD_SHOWN = 200;

/** Where a conversation with a member lives, by their opaque id. */
export function messagesPath(memberId: string): string {
  return `/messages/${encodeURIComponent(memberId)}`;
}

/** Why a message was not sent, as the phrase the sender is told (`messages.refuse*`), in the sender's own language. */
export const MESSAGE_REFUSALS = {
  "no-such-member": "messages.refuseNoSuchMember",
  "not-a-person": "messages.refuseNotAPerson",
  "to-yourself": "messages.refuseToYourself",
  "not-taking-messages": "messages.refuseNotTaking",
  "you-ignore-them": "messages.refuseYouIgnore",
  // A member under 13 hears only from their own buddies (childRules.ts, PRIV-03).
  "child-buddies-only": "messages.refuseChild",
  "empty": "messages.refuseEmpty",
  "too-long": "messages.refuseTooLong",
} as const satisfies Record<string, PhraseKey>;

export type MessageRefusal = keyof typeof MESSAGE_REFUSALS;
