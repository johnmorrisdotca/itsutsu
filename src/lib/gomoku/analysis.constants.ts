import type { Outlook, SuggestionReason, ThreatKind } from "./analysis.types";

/** Visual weight the UI gives a message. Never affects play. */
export type AdviceTone = "calm" | "good" | "great" | "warn" | "alarm";

export const OUTLOOKS = {
  won: "won",
  winning: "winning",
  ahead: "ahead",
  even: "even",
  danger: "danger",
  critical: "critical",
  lost: "lost",
} as const satisfies Record<Outlook, Outlook>;

/**
 * How each outlook is announced. The wording deliberately tells a player what
 * is on the board without telling them where — seeing it is still their job.
 */
export const OUTLOOK_DISPLAY: Record<
  Outlook,
  { label: string; kanji: string; tone: AdviceTone; detail: string }
> = {
  won: {
    label: "Won",
    kanji: "勝",
    tone: "great",
    detail: "Five in a row. The game is over.",
  },
  winning: {
    label: "You can force a win",
    kanji: "必勝",
    tone: "great",
    detail: "There is a line here the other side cannot stop. Do you see it?",
  },
  ahead: {
    label: "You have the initiative",
    kanji: "優勢",
    tone: "good",
    detail: "Your threats are the ones being answered. Keep them coming.",
  },
  even: {
    label: "Even",
    kanji: "互角",
    tone: "calm",
    detail: "Nothing forced on the board yet.",
  },
  danger: {
    label: "You must answer this",
    kanji: "受",
    tone: "warn",
    detail: "There is a threat on the board. Deal with it or it becomes a five.",
  },
  critical: {
    label: "One move from losing",
    kanji: "危",
    tone: "alarm",
    detail: "Block now, in exactly the right place, or the next stone settles it.",
  },
  lost: {
    label: "This is lost",
    kanji: "敗勢",
    tone: "alarm",
    detail: "Your opponent has a win you can no longer stop, if they find it.",
  },
};

/** 敗着 (haichaku) — the go and shogi term for the move that loses the game. */
export const FATAL_MOVE_DISPLAY = {
  label: "Losing move",
  kanji: "敗着",
  detail: "This move handed the game away. It was still playable before it.",
};

export const THREAT_DISPLAY: Record<
  ThreatKind,
  { label: string; kanji: string }
> = {
  five: { label: "Five", kanji: "五連" },
  openFour: { label: "Open four", kanji: "活四" },
  doubleThreat: { label: "Double threat", kanji: "四三" },
  four: { label: "Four", kanji: "四" },
  openThree: { label: "Open three", kanji: "活三" },
};

export const SUGGESTION_DISPLAY: Record<
  SuggestionReason,
  { label: string; kanji: string }
> = {
  win: { label: "Completes five", kanji: "五連" },
  blockWin: { label: "Must block", kanji: "受け" },
  openFour: { label: "Makes an open four", kanji: "活四" },
  blockOpenFour: { label: "Stops an open four", kanji: "四止め" },
  doubleThreat: { label: "Two threats at once", kanji: "四三" },
  blockDoubleThreat: { label: "Breaks the double threat", kanji: "四三受け" },
  four: { label: "Forcing four", kanji: "四" },
  openThree: { label: "Builds an open three", kanji: "活三" },
  blockOpenThree: { label: "Blocks the three", kanji: "三受け" },
  shape: { label: "Best shape", kanji: "好形" },
  opening: { label: "Opening point", kanji: "布石" },
};

/** Weight given to a window by how many friendly stones it already holds. */
export const SHAPE_BASE = 4;

/** How much a suggestion values blocking relative to building. */
export const DEFENCE_WEIGHT = 0.85;
