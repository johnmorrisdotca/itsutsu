import { badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { playBotTurns } from "@/lib/bots/botPlay";
import { isBotId } from "@/lib/bots/bots";
import { activeLimitRefusal, memberOverActiveLimit } from "@/lib/history/activeGames";
import { resolveAgainst } from "@/lib/history/liveAgainst";
import { settingsAsPlayed } from "@/lib/history/liveAsPlayed";
import { createLiveGame } from "@/lib/history/liveGame";
import { readCreation } from "@/lib/history/liveRequest";
import { createdResponse, refusalResponse } from "@/lib/history/liveResponse";
import { UnwinnableGame } from "@/lib/history/winnableGame";
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
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "live", RATE_LIMITS.createGame);
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const read = readCreation(body);
    if ("refused" in read) return refusalResponse(read.refused);
    const asked = read.asked;

    const settled = await resolveAgainst(asked);
    if ("refused" in settled) return refusalResponse(settled.refused);
    const against = settled.against;

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
    const atTheLimit = await memberOverActiveLimit([
      against.seats.blackMemberId,
      against.seats.whiteMemberId,
    ]);
    if (atTheLimit !== null) return unprocessable(activeLimitRefusal(atTheLimit));

    const created = await createLiveGame(settingsAsPlayed({ asked, against }));

    /*
     * A computer holding the seat that opens plays its stone now, so the board
     * the challenger lands on is a board with a move on it rather than one
     * waiting on a player that never waits.
     */
    const challengeId = asked.data.challengeId;
    if (challengeId !== undefined && isBotId(challengeId)) {
      try {
        await playBotTurns(created.id);
      } catch (error) {
        console.error(error);
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
    await awardCreatedGame({ memberId: caller, gameId: created.id, kind: createdGameKind(asked.data) });
    return createdResponse({ created, asked, against, caller });
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
