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
import { opponentOf, seatsForRematch, settingsToCarry } from "@/lib/history/rematch";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { isIgnoring } from "@/lib/social/ignores";
import { prisma } from "@/lib/prisma";
import { createLiveGame } from "@/lib/history/liveGame";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { isBotId } from "@/lib/bots/bots";
import { playBotTurns } from "@/lib/bots/botPlay";
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
    let rematchSeats: { blackMemberId: string; whiteMemberId: string; blackName: string; whiteName: string } | null =
      null;

    /*
     * Playing that game again.
     *
     * Everything is taken from the game being replayed rather than from the
     * request, because a rematch is the same game and anything the caller
     * could send instead would be a way of it quietly not being one. The
     * opponent is found by id: the old Rematch button was addressed to an
     * email, so it could never be offered against a computer player, and that
     * is the case it is most wanted for.
     */
    if (parsed.data.rematch !== undefined) {
      const origin = await prisma.game.findUnique({ where: { id: parsed.data.rematch } });
      if (origin === null) return NextResponse.json({ error: "No such game." }, { status: 404, headers: NO_STORE });
      if (origin.status === "active") return badRequest("That game is still being played.");

      const me = await currentSession();
      const mineId = await currentMemberId();
      if (!me?.email || mineId === null) {
        return NextResponse.json({ error: "Sign in to play again." }, { status: 401, headers: NO_STORE });
      }
      const theirId = opponentOf(origin, mineId);
      if (theirId === null) {
        // Either they were not in it, or nobody was sitting opposite them.
        return NextResponse.json({ error: "You did not play that game." }, { status: 403, headers: NO_STORE });
      }
      const them = await prisma.member.findUnique({ where: { id: theirId } });
      if (them === null) return NextResponse.json({ error: "No such member." }, { status: 404, headers: NO_STORE });
      if (them.email !== null && (await isIgnoring(them.email, me.email))) {
        return NextResponse.json({ error: "That member is not taking games from you." }, { status: 403, headers: NO_STORE });
      }
      if (isBotId(them.id)) await ensureBotMembers();

      source = settingsToCarry(origin);
      rematchSeats = seatsForRematch(
        origin,
        { id: mineId, name: me.name || "" },
        { id: them.id, name: them.name },
      );
      if (rematchSeats === null) return NextResponse.json({ error: "You did not play that game." }, { status: 403, headers: NO_STORE });
    }
    if (parsed.data.from !== undefined) {
      const origin = await prisma.game.findUnique({ where: { id: parsed.data.from.id } });
      if (origin === null) return NextResponse.json({ error: "No such game." }, { status: 404, headers: NO_STORE });
      if (parsed.data.from.move > origin.moveCount) return badRequest("That game has fewer moves.");
      /*
       * The clock comes with it now. A fork used to carry the board and the
       * rules and then start the new game on whatever pace the defaults
       * happened to have, so a three-day-a-move game forked into a five-minute
       * one. Same module as the rematch, because they want the same answer.
       */
      source = {
        ...settingsToCarry(origin),
        blackName: origin.blackName,
        whiteName: origin.whiteName,
      };
      // Forking a game keeps the two players: whoever is not me in the game
      // being forked is who the new one is against, found by id and turned
      // back into the address a challenge is addressed to.
      const mine = await currentMemberId();
      const otherId =
        mine !== null && origin.blackMemberId === mine
          ? origin.whiteMemberId
          : mine !== null && origin.whiteMemberId === mine
            ? origin.blackMemberId
            : null;
      const otherMember =
        otherId === null
          ? null
          : await prisma.member.findUnique({ where: { id: otherId }, select: { email: true } });
      if (challenge === undefined && otherMember?.email) challenge = otherMember.email;
      if (challenge === undefined) hotSeat = true;
    }

    /*
     * A challenge to a computer player is a challenge like any other: it binds
     * both seats, it is rated, and it appears in both records. The only thing
     * it cannot be addressed by is an address, because a computer never signs
     * in and so has none — which is what `challengeId` is for.
     */
    const challengeId = parsed.data.challengeId;
    if (challengeId !== undefined && isBotId(challengeId)) await ensureBotMembers();

    let seats: { blackMemberId?: string; whiteMemberId?: string; blackName?: string; whiteName?: string } =
      rematchSeats ?? {};
    if (rematchSeats === null && (challenge !== undefined || challengeId !== undefined)) {
      const me = await currentSession();
      if (!me?.email) return NextResponse.json({ error: "Sign in to challenge someone." }, { status: 401, headers: NO_STORE });
      const mineId = await currentMemberId();
      if (mineId === null) return NextResponse.json({ error: "Sign in to challenge someone." }, { status: 401, headers: NO_STORE });
      const other =
        challengeId !== undefined
          ? await prisma.member.findUnique({ where: { id: challengeId } })
          : await prisma.member.findUnique({ where: { email: challenge } });
      if (other === null) return NextResponse.json({ error: "No such member." }, { status: 404, headers: NO_STORE });
      // A challenge is addressed to somebody who can answer it — or to a computer, which always can.
      const computer = isBotId(other.id);
      if (other.email === null && !computer) {
        return NextResponse.json({ error: "No such member." }, { status: 404, headers: NO_STORE });
      }
      // Nobody is ignored by a computer, so there is no list to consult.
      if (!computer && other.email !== null && (await isIgnoring(other.email, me.email))) {
        return NextResponse.json({ error: "That member is not taking games from you." }, { status: 403, headers: NO_STORE });
      }

      seats = {
        blackMemberId: mineId,
        whiteMemberId: other.id,
        blackName: parsed.data.blackName || me.name || "",
        whiteName: parsed.data.whiteName || other.name,
      };
    }

    /*
     * Whoever starts a game is sitting at it, and the row should say so from
     * the first moment rather than from whenever they happen to open their
     * own seat link.
     *
     * They were a stranger to their own game until then: with no member id on
     * either seat, the rule that stops somebody answering their own posted
     * invitation had nobody to recognise, so a poster could sit their own
     * open seat and play both colours — and because the two seat names can
     * differ, the result went to the ladder as a real game between two
     * people. Binding here is what gives that rule something to compare.
     *
     * Only for a posted seat, which is the case that needs it. Binding every
     * game's creator would also seat whoever started a private one from any
     * device, which is a bigger change than this bug asks for.
     */
    if (parsed.data.open === true && seats.blackMemberId === undefined) {
      const creator = await currentMemberId();
      if (creator !== null) seats = { ...seats, blackMemberId: creator };
    }

    const { challenge: _challenge, challengeId: _challengeId, rematch: _rematch, from, ...settings } = parsed.data;
    void _rematch;
    void _challenge;
    void _challengeId;
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

    /*
     * A computer holding the seat that opens plays its stone now, so the board
     * the challenger lands on is a board with a move on it rather than one
     * waiting on a player that never waits.
     */
    if (challengeId !== undefined && isBotId(challengeId)) {
      try {
        await playBotTurns(created.id);
      } catch (error) {
        console.error(error);
      }
    }

    /*
     * A posted seat's token is not the poster's to hold.
     *
     * Both tokens go back to whoever starts a private game, because they have
     * to send one of them to the person they mean to play. A seat posted on
     * the noticeboard is different: it is answered by sitting down, not by a
     * link, so there is nobody for the poster to send it to — and while they
     * held it they could play both colours from the API whatever the seat
     * rules said, since a token is the whole credential. Not returning it is
     * what shuts that, rather than another rule about who may sit where.
     */
    const posted = merged.open === true && !hotSeat;
    const created_body = posted ? { id: created.id, blackToken: created.blackToken } : created;
    const response = NextResponse.json(created_body, {
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
