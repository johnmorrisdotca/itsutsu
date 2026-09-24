/** The words of a conversation page; see `/messages/[memberId]`. */
export const MESSAGE_COPY = {
  title: "Messages",
  kanji: "手紙",
  with: "Between you and",
  placeholder: "Write to them…",
  send: "Send 送信",
  failed: "That did not send. Try again in a moment.",
  empty: "Nothing written yet. Say hello — it reaches their inbox.",
  ignored: "You have ignored them, so nothing they write is shown here, and you cannot write to them until you take it off.",
  you: "You",
  childClosed:
    "This player is under 13, so only the people on their own buddy list can write to them. If they add you as a buddy, you can write here.",
  nobody: "There is nobody here by that name to write to.",
} as const;
