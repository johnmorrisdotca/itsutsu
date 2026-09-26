import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";

import { newsFromGames, newsFromSolves, type BackfillGame } from "./siteNewsBackfill";
import { SITE_NEWS } from "./siteNews.constants";

const TOP = BOT_TIER_LIST.at(-1) as keyof typeof BOT_MEMBERS;
const topBot = BOT_MEMBERS[TOP].id;

let clock = 0;
function game(id: string, black: string | null, white: string | null, winner: string | null, variant = "reversi"): BackfillGame {
  clock += 1;
  return { id, variant, blackMemberId: black, whiteMemberId: white, winner, endedAt: new Date(Date.UTC(2026, 8, 1, 0, clock)) };
}

describe("the news from finished games, walked oldest first", () => {
  it("tells each game's first game once, skipping practice against yourself", () => {
    const games = [game("self", "ann", "ann", "black"), game("g1", "ann", "bo", "white"), game("g2", "bo", "ann", "black")];
    const firsts = newsFromGames(games).filter((row) => row.kind === SITE_NEWS.firstGameOfGame);
    expect(firsts).toEqual([
      expect.objectContaining({ variant: "reversi", memberId: "bo", gameId: "g1", createdAt: games[1]?.endedAt }),
    ]);
  });

  it("tells a first win and loss once each, and never for a first win made against yourself", () => {
    const games = [game("self", "ann", "ann", "black"), game("g1", "ann", "bo", "black"), game("g2", "ann", "bo", "white")];
    const rows = newsFromGames(games).filter((row) => row.kind === SITE_NEWS.firstWin || row.kind === SITE_NEWS.firstLoss);
    expect(rows.map((row) => `${row.kind}:${row.memberId}:${row.gameId}`)).toEqual([
      // Ann's first win was the practice game, so only her first loss is told.
      `${SITE_NEWS.firstLoss}:bo:g1`,
      `${SITE_NEWS.firstLoss}:ann:g2`,
      `${SITE_NEWS.firstWin}:bo:g2`,
    ]);
  });

  it("orders by when each game ended, not by the order it was read in", () => {
    const early = game("early", "ann", "bo", "black");
    const late = game("late", "cy", "di", "black");
    const firsts = newsFromGames([late, early]).filter((row) => row.kind === SITE_NEWS.firstGameOfGame);
    expect(firsts.map((row) => row.gameId)).toEqual(["early"]);
  });

  it("tells the first person to beat a top grade at each game, once", () => {
    const games = [game("g1", "ann", topBot, "black"), game("g2", "bo", topBot, "black"), game("g3", topBot, "bo", "white", "hex")];
    const beaten = newsFromGames(games).filter((row) => row.kind === SITE_NEWS.hardBotBeaten);
    expect(beaten.map((row) => `${row.memberId}:${row.variant}`)).toEqual(["ann:reversi", "bo:hex"]);
  });
});

describe("best times, as they were set", () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 8, 1, 0, minute));
  const solve = (memberId: string, elapsedMs: number, minute: number, size = 9) => ({
    memberId,
    kind: "numberPlace",
    size,
    level: "hard",
    elapsedMs,
    finishedAt: at(minute),
  });

  it("is every solve faster than all before it at its board, and nothing slower", () => {
    const rows = newsFromSolves([solve("ann", 300_000, 1), solve("bo", 350_000, 2), solve("bo", 250_000, 3), solve("ann", 250_000, 4), solve("ann", 90_000, 5, 4)]);
    expect(rows.map((row) => `${row.memberId}:${row.subject}`)).toEqual(["ann:9:hard:300000", "bo:9:hard:250000", "ann:4:hard:90000"]);
    expect(rows[1]?.createdAt).toEqual(at(3));
  });
});
