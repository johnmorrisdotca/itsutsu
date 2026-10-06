/**
 * messages.*: a conversation with one member, and why a message was not sent (ENJA-10).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_MESSAGES = {
  "messages.title": "Messages",
  "messages.with": "Between you and {who}",
  "messages.placeholder": "Write to them…",
  "messages.send": "Send",
  "messages.failed": "That did not send. Try again in a moment.",
  "messages.empty": "Nothing written yet. Say hello — it reaches their inbox.",
  "messages.ignored": "You have ignored them, so nothing they write is shown here, and you cannot write to them until you take it off.",
  "messages.you": "You",
  "messages.childClosed": "This player is under 13, so only the people on their own buddy list can write to them. If they add you as a buddy, you can write here.",
  "messages.nobody": "There is nobody here by that name to write to.",
  "messages.refuseNoSuchMember": "There is nobody by that name to write to.",
  "messages.refuseNotAPerson": "Only a person can be written to — a bot does not read.",
  "messages.refuseToYourself": "That is you.",
  "messages.refuseNotTaking": "They are not taking messages from you.",
  "messages.refuseYouIgnore": "You have ignored them. Take that off to write to them.",
  "messages.refuseChild": "This player is under 13, so only the people on their own buddy list can write to them.",
  "messages.refuseEmpty": "Say something first.",
  "messages.refuseTooLong": "That is too long for a message.",
} as const;
