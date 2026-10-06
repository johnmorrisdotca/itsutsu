import type { PhraseKey } from "../i18n/i18n.constants";

/**
 * The marks a reader may leave on a finished game.
 *
 * A fixed set, and every one of them kind. There is no way to say a game was
 * bad here, which is the point: a game nobody marks is simply quiet, and
 * quiet is not a verdict. The set is short so the row of them reads at a
 * glance rather than becoming a keyboard.
 */
export const APPLAUSE = [
  { emoji: "👏", label: "played.applauseWell", slug: "well-played" },
  { emoji: "🔥", label: "played.applauseBrilliant", slug: "brilliant" },
  { emoji: "😮", label: "played.applauseAstonishing", slug: "astonishing" },
  { emoji: "🙇", label: "played.applauseRespect", slug: "respect" },
  { emoji: "🌸", label: "played.applauseBeautiful", slug: "a-beautiful-game" },
] as const satisfies readonly { emoji: string; label: PhraseKey; slug: string }[];

export type ApplauseEmoji = (typeof APPLAUSE)[number]["emoji"];

export const APPLAUSE_EMOJI = APPLAUSE.map((one) => one.emoji) as [ApplauseEmoji, ...ApplauseEmoji[]];

/** What the reader is told the row is for. */
export const APPLAUSE_COPY = {
  title: { label: "played.applauseTitle", kanji: "拍手" },
  hint: "played.applauseHint",
  yours: "played.applauseYours",
  none: "played.applauseNone",
  signedOut: "played.applauseSignedOut",
  /*
   * For somebody who came in by invite code: signed in, so "sign in" would be
   * false, and with no address, which the applause route needs to know whose
   * mark is whose.
   */
  noAccount: "played.applauseNoAccount",
} as const satisfies Record<string, PhraseKey | { label: PhraseKey; kanji: string }>;
