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
  { label: string; kanji: string; note: string; fewerNote: string }
> = {
  discs: {
    label: "Discs on the board",
    kanji: "石数",
    note: "A count, not a forecast. The lead in a flipping game changes hands late and often — a board that looks settled at move thirty rarely is.",
    fewerNote:
      "A count, not a forecast. Here the smaller number is the better one: the object is to finish with fewer discs than your opponent.",
  },
  home: {
    label: "Pieces home",
    kanji: "上がり",
    note: "A count of pieces that have reached the far camp. It says how far along the race each side is, not who will get there first — a train of pieces left behind can move faster than one that is already spread out.",
    fewerNote: "A count of pieces that have reached the far camp.",
  },
  material: {
    label: "Pieces left",
    kanji: "駒数",
    note: "A plain count of pieces still on the board, kings included. Material is most of the game here, but a piece about to be forced into a capture is still counted — the number does not know what happens next.",
    fewerNote: "A plain count of pieces still on the board, kings included.",
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
  { label: string; kanji: string; sentence: string }
> = {
  turning: {
    label: "This game cannot be read that way",
    kanji: "回転",
    sentence:
      "A quarter of the board turns after every stone. Nothing counted about this position survives the next move intact, so any reading of it would be out of date before it was shown.",
  },
  queued: {
    label: "This game cannot be read that way",
    kanji: "駒待ち",
    sentence:
      "Pieces here cover several points at once, and what you may play next is whatever the queue hands you. A reading of lines assumes single stones placed freely, and neither is true here.",
  },
  connection: {
    label: "This game cannot be read that way",
    kanji: "連結",
    sentence:
      "The whole position is one question — whether a chain reaches side to side — and it is not a question a count of stones can answer. One stone can join two groups and settle a board that looked even.",
  },
  square: {
    label: "This game cannot be read that way",
    kanji: "四隅",
    sentence:
      "The win is a square rather than a line, and both sides keep the same four pieces from first move to last. There is nothing to count that is not equal, and no line to read.",
  },
  asymmetric: {
    label: "This game cannot be read that way",
    kanji: "攻守",
    sentence:
      "The two players do not want the same thing here: one is trying to make a line, the other to prevent every line. There is no single quantity both sides can be ahead on.",
  },
  shared: {
    label: "This game cannot be read that way",
    kanji: "共有",
    sentence:
      "The stones do not belong to a colour in this game, so there is no black position and no white one to weigh against each other — only the shape both players are building together.",
  },
};

/** How the reading heads its two-sided threat verdict. */
export const LEAD_DISPLAY = {
  level: { label: "Level", kanji: "互角" },
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
export const THREATS_NOTE =
  "A reading of the threats on the board, in words rather than a percentage — this site does not search the position, and a number would suggest it had.";

