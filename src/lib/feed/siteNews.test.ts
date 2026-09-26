import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { BOT_SPECIALIST_LIST, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";

import {
  HARD_GRADES,
  bestTimeNews,
  bestTimeParts,
  firstGameNews,
  firstPlaceNews,
  firstResultNews,
  hardBotNews,
  isHardGrade,
  mayBeFirstGame,
  programFor,
  type NewsGame,
} from "./siteNews";
import { SITE_NEWS } from "./siteNews.constants";

const TOP = BOT_TIER_LIST.at(-1) as string;
const SECOND = BOT_TIER_LIST.at(-2) as string;
const WEAKEST = BOT_TIER_LIST[0] as string;
const topBot = BOT_MEMBERS[TOP as keyof typeof BOT_MEMBERS].id;
const weakBot = BOT_MEMBERS[WEAKEST as keyof typeof BOT_MEMBERS].id;

function game(over: Partial<NewsGame> = {}): NewsGame {
  return { id: "g1", variant: "reversi", blackMemberId: "ann", whiteMemberId: "bo", winner: "black", ...over };
}

describe("which computer grades are news", () => {
  it("is the top two of the ladder, read from the ladder's own order", () => {
    expect(isHardGrade(TOP)).toBe(true);
    expect(isHardGrade(SECOND)).toBe(true);
    expect(isHardGrade(WEAKEST)).toBe(false);
  });

  it("is every specialist, since each is sought out for one game", () => {
    for (const tier of BOT_SPECIALIST_LIST) expect(isHardGrade(tier)).toBe(true);
  });

  it("is nothing for a person or a grade this deploy does not know", () => {
    expect(isHardGrade(null)).toBe(false);
    expect(isHardGrade("retired")).toBe(false);
    expect(HARD_GRADES.size).toBe(2 + BOT_SPECIALIST_LIST.length);
  });
});

describe("a game that could be a game's first", () => {
  it("is two different members, at least one a person", () => {
    expect(mayBeFirstGame(game())).toBe(true);
    expect(mayBeFirstGame(game({ whiteMemberId: topBot }))).toBe(true);
  });

  it("is not a game against yourself at one screen", () => {
    expect(mayBeFirstGame(game({ whiteMemberId: "ann" }))).toBe(false);
  });

  it("is not a seat nobody is behind", () => {
    expect(mayBeFirstGame(game({ whiteMemberId: null }))).toBe(false);
  });

  it("is not two programs: a bot series is nobody playing", () => {
    expect(mayBeFirstGame(game({ blackMemberId: topBot, whiteMemberId: weakBot }))).toBe(false);
  });

  it("is told from the winner's side, and Black's on a draw", () => {
    expect(firstGameNews(game({ winner: "white" }))).toEqual({
      kind: SITE_NEWS.firstGameOfGame,
      memberId: "bo",
      variant: "reversi",
      subject: "",
      gameId: "g1",
    });
    expect(firstGameNews(game({ winner: null })).memberId).toBe("ann");
  });
});

describe("a member's first win and first loss", () => {
  it("is a win when the row held no wins before it, keyed once per member", () => {
    expect(firstResultNews(game(), { memberId: "ann", outcome: "win", wonBefore: 0, lostBefore: 4 })).toEqual({
      kind: SITE_NEWS.firstWin,
      memberId: "ann",
      variant: "",
      subject: "ann",
      gameId: "g1",
    });
  });

  it("is a loss when the row held no losses before it", () => {
    expect(firstResultNews(game(), { memberId: "bo", outcome: "loss", wonBefore: 3, lostBefore: 0 })?.kind).toBe(SITE_NEWS.firstLoss);
  });

  it("is nothing for a second win, a draw, or a win when only losses were nought", () => {
    expect(firstResultNews(game(), { memberId: "ann", outcome: "win", wonBefore: 1, lostBefore: 0 })).toBeNull();
    expect(firstResultNews(game(), { memberId: "ann", outcome: "draw", wonBefore: 0, lostBefore: 0 })).toBeNull();
  });

  it("is nothing for a program, or for a game against yourself", () => {
    expect(firstResultNews(game({ blackMemberId: topBot }), { memberId: topBot, outcome: "win", wonBefore: 0, lostBefore: 0 })).toBeNull();
    expect(firstResultNews(game({ whiteMemberId: "ann" }), { memberId: "ann", outcome: "win", wonBefore: 0, lostBefore: 0 })).toBeNull();
  });
});

describe("a top grade beaten", () => {
  it("is keyed on the game and the grade, so the first person at each game is told", () => {
    expect(hardBotNews(game(), "ann", topBot, TOP)).toEqual({
      kind: SITE_NEWS.hardBotBeaten,
      memberId: "ann",
      variant: "reversi",
      subject: TOP,
      gameId: "g1",
    });
  });

  it("is nothing for a lower grade, or for one program beating another", () => {
    expect(hardBotNews(game(), "ann", weakBot, WEAKEST)).toBeNull();
    expect(hardBotNews(game(), weakBot, topBot, TOP)).toBeNull();
  });
});

describe("first place", () => {
  const after = { key: "ann", memberId: "ann" };

  it("is told when one of the game's players now leads and did not before", () => {
    expect(firstPlaceNews("reversi", "g1", { key: "cy", memberId: "cy" }, after, ["ann", "bo"])).toEqual({
      kind: SITE_NEWS.tookFirstPlace,
      memberId: "ann",
      variant: "reversi",
      subject: "g1",
      gameId: "g1",
    });
  });

  it("is told for the first rated game of a game, when nobody led before", () => {
    expect(firstPlaceNews("reversi", "g1", null, after, ["ann", "bo"])?.memberId).toBe("ann");
  });

  it("is not told when the leader did not change", () => {
    expect(firstPlaceNews("reversi", "g1", after, after, ["ann", "bo"])).toBeNull();
  });

  it("is not told for somebody who rose without playing this game", () => {
    expect(firstPlaceNews("reversi", "g1", after, { key: "cy", memberId: "cy" }, ["ann", "bo"])).toBeNull();
  });

  it("says nothing when either reading could not be taken: a rule that cannot measure must not fire", () => {
    expect(firstPlaceNews("reversi", "g1", undefined, after, ["ann"])).toBeNull();
    expect(firstPlaceNews("reversi", "g1", null, undefined, ["ann"])).toBeNull();
  });

  it("says nothing about a name with no member behind it", () => {
    expect(firstPlaceNews("reversi", "g1", null, { key: "typed", memberId: null }, ["typed"])).toBeNull();
  });
});

describe("a best time", () => {
  const solve = { memberId: "ann", kind: "numberPlace", size: 9, level: "hard", elapsedMs: 192_000, solved: true };

  it("is a solve strictly faster than the best before it", () => {
    expect(bestTimeNews(solve, 200_000)).toEqual({
      kind: SITE_NEWS.bestTime,
      memberId: "ann",
      variant: "numberPlace",
      subject: "9:hard:192000",
      gameId: null,
    });
  });

  it("is the first solve there is, which is the first record", () => {
    expect(bestTimeNews(solve, null)).not.toBeNull();
  });

  it("is not equalling a time, being slower, or a word that ran out", () => {
    expect(bestTimeNews(solve, 192_000)).toBeNull();
    expect(bestTimeNews(solve, 100_000)).toBeNull();
    expect(bestTimeNews({ ...solve, solved: false }, null)).toBeNull();
  });

  it("reads its board and time back, and refuses a subject it cannot read", () => {
    expect(bestTimeParts("9:hard:192000")).toEqual({ size: 9, level: "hard", elapsedMs: 192_000 });
    expect(bestTimeParts("nonsense")).toBeNull();
    expect(bestTimeParts("9::12")).toBeNull();
  });
});

describe("the program behind a grade", () => {
  it("is its member row's id and name, or null for a grade this deploy does not know", () => {
    expect(programFor(TOP)).toEqual({ id: topBot, name: BOT_MEMBERS[TOP as keyof typeof BOT_MEMBERS].name });
    expect(programFor("retired")).toBeNull();
  });
});
