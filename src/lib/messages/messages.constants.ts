/** The longest message: a few sentences, not a letter. */
export const MESSAGE_TEXT_MAX = 500;

/** How much of a conversation a page shows, newest last. */
export const THREAD_SHOWN = 200;

/** Where a conversation with a member lives, by their opaque id. */
export function messagesPath(memberId: string): string {
  return `/messages/${encodeURIComponent(memberId)}`;
}

/** Why a message was not sent, in the words the sender is told. */
export const MESSAGE_REFUSALS = {
  "no-such-member": "There is nobody by that name to write to.",
  "not-a-person": "Only a person can be written to — a bot does not read.",
  "to-yourself": "That is you.",
  "not-taking-messages": "They are not taking messages from you.",
  "you-ignore-them": "You have ignored them. Take that off to write to them.",
  // A member under 13 hears only from their own buddies (childRules.ts, PRIV-03).
  "child-buddies-only": "This player is under 13, so only the people on their own buddy list can write to them.",
  "empty": "Say something first.",
  "too-long": "That is too long for a message.",
} as const;

export type MessageRefusal = keyof typeof MESSAGE_REFUSALS;
