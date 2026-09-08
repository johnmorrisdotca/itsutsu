/**
 * The marks a reader may leave on a finished game.
 *
 * A fixed set, and every one of them kind. There is no way to say a game was
 * bad here, which is the point: a game nobody marks is simply quiet, and
 * quiet is not a verdict. The set is short so the row of them reads at a
 * glance rather than becoming a keyboard.
 */
export const APPLAUSE = [
  { emoji: "👏", label: "Well played" },
  { emoji: "🔥", label: "Brilliant" },
  { emoji: "😮", label: "Astonishing" },
  { emoji: "🙇", label: "Respect" },
  { emoji: "🌸", label: "A beautiful game" },
] as const;

export type ApplauseEmoji = (typeof APPLAUSE)[number]["emoji"];

export const APPLAUSE_EMOJI = APPLAUSE.map((one) => one.emoji) as [ApplauseEmoji, ...ApplauseEmoji[]];

/** What the reader is told the row is for. */
export const APPLAUSE_COPY = {
  title: { label: "Applause", kanji: "拍手" },
  hint: "Anybody who has seen this game may leave one mark on it. There is no way to boo.",
  yours: "Yours",
  none: "No applause yet. Be the first to say the game was worth playing.",
  signedOut: "Sign in to leave a mark on this game.",
} as const;
