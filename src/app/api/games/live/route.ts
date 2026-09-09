import { NextResponse } from "next/server";
import { z } from "zod";

import {
  NO_STORE,
  badRequest,
  readJson,
  serverError,
  unprocessable,
} from "@/lib/api/apiResponse";
import {
  DEFAULT_SETTINGS,
  SEED_RANGE,
  NO_HANDICAP,
  STONES,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import {
  boardSizeSchema,
  handicapSchema,
  moveTimeSchema,
  obstaclesSchema,
  sharedOpeningSchema,
  stoneSchema,
  timeoutPenaltySchema,
  variantSchema,
  playerNameSchema,
  drawLimitSchema,
} from "@/lib/history/gameSettingsSchema";
import { matchPath } from "@/lib/gomoku/slugs";
import { seatCookieName } from "@/lib/history/seatCookie";
import { parseHandicap } from "@/lib/history/gameSettingsSchema";
import { currentSession } from "@/lib/auth/currentSession";
import { isIgnoring } from "@/lib/social/ignores";
import { prisma } from "@/lib/prisma";
import { createLiveGame } from "@/lib/history/liveGame";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";

const liveGameSchema = z.object({
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
  rated: z.boolean().default(true),
  open: z.boolean().default(false),
  opener: stoneSchema.default(STONES.black),
  /** Two people at one screen: one seat key for both chairs, kept in this browser. */
  hotSeat: z.boolean().default(false),
  /** The seed the browser already dealt the board with; hot-seat games keep it. */
  seed: z.number().int().min(0).max(SEED_RANGE).optional(),
  /** The line length, where the game lets it vary. */
  winLength: z.number().int().min(3).max(19).optional(),
  /** A member to challenge: they get the white seat, the challenger black. */
  challenge: z.string().email().optional(),
  /** Start from a position in another game: its rules, and its first `move` moves. */
  from: z.object({ id: z.string().min(1).max(64), move: z.number().int().min(0).max(4096) }).optional(),
});

/** How long a claimed seat is remembered. */
const SEAT_COOKIE_DAYS = 30;

/**
 * Starts a game two people can play from different devices.
 *
 * The response carries a token per seat. There is no sign-in here, so the
 * token *is* the seat: whoever holds the link plays that colour. They are
 * returned exactly once, to whoever set the game up, to hand out.
 */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "live", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = liveGameSchema.safeParse(body);
    if (!parsed.success) {
      return unprocessable("That game could not be started.", parsed.error.issues);
    }

    /*
     * A challenge binds both seats to accounts, so the game appears in the
     * other member's list at once. It needs a signed-in challenger and a
     * member to challenge; names default to the accounts' own.
     */
    /*
     * A fork keeps the source's rules and seed, so the copied moves replay to
     * the same position. Whoever forks keeps their colour; the other seat goes
     * to the account that held it, when one did, else the fork is a game at
     * one screen that can be handed out from there.
     */
    let source: Record<string, unknown> = {};
    let challenge = parsed.data.challenge;
    let hotSeat = parsed.data.hotSeat;
    if (parsed.data.from !== undefined) {
      const origin = await prisma.game.findUnique({ where: { id: parsed.data.from.id } });
      if (origin === null) return NextResponse.json({ error: "No such game." }, { status: 404, headers: NO_STORE });
      if (parsed.data.from.move > origin.moveCount) return badRequest("That game has fewer moves.");
      source = {
        size: origin.size,
        variant: origin.variant,
        obstacles: origin.obstacles,
        opening: origin.opening,
        handicap: parseHandicap(origin.handicap),
        seed: origin.seed,
        opener: origin.opener,
        winLength: origin.winLength,
        blackName: origin.blackName,
        whiteName: origin.whiteName,
      };
      const me = await currentSession();
      const other =
        me?.email && origin.blackMember === me.email
          ? origin.whiteMember
          : me?.email && origin.whiteMember === me.email
            ? origin.blackMember
            : null;
      if (challenge === undefined && other !== null) challenge = other;
      if (challenge === undefined) hotSeat = true;
    }

    let seats: { blackMember?: string; whiteMember?: string; blackName?: string; whiteName?: string } = {};
    if (challenge !== undefined) {
      const me = await currentSession();
      if (!me?.email) return NextResponse.json({ error: "Sign in to challenge someone." }, { status: 401, headers: NO_STORE });
      const other = await prisma.member.findUnique({ where: { email: challenge } });
      if (other === null) return NextResponse.json({ error: "No such member." }, { status: 404, headers: NO_STORE });
      if (await isIgnoring(other.email, me.email)) {
        return NextResponse.json({ error: "That member is not taking games from you." }, { status: 403, headers: NO_STORE });
      }

      seats = {
        blackMember: me.email,
        whiteMember: other.email,
        blackName: parsed.data.blackName || me.name || "",
        whiteName: parsed.data.whiteName || other.name,
      };
    }

    const { challenge: _challenge, from, ...settings } = parsed.data;
    void _challenge;
    const merged = { ...settings, ...source, ...seats, hotSeat };
    const created = await createLiveGame({
      ...merged,
      from: from === undefined ? undefined : { id: from.id, moves: from.move },
      handicap: merged.handicap ?? NO_HANDICAP,
      winLength:
        VARIANT_SPECS[parsed.data.variant].winLength ??
        parsed.data.winLength ??
        DEFAULT_SETTINGS.winLength,
    });

    const response = NextResponse.json(created, {
      status: 201,
      headers: { ...NO_STORE, Location: matchPath(parsed.data.variant, created.id) },
    });
    // A hot-seat game is claimed by the browser that started it, here and now.
    if (hotSeat) {
      response.cookies.set({
        name: seatCookieName(created.id),
        value: created.blackToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SEAT_COOKIE_DAYS * 24 * 60 * 60,
      });
    }
    return response;
  } catch (error) {
    console.error(error);
    return serverError("Could not start that game.");
  }
}
