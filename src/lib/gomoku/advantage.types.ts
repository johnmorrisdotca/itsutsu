import type { Outlook } from "./analysis.types";
import type { Stone } from "./gomoku.types";

/**
 * A fact about the position that can be counted, where a reading of threats
 * would say nothing true.
 *
 * These are quantities, not judgements: how many discs are on the board, how
 * many pieces are home, how many pieces are left. Nobody has to agree with a
 * count. That is exactly why these games get one and the threat reading does
 * not get a number.
 */
export type AdvantageMeasure = "discs" | "home" | "material";

/**
 * Why a game cannot be read at all — each one a property of that game, not an
 * apology for the reading being unfinished.
 */
export type UnreadableReason =
  | "turning"
  | "queued"
  | "connection"
  | "square"
  | "asymmetric"
  | "shared";

/** Which colour the reading favours, or neither. */
export type Lead = Stone | null;

/**
 * How this game stands, in whichever terms this game can honestly be put.
 *
 * Three kinds, and the difference between them is the point. A threat reading
 * is a judgement and carries no number; a count is a fact and carries one;
 * a game that supports neither says so rather than being handed a bar at
 * fifty-fifty, which would be a claim of its own.
 */
export type Advantage =
  | { kind: "threats"; outlook: Record<Stone, Outlook>; decided: boolean; lead: Lead }
  | {
      kind: "count";
      measure: AdvantageMeasure;
      black: number;
      white: number;
      lead: Lead;
      /** True where the smaller number is the better one, as in Anti-Reversi. */
      fewer: boolean;
    }
  | { kind: "unreadable"; reason: UnreadableReason };
