import { badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { playBotTurns } from "@/lib/bots/botPlay";
import { activeLimitRefusal, memberOverActiveLimit } from "@/lib/history/activeGames";
import { freeGameId } from "@/lib/history/gameId";
import { resolveAgainst } from "@/lib/history/liveAgainst";
import { settingsAsPlayed } from "@/lib/history/liveAsPlayed";
import { createLiveGame } from "@/lib/history/liveGame";
import { matchAsks, matchRefusal } from "@/lib/history/liveMatch";
import { readCreation } from "@/lib/history/liveRequest";
import { createdResponse, refusalResponse } from "@/lib/history/liveResponse";
import { UnwinnableGame } from "@/lib/history/winnableGame";
import { SEED_RANGE } from "@/lib/gomoku/gomoku.constants";
import { seedFromRoll } from "@/lib/gomoku/rules/random";
import { awardCreatedGame, createdGameKind } from "@/lib/xp/xpSocial";

/**
 * Starts a game two people can play from different devices.
 *
 * The response carries a token per seat. There is no sign-in here, so the
 * token *is* the seat: whoever holds the link plays that colour. They are
 * returned exactly once, to whoever set the game up, to hand out.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DOES, AND WHAT IT ASKS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * It reads the body, asks four modules in order, and answers. Each of the four
 * is a decision that has been got wrong at least once, each is named for what
 * it decides, and each has a test beside its own source:
 *
 *  - `liveRequest.ts` — what was asked for: the schema, and the fields the
 *    caller actually NAMED, which is what tells silence from a choice.
 *  - `liveAgainst.ts` — who the game is against: the seats, whether the other
 *    one is an offer rather than a binding, whether the board is one screen,
 *    and what the game this one came out of carries.
 *  - `liveAsPlayed.ts` — the game as it will ACTUALLY be played, which is not
 *    always the one the request named. John's unwinnable board lives here.
 *  - `liveResponse.ts` — what the caller is told, including which seat keys the
 *    answer may hold, which is a security decision and not a formatting one.
 *
 * They were all in this file, which reached 495 of the 500-line gate. The gate
 * was reporting something true: a file that receives a request, validates it,
 * seats two players, resolves three settings sources, checks a cap, writes a
 * game, pays XP and decides which credentials to hand back is a file doing
 * eight jobs. See AGENTS.md, "Nothing Answers What It Cannot Answer".
 */
/**
 * Whether the caller has promised to play the computer's opening move itself.
 *
 * Read off the raw body rather than through `liveGameSchema`, and that is the
 * point rather than a shortcut: everything in that schema is a property of the
 * GAME and is spread into the row that gets written, so a flag about the CALLER
 * put there reaches `prisma.game.create` as an unknown column and refuses every
 * creation — which is exactly what it did the first time this was written. What
 * the caller will do next is not something the game is.
 *
 * `true` only, never inferred: a body that says nothing has promised nothing.
 */
function browserWillOpen(body: unknown): boolean {
  return typeof body === "object" && body !== null && (body as { botReply?: unknown }).botReply === true;
}

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "live", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const read = readCreation(body);
    if ("refused" in read) return refusalResponse(read.refused);
    const asked = read.asked;

    /*
     * A MATCH IS SEVERAL OF THESE, the colours alternating (`liveMatch.ts`).
     * Each game's opponent is resolved from its own ask, so the seats swap
     * with the colour; an ordinary game is a match of one and takes exactly
     * the path it always did.
     */
    const notAMatch = matchRefusal(asked);
    if (notAMatch !== null) return refusalResponse(notAMatch);
    const asks = matchAsks(asked);
    const resolved = [];
    for (const each of asks) {
      const settled = await resolveAgainst(each);
      if ("refused" in settled) return refusalResponse(settled.refused);
      resolved.push(settled.against);
    }
    const against = resolved[0];

    /*
     * Twenty boards is already more than anybody plays in a week here, so a
     * twenty-first is not the game that was waiting on somebody — it is the
     * site letting a pile grow past where a person can keep up with it.
     * Refused before the game is written, the same as every other reason this
     * route says no.
     *
     * AND ONLY THE SEATS THIS CREATION ACTUALLY FILLS, which since offers is a
     * narrower set than it was — deliberately. An OFFER fills one seat. It used
     * to fill two, and this check counted both: challenging somebody who was
     * already holding twenty boards was refused outright, in a sentence
     * addressed to the wrong person — `activeLimitRefusal` reads "You have N
     * games on the go", which told the challenger somebody else's count and was
     * untrue of the reader. Worse, it meant a stranger's cap could be filled
     * with twenty games they never wanted, using the one feature whose whole
     * promise is that declining costs nothing.
     *
     * So an unanswered offer counts against NOBODY but its maker, and the
     * offeree meets the cap at the moment they take the board on — in
     * `acceptOffer`, where the number in the sentence is their own. `against.seats`
     * no longer carries their id by the time this runs, so that falls out of the
     * shape rather than needing a condition.
     */
    const atTheLimit = await memberOverActiveLimit(
      [against.seats.blackMemberId, against.seats.whiteMemberId],
      asks.length,
    );
    if (atTheLimit !== null) return unprocessable(activeLimitRefusal(atTheLimit));

    /*
     * ONE VALUE, WRITTEN AND THEN REPORTED. The row is created from this, and
     * the 201 names the game off the same object — so the address the caller is
     * handed cannot name a game the row is not. It could: the header was built
     * from the variant the REQUEST sent, and a rematch sends none while a
     * fork's is overridden by the position it continues. See `liveResponse.ts`.
     */
    const played = settingsAsPlayed({ asked, against });
    const matchId = asks.length > 1 ? await freeGameId() : null;
    const seed = seedFromRoll(Math.random(), SEED_RANGE);
    const made = [];
    for (const [index, each] of asks.entries()) {
      const settings = index === 0 ? played : settingsAsPlayed({ asked: each, against: resolved[index] });
      const match = matchId === null ? undefined : { id: matchId, index: index + 1, size: asks.length, seed };
      made.push(await createLiveGame({ ...settings, match }));
    }
    const created = made[0];

    /*
     * A computer holding the seat that opens plays its stone now, so the board
     * whoever asked lands on is a board with a move on it rather than one
     * waiting on a player that never waits.
     *
     * ASKED OF THE GAME, NOT OF THE REQUEST. This read `challengeId` and a bot
     * id, which names one of the three ways a program ends up in a seat and
     * misses the other two — a fork of a game against one, and a rematch of one,
     * neither of which sends a challenge. `playBotTurns` is safe to call on any
     * game: it returns without a move for an open seat, for an offer, and for a
     * position that is not the program's to play.
     *
     * AND NOT AT ALL WHEN THE CALLER SAYS IT WILL PLAY IT. `botReply` is the
     * promise the moves route already takes, made one step earlier: the browser
     * that asked for this game lands on the board, and the board answers for
     * the computer exactly as it does for every move after this one — which
     * makes the opening stone the last computer move that cost a paid function.
     * A caller that does not send it — no worker, or not a browser at all — is
     * answered here as it always was, and a browser that promises and then goes
     * away is caught by the games page (`BotCatchUp`) like any other abandoned
     * move.
     */
    if (against.computerSeated && !browserWillOpen(body)) {
      /*
       * Every game of a match, where the caller cannot answer for the
       * computer. Where it can, the games it does not land on are answered by
       * the games page like any other move the computer is owed (`BotCatchUp`).
       */
      for (const game of made) {
        try {
          await playBotTurns(game.id);
        } catch (error) {
          console.error(error);
        }
      }
    }

    const caller = await currentMemberId();
    /*
     * XP for the game just made, on the one call that makes every game: an ask,
     * a rematch or a fork, and nothing for the lobby or a posted seat. Which of
     * the three is `createdGameKind`, from what the caller actually sent — see
     * `xpSocial.ts`, which explains why the order of those tests matters, and
     * why an offer that is declined leaves this award exactly where it is.
     */
    // Once for a match, on its first game: one ask, however many boards it makes.
    await awardCreatedGame({ memberId: caller, gameId: created.id, kind: createdGameKind(asked.data) });
    return createdResponse({ created, asked, against, played, caller });
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
