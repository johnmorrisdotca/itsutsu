import { z } from "zod";

import { DEFAULT_SETTINGS, SEED_RANGE, STONES } from "@/lib/gomoku/gomoku.constants";
import {
  boardSizeSchema,
  drawLimitSchema,
  handicapSchema,
  moveTimeSchema,
  obstaclesSchema,
  playerNameSchema,
  sharedOpeningSchema,
  stoneSchema,
  timeoutPenaltySchema,
  variantSchema,
} from "./gameSettingsSchema";

/**
 * WHAT A CALLER ASKED FOR WHEN THEY ASKED FOR A GAME.
 *
 * The shape `POST /api/games/live` accepts, and the one thing the parsed shape
 * cannot say: which fields the caller actually NAMED. Both halves travel
 * together as `CreationAsked`, because every reader of one wants the other, and
 * they were four hundred lines apart in the route this was split out of.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE RAW KEYS TRAVEL BESIDE THE PARSED BODY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Zod fills a default in for every field it was not given, so a parsed body
 * cannot tell silence from a choice. For most of this route that does not
 * matter; for a fork it decides the game. A fork takes its clock, its penalty
 * and its rating from the game being forked UNLESS the caller settled one
 * itself — see `FORK_PACE_SETTINGS` — and after parsing, "the caller said
 * nothing about the clock" and "the caller asked for five minutes a move"
 * both read as a number. The raw keys are the only thing that knows.
 *
 * That is `said`. It is a set of names rather than the body itself, because
 * nothing downstream has any business reading unvalidated values — only
 * whether they were there.
 */

export const liveGameSchema = z.object({
  blackName: playerNameSchema.default(""),
  whiteName: playerNameSchema.default(""),
  size: boardSizeSchema.default(DEFAULT_SETTINGS.size),
  variant: variantSchema,
  obstacles: obstaclesSchema,
  opening: sharedOpeningSchema,
  handicap: handicapSchema,
  moveTimeMs: moveTimeSchema,
  timeoutPenalty: timeoutPenaltySchema,
  allowResign: z.boolean().default(true),
  drawLimit: drawLimitSchema,
  clockMode: z.enum(["move", "game"]).default("move"),
  /*
   * Not defaulted. A caller that says nothing here has not chosen a side,
   * and `true` used to stand in for that silence — which is how a hot-seat
   * scratch board reached a real ladder with neither player having asked
   * for a rated game. Absent is resolved explicitly by `ratedAtCreation`,
   * against `hotSeat`, rather than folded into the schema where the next
   * reader would not think to look for it.
   */
  rated: z.boolean().optional(),
  open: z.boolean().default(false),
  opener: stoneSchema.default(STONES.black),
  /** Two people at one screen: one seat key for both chairs, kept in this browser. */
  hotSeat: z.boolean().default(false),
  /**
   * Play that game again: the same board, the same rules and the same clock,
   * against the same person, with the colours swapped.
   *
   * Asked for explicitly rather than inferred from a fork at move nought,
   * because the two want opposite things about the seats — a fork continues a
   * position and the position belongs to the colours that were in it.
   */
  rematch: z.string().min(1).max(64).optional(),
  /** The seed the browser already dealt the board with; hot-seat games keep it. */
  seed: z.number().int().min(0).max(SEED_RANGE).optional(),
  /** The line length, where the game lets it vary. */
  winLength: z.number().int().min(3).max(19).optional(),
  /** A member to challenge: they get the white seat, the challenger black. */
  challenge: z.string().email().optional(),
  /**
   * The same, by member id rather than by address.
   *
   * A member is named by their id and an address is only how they sign in, so
   * this is the form that always works — and the only form that works for a
   * computer player, which has no address because it never signs in.
   */
  challengeId: z.string().min(3).max(32).optional(),
  /** Start from a position in another game: its rules, and its first `move` moves. */
  from: z.object({ id: z.string().min(1).max(64), move: z.number().int().min(0).max(4096) }).optional(),
});

/** The request as the schema made it: every default filled in. */
export type LiveGameRequest = z.infer<typeof liveGameSchema>;

/**
 * A creation refused, in the words and the status the caller gets.
 *
 * THE REASON RATHER THAN THE RESPONSE, which is this codebase's habit and not
 * a preference: `activeLimitRefusal` returns a sentence and the route wraps
 * it. A module that builds its own `NextResponse` cannot be asked what it
 * decided — only shown — and every one of these refusals is a decision worth
 * being able to test by name. `refusalResponse` in `liveResponse.ts` is the
 * one place that turns them into an answer.
 *
 * `issues` is the schema's own account of which fields were wrong, and only
 * ever rides a 422.
 */
export type CreationRefusal = {
  status: 400 | 401 | 403 | 404 | 422;
  error: string;
  issues?: unknown;
};

/** What was asked for: the parsed body, and the fields the caller actually named. */
export type CreationAsked = {
  data: LiveGameRequest;
  /**
   * The keys the caller sent, whatever their values. Read by the fork, which
   * has to tell "say nothing and keep the forked game's pace" from "I have
   * settled the pace myself".
   */
  said: ReadonlySet<string>;
};

/**
 * The field names a caller actually sent.
 *
 * An empty set for anything that is not a plain object — an array, a string, a
 * number — which is right rather than defensive: the schema refuses all of
 * those a line later, and a set of nothing is the honest answer to "which
 * fields did this name" for a body that names no fields.
 */
export function keysSaid(body: unknown): ReadonlySet<string> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return new Set();
  return new Set(Object.keys(body));
}

/**
 * Reads a creation request: the body as the schema makes it, or why not.
 *
 * Takes the already-decoded body rather than the `Request`, so it can be
 * tested with an object and so the route keeps the one thing that is genuinely
 * about HTTP — a body that was not JSON at all.
 */
export function readCreation(
  body: unknown,
): { refused: CreationRefusal } | { asked: CreationAsked } {
  const parsed = liveGameSchema.safeParse(body);
  if (!parsed.success) {
    return {
      refused: { status: 422, error: "That game could not be started.", issues: parsed.error.issues },
    };
  }
  return { asked: { data: parsed.data, said: keysSaid(body) } };
}
