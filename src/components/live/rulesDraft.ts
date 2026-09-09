import { OPENING_RULES, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { SHARED_OPENINGS } from "@/lib/history/gameSettingsSchema";

/**
 * The rules of a shared game while they are still being decided.
 *
 * The same set is settled in two places — before a game exists, on the setup
 * screen, and afterwards in the panel beside the board — so the shape and the
 * rules about which values may sit together live here rather than in either
 * screen. Two copies of "a Reversi game is 8×8" is one rule that can drift.
 */
export type RulesDraft = {
  variant: string;
  size: number;
  obstacles: string;
  opening: string;
  moveTimeMs: number | null;
  timeoutPenalty: string;
  clockMode: string;
  rated: boolean;
  allowResign: boolean;
  /** Posted on the games page for anyone to take. */
  open: boolean;
};

/**
 * One change to a draft, with the settings that cannot disagree brought into
 * line — the same corrections the engine would make, made where somebody can
 * still see them happen.
 *
 * A game keeps its own board: switching a 15×15 game to Reversi asks for the
 * 8×8 Reversi is played on rather than for a board it does not have. And an
 * opening the new game does not offer falls back to free, because the openings
 * belong to the line games and a reader switching to Halma is not choosing to
 * play a swap.
 */
export function applyRulesChange(current: RulesDraft, next: Partial<RulesDraft>): RulesDraft {
  const merged = { ...current, ...next };
  if (!SHARED_OPENINGS.includes(merged.opening as OpeningRule)) {
    merged.opening = OPENING_RULES.free;
  }
  merged.size = sizeForVariant(merged.variant as RuleVariant, merged.size);
  return merged;
}

/**
 * A game's rules as a draft: what the form edits, and what the statement says
 * once there is nothing left to edit. One conversion, so the two cannot come
 * to describe the same game differently.
 */
export function draftFromGame(game: {
  variant: string;
  size: number;
  obstacles: string;
  opening: string;
  moveTimeMs: number | null;
  timeoutPenalty: string;
  clockMode: string;
  rated: boolean;
  allowResign: boolean;
  openSeat: string | null;
}): RulesDraft {
  return {
    variant: game.variant,
    size: game.size,
    obstacles: game.obstacles,
    opening: game.opening,
    moveTimeMs: game.moveTimeMs,
    timeoutPenalty: game.timeoutPenalty,
    clockMode: game.clockMode,
    rated: game.rated,
    allowResign: game.allowResign,
    open: game.openSeat !== null,
  };
}
