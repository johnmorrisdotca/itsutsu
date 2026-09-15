import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { NO_HANDICAP, NO_HEAD_START, STONES } from "@/lib/gomoku/gomoku.constants";
import type { RulesDraft } from "./rulesDraft";
import { seatWhereFor } from "./seatWhere";

const DAY = 24 * 60 * 60_000;

const pro: RulesDraft = {
  variant: "freestyle",
  size: 15,
  obstacles: "none",
  opening: "pro",
  moveTimeMs: 3 * DAY,
  timeoutPenalty: "turn",
  clockMode: "move",
  rated: true,
  allowResign: true,
  open: true,
  handicap: NO_HANDICAP,
  headStart: NO_HEAD_START,
};

/**
 * THE DOORSTEP ASKS THE ROW WHAT THE SET-UP SCREEN ASKED THE LIST.
 *
 * `seatIsThisGame` is tested in `seatMatch.test.ts`; this holds the SQL side to
 * the same terms, so a seat named in an address is only sat at when its game
 * is the one chosen — a Free seat is never where a Pro chooser is sat down.
 */
describe("the seat a doorstep may sit at, as a query", () => {
  it("asks for the opening, the board and everything else the game is", () => {
    expect(seatWhereFor(pro)).toMatchObject({
      variant: "freestyle",
      size: 15,
      moveTimeMs: 3 * DAY,
      opening: "pro",
      obstacles: "none",
      rated: true,
      clockMode: "move",
      timeoutPenalty: "turn",
    });
  });

  it("accepts every way no handicap is stored, and nothing else", () => {
    expect(seatWhereFor(pro)?.OR).toEqual([
      { handicap: { equals: Prisma.DbNull } },
      { handicap: { equals: Prisma.JsonNull } },
      { handicap: { path: ["stone"], equals: Prisma.JsonNull } },
    ]);
  });

  it("does not ask about the clock where there is none", () => {
    const where = seatWhereFor({ ...pro, moveTimeMs: null, clockMode: "game", timeoutPenalty: "game" });
    expect(where).toMatchObject({ moveTimeMs: null });
    expect(where).not.toHaveProperty("clockMode");
    expect(where).not.toHaveProperty("timeoutPenalty");
  });

  it("does not ask what a per-move deadline costs on a whole-game clock", () => {
    const where = seatWhereFor({ ...pro, clockMode: "game" });
    expect(where).toMatchObject({ clockMode: "game" });
    expect(where).not.toHaveProperty("timeoutPenalty");
  });

  it("does not ask whether resigning is allowed", () => {
    expect(seatWhereFor({ ...pro, allowResign: false })).not.toHaveProperty("allowResign");
  });

  it("asks nothing of a draft with a handicap, which no stranger's seat is", () => {
    expect(seatWhereFor({ ...pro, handicap: { ...NO_HANDICAP, stone: STONES.black } })).toBeNull();
  });
});
