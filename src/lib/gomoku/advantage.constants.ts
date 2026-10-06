import type { PhraseKey } from "../i18n/i18n.constants";

import { OUTLOOK_DISPLAY } from "./analysis.constants";
import type { AdvantageMeasure, UnreadableReason } from "./advantage.types";
import type { Outlook } from "./analysis.types";

/** The three kinds of reading, named so nothing compares against a bare string. */
export const ADVANTAGE_KINDS = {
  threats: "threats",
  count: "count",
  unreadable: "unreadable",
} as const;

export const ADVANTAGE_MEASURES = {
  discs: "discs",
  home: "home",
  material: "material",
  score: "score",
} as const satisfies Record<AdvantageMeasure, AdvantageMeasure>;

export const UNREADABLE_REASONS = {
  turning: "turning",
  queued: "queued",
  connection: "connection",
  square: "square",
  asymmetric: "asymmetric",
  shared: "shared",
} as const satisfies Record<UnreadableReason, UnreadableReason>;

/**
 * What each counted quantity is called, and what it is worth knowing.
 *
 * `fewer` marks a count the misère games invert: in Anti-Reversi the player
 * with more discs is the one in trouble, so a panel that called the bigger
 * number the lead would be confidently wrong in the one game where it matters
 * most. The flag is set from the variant's spec, never from its name.
 */
export const MEASURE_DISPLAY: Record<
  AdvantageMeasure,
  { label: string; kanji: string; note: PhraseKey; fewerNote: PhraseKey }
> = {
  discs: {
    label: "Discs on the board",
    kanji: "石数",
    note: "advantage.discsNote",
    fewerNote:
      "advantage.discsFewerNote",
  },
  home: {
    label: "Pieces home",
    kanji: "上がり",
    note: "advantage.homeNote",
    fewerNote: "advantage.homeFewerNote",
  },
  score: {
    label: "Score",
    kanji: "目",
    note: "advantage.scoreNote",
    fewerNote: "advantage.scoreFewerNote",
  },
  material: {
    label: "Pieces left",
    kanji: "駒数",
    note: "advantage.materialNote",
    fewerNote: "advantage.materialFewerNote",
  },
};

/**
 * Why this game gets no reading, said plainly.
 *
 * Each sentence names the property of the game that defeats a reading, so a
 * player learns something about what they are playing rather than being told
 * the feature is unavailable. This is the whole point of the row: an honest
 * "this cannot be read" is worth more than a fabricated number, and far more
 * than an even bar, which quietly asserts the two sides are level.
 */
export const UNREADABLE_DISPLAY: Record<
  UnreadableReason,
  { label: PhraseKey; kanji: string; sentence: PhraseKey }
> = {
  turning: {
    label: "advantage.unreadable",
    kanji: "回転",
    sentence:
      "advantage.unreadableTurning",
  },
  queued: {
    label: "advantage.unreadable",
    kanji: "駒待ち",
    sentence:
      "advantage.unreadableQueued",
  },
  connection: {
    label: "advantage.unreadable",
    kanji: "連結",
    sentence:
      "advantage.unreadableConnection",
  },
  square: {
    label: "advantage.unreadable",
    kanji: "四隅",
    sentence:
      "advantage.unreadableSquare",
  },
  asymmetric: {
    label: "advantage.unreadable",
    kanji: "攻守",
    sentence:
      "advantage.unreadableAsymmetric",
  },
  shared: {
    label: "advantage.unreadable",
    kanji: "共有",
    sentence:
      "advantage.unreadableShared",
  },
};

/** How the reading heads its two-sided threat verdict. */
export const LEAD_DISPLAY = {
  level: { label: "Even", kanji: "互角" },
  decided: { label: "Already decided", kanji: "決着" },
} as const;

/**
 * The same seven outlooks, said about somebody rather than to them.
 *
 * `OUTLOOK_DISPLAY` addresses the player to move — "You have the initiative" —
 * which is right for the banner over their own board and unusable in a panel
 * that prints both colours at once, where it would tell White that Black's
 * position is theirs. The kanji are deliberately the same as the banner's, and
 * a test holds them to that: one game, two places, one vocabulary.
 */
export const OUTLOOK_SIDE_DISPLAY: Record<Outlook, { label: string; kanji: string }> = {
  won: { label: "Has won", kanji: OUTLOOK_DISPLAY.won.kanji },
  winning: { label: "Has a win that cannot be stopped", kanji: OUTLOOK_DISPLAY.winning.kanji },
  ahead: { label: "Has the initiative", kanji: OUTLOOK_DISPLAY.ahead.kanji },
  even: { label: "Nothing forced", kanji: OUTLOOK_DISPLAY.even.kanji },
  danger: { label: "Has a threat to answer", kanji: OUTLOOK_DISPLAY.danger.kanji },
  critical: { label: "One move from losing", kanji: OUTLOOK_DISPLAY.critical.kanji },
  lost: { label: "Cannot stop the win", kanji: OUTLOOK_DISPLAY.lost.kanji },
};

/**
 * What the threat reading is, said once under it.
 *
 * It carries no number on purpose, and this line is where that is admitted
 * rather than hidden: the site does not search, so a percentage would be a
 * guess wearing the clothes of a measurement.
 */
export const THREATS_NOTE: PhraseKey = "advantage.threatsNote";

