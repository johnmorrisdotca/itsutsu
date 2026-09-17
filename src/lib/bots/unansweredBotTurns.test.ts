import { describe, expect, it } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { MyGame, MyGames } from "@/lib/history/myGames.types";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { BOT_MEMBERS, BROWSER_REPLY_GRACE_MS, UNANSWERED_TURNS_AT_ONCE } from "./bots.constants";
import { unansweredBotTurns } from "./unansweredBotTurns";

const NOW = new Date("2026-09-17T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

/** Only the fields the rule reads, so each case says what it is about. */
function mine(id: string, toPlay: Stone | null, since: string, white: string | null = BOT_MEMBERS.guoshou.id): MyGame {
  return {
    game: { id, blackMemberId: "a-person", whiteMemberId: white },
    seat: STONES.black,
    group: "theirMove",
    offer: null,
    offerSide: null,
    toPlay,
    since,
    stale: false,
  } as unknown as MyGame;
}

const queue = (theirMove: MyGame[], unstarted: MyGame[] = []): Pick<MyGames, "theirMove" | "unstarted"> => ({
  theirMove,
  unstarted,
});

describe("the computer's moves nobody answered for", () => {
  it("takes up a computer's move left waiting past the grace", () => {
    // The tab closed mid-thought: nothing anywhere is working on this move.
    const left = mine("left", STONES.white, ago(BROWSER_REPLY_GRACE_MS + 1_000));
    expect(unansweredBotTurns(queue([left]), NOW).map((one) => one.game.id)).toEqual(["left"]);
  });

  it("never races a browser that is still thinking", () => {
    // Two seconds of thought and a post: inside the grace, the browser has it.
    const thinking = mine("thinking", STONES.white, ago(5_000));
    expect(unansweredBotTurns(queue([thinking]), NOW)).toEqual([]);
  });

  it("leaves a person's move to the person", () => {
    const person = mine("person", STONES.white, ago(BROWSER_REPLY_GRACE_MS * 10), "another-person");
    expect(unansweredBotTurns(queue([person]), NOW)).toEqual([]);
  });

  it("leaves a game with no turn to take", () => {
    const over = mine("over", null, ago(BROWSER_REPLY_GRACE_MS * 10));
    expect(unansweredBotTurns(queue([over]), NOW)).toEqual([]);
  });

  it("does not answer an offer by playing", () => {
    // An offer waits on an answer, not a move — see `playBotTurns`.
    const offered = { ...mine("offered", STONES.white, ago(BROWSER_REPLY_GRACE_MS * 10)), offer: "offered" } as MyGame;
    expect(unansweredBotTurns(queue([offered]), NOW)).toEqual([]);
  });

  it("finds one in a game the computer was to open", () => {
    const opens = mine("opens", STONES.white, ago(BROWSER_REPLY_GRACE_MS * 2));
    expect(unansweredBotTurns(queue([], [opens]), NOW).map((one) => one.game.id)).toEqual(["opens"]);
  });

  it("takes up only a few in one read", () => {
    // A read of somebody's games is not the place to clear a backlog.
    const many = Array.from({ length: UNANSWERED_TURNS_AT_ONCE + 3 }, (_, n) =>
      mine(`left-${n}`, STONES.white, ago(BROWSER_REPLY_GRACE_MS * 2)),
    );
    expect(unansweredBotTurns(queue(many), NOW)).toHaveLength(UNANSWERED_TURNS_AT_ONCE);
  });
});
