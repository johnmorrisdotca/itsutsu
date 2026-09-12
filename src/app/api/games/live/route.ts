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
import { FORK_PACE_SETTINGS, opponentOf, seatsForRematch, settingsToCarry } from "@/lib/history/rematch";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { isIgnoring } from "@/lib/social/ignores";
import { prisma } from "@/lib/prisma";
import { createLiveGame } from "@/lib/history/liveGame";
import { activeLimitRefusal, memberOverActiveLimit } from "@/lib/history/activeGames";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { isBotId } from "@/lib/bots/bots";
import { playBotTurns } from "@/lib/bots/botPlay";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { awardCreatedGame, createdGameKind } from "@/lib/xp/xpSocial";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { UnwinnableGame } from "@/lib/history/winnableGame";

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
  /*
   * Not defaulted. A caller that says nothing here has not chosen a side,
   * and `true` used to stand in for that silence — which is how a hot-seat
   * scratch board reached a real ladder with neither player having asked
   * for a rated game. Absent is resolved explicitly below, against
   * `hotSeat`, rather than folded into the schema where the next reader
   * would not think to look for it.
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
      /*
       * EXCEPT WHERE THE CALLER HAS SETTLED THE PACE ITSELF.
       *
       * `source` is spread over the request below, which is right for everything
       * the POSITION depends on and wrong for everything about the moves still
       * to come — see `FORK_PACE_SETTINGS` for which is which and why. Without
       * this, a fork's setup screen would offer a clock, a penalty and a
       * friendly game and have all three thrown away on the way in: a form of
       * controls that do nothing.
       *
       * KEYED ON WHAT THE CALLER ACTUALLY SENT, not on what came out of the
       * schema. Zod fills a default in for every field it was not given, so the
       * parsed body cannot tell silence from a choice — and silence here has to
       * go on meaning "the game I forked", which is the whole of the fix above.
       * The raw body is the only thing that knows the difference.
       */
      const said = new Set(
        body !== null && typeof body === "object" && !Array.isArray(body) ? Object.keys(body) : [],
      );
      for (const key of FORK_PACE_SETTINGS) if (said.has(key)) delete source[key];
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

    /*
     * Twenty boards is already more than anybody plays in a week here, so a
     * twenty-first is not the game that was waiting on somebody — it is the
     * site letting a pile grow past where a person can keep up with it.
     * Checked against both seats a creation could fill, not only whoever is
     * asking: a challenge hands the other side a new board too, and they can
     * be just as buried as the challenger. Refused before the game is
     * written, the same as every other reason this route says no.
     */
    const atTheLimit = await memberOverActiveLimit([seats.blackMemberId, seats.whiteMemberId]);
    if (atTheLimit !== null) return unprocessable(activeLimitRefusal(atTheLimit));

    const {
      challenge: _challenge,
      challengeId: _challengeId,
      rematch: _rematch,
      from,
      rated: ratedRequested,
      ...settings
    } = parsed.data;
    void _rematch;
    void _challenge;
    void _challengeId;
    /*
     * Whether THIS game moves a rating, resolved here rather than defaulted
     * in the schema: said outright when the caller said it, and otherwise
     * decided by what kind of game this is. A hot-seat board is somebody
     * trying a board out at one screen — nobody asked for a rated game — so
     * silence there means no. Everywhere else silence keeps meaning yes,
     * which is what a challenge and a posted seat have always meant by
     * saying nothing: `StartGame` and `ChallengeButton` rely on exactly
     * that and never send `hotSeat`, so nothing here changes what they
     * create. A rematch or a fork overrides this anyway, through
     * `source.rated` below — that game already answered the question, and
     * is not being asked again.
     */
    const rated = ratedRequested ?? !hotSeat;
    const merged = { ...settings, rated, ...source, ...seats, hotSeat };
    /*
     * The variant the game will ACTUALLY be played under, which is not always
     * the one the request named. A rematch and a fork take their rules from
     * the game they came from, through `source`, and send no variant at
     * all — so `parsed.data.variant` falls back to the schema's default of
     * freestyle, whose winLength is null, and the line below then fell all the
     * way through to five.
     *
     * That made a rematched game of noughts and crosses UNWINNABLE: three in a
     * row on a three-by-three board, needing five in a row to win. John found
     * it playing his daughter — he put his winning move down and nothing
     * happened, because on that board nothing ever could.
     */
    const playedAs = (typeof merged.variant === "string" ? merged.variant : parsed.data.variant) as RuleVariant;
    /*
     * THE SAME BUG AGAIN, ONE STEP FURTHER ALONG, and the fix above did not
     * reach it.
     *
     * That fix asks the VARIANT'S SPEC for the line length, which settles every
     * game that fixes its own — noughts and crosses is three in a row and cannot
     * be anything else, so a rematch of one is safe. Freestyle gomoku does not
     * fix one: its spec says null, because the length is a thing the two players
     * agree. And the line below then read the length out of the REQUEST — which
     * for a rematch says nothing at all, since a rematch sends its game's id and
     * nothing else on purpose.
     *
     * So a 9×9 freestyle game two people had agreed at THREE in a row came back
     * from a rematch needing five. Same shape as John's unwinnable board, same
     * cause, and invisible to the test that covers it because that test uses a
     * variant whose spec has an answer.
     *
     * `merged` is the game as it will actually be played: the request, with a
     * rematch's or a fork's own settings laid over it. That is the thing to ask,
     * and asking the request instead is what let a carried value be dropped
     * between being carried and being used.
     */
    const carriedLine = typeof merged.winLength === "number" ? merged.winLength : undefined;
    const created = await createLiveGame({
      ...merged,
      from: from === undefined ? undefined : { id: from.id, moves: from.move },
      handicap: merged.handicap ?? NO_HANDICAP,
      winLength:
        VARIANT_SPECS[playedAs].winLength ??
        carriedLine ??
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
     * A SEAT THAT IS SOMEBODY ELSE'S IS NOT YOURS TO HOLD THE TOKEN FOR.
     *
     * A token is the whole credential. `stoneForToken` is what every
     * seat-bound endpoint identifies a player by — resigning, moving, giving
     * time, claiming a timeout, changing the rules — so whoever holds a seat's
     * token can act AS that seat, whatever any rule about membership says.
     *
     * This condition used to read `merged.open === true && !hotSeat`, which
     * named the noticeboard case rather than the rule, and the two are not the
     * same set. A CHALLENGE binds white to another member's id and is rated by
     * default, and it fell outside "posted" — so the challenger was handed
     * their opponent's token and could resign on their behalf, crediting
     * themselves a rated win and writing a loss that person never played onto
     * a permanent public record. A rematch and a fork against a known opponent
     * did the same.
     *
     * So the rule, stated as the rule: **a seat bound to somebody other than
     * the caller never has its token returned.** Both tokens still go back
     * when both seats are the caller's to give — a private game they must send
     * a link for, or a hot-seat board where one browser plays both colours.
     *
     * Nothing on the client is narrowed by this: `StartGame`, `SetUpGame` and
     * `StartSharedGame` read `blackToken` only. Do not widen the return "for
     * symmetry" — the asymmetry is the point.
     */
    const caller = await currentMemberId();
    /*
     * XP for the game just made, on the one call that makes every game: an ask,
     * a rematch or a fork, and nothing for the lobby or a posted seat. Which of
     * the three is `createdGameKind`, from what the caller actually sent — see
     * `xpSocial.ts`, which explains why the order of those tests matters.
     */
    await awardCreatedGame({ memberId: caller, gameId: created.id, kind: createdGameKind(parsed.data) });
    /*
     * TWO WAYS A SEAT IS NOT YOURS TO HOLD, and the first draft of this fix
     * caught only the second — which broke the first. `both-seats.spec.ts`
     * failed on it immediately, which is what that spec is for.
     *
     *  - POSTED on the noticeboard. Nobody is bound to it; it is answered by
     *    sitting down, so there is nobody for the poster to send a link to.
     *  - BOUND TO SOMEBODY ELSE by a challenge, a rematch or a fork.
     *
     * The unbound seat of a PRIVATE game is the case that must still come
     * back: it is unbound for the opposite reason — the caller has to send a
     * link to whoever they mean to play, and cannot without the token.
     *
     * So "unbound" alone answers nothing, because it means both "for whoever
     * sits down" and "for whoever I invite". `open` is what tells them apart.
     */
    const posted = merged.open === true;
    const bound = [seats.blackMemberId, seats.whiteMemberId].filter(
      (id): id is string => id !== undefined && id !== null,
    );
    const someoneElsesSeat = !hotSeat && (posted || bound.some((id) => id !== caller));
    /*
     * THEIR OWN SEAT, WHICHEVER COLOUR IT IS — not "the black one".
     *
     * A REMATCH SWAPS THE COLOURS (`seatsForRematch`: "They had black, so now
     * I do"), so the caller is white about half the time. Returning
     * `blackToken` for every withheld case would have handed them their
     * opponent's token in exactly those games — the same bug this is fixing,
     * pointed the other way, and harder to notice because it only appears on
     * the second game between two people.
     */
    const mySeat =
      seats.whiteMemberId !== undefined && seats.whiteMemberId === caller ? "white" : "black";
    const myToken = mySeat === "white" ? created.whiteToken : created.blackToken;
    const created_body = someoneElsesSeat ? { id: created.id, [`${mySeat}Token`]: myToken } : created;
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
    /*
     * A game that could not be won is the caller's mistake to hear about, not
     * a crash to bury in a log. `createLiveGame` refuses it rather than
     * writing it, and this says why in the words the guard used.
     */
    if (error instanceof UnwinnableGame) return unprocessable(error.message);
    console.error(error);
    return serverError("Could not start that game.");
  }
}
