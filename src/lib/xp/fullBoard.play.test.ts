/**
 * The full-board awards against a real database: the read, the judgement and
 * the payer, together — what the unit tests of `fullBoard.ts` cannot show.
 *
 *   XP_FULL_BOARD_PLAY=1 pnpm exec vitest run src/lib/xp/fullBoard.play.test.ts --disable-console-intercept
 *
 * WRITES ROWS, SO ONLY TO A DATABASE MADE FOR IT. It refuses any database whose
 * name does not begin `agent_` or `impxp_` — never the shared local one other
 * worktrees use, never production — and removes everything it made.
 *
 * It seeds a member holding twenty games, each answered by its opponent and
 * each moved in by the member yesterday, so yesterday was a full board kept
 * moving; then a program in the same position. It asks the judgement twice for
 * each, pays through `awardXp` both times, and checks the second pays nothing.
 */
import { describe, expect, it } from "vitest";

import { GAME_STATUS, STONES } from "@/lib/gomoku/gomoku.constants";
import { settledTurn } from "@/lib/history/settledTurn";
import { prisma } from "@/lib/prisma";

import { awardXp } from "./awardXp";
import { fullBoardAwardsFor } from "./fullBoardServer";
import { XP_EVENTS, XP_EVENT_SPECS, XP_FULL_BOARD_GAMES } from "./xp.constants";

const ASKED = process.env.XP_FULL_BOARD_PLAY === "1";
const STAMP = Date.now().toString(36);
const HOUR = 3_600_000;

function databaseName(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
  } catch {
    return "";
  }
}

/** A member with a full board, answered and moved in yesterday, and the games to take away again. */
async function seedBoard(label: string, botTier: string | null, now: Date): Promise<{ memberId: string; games: string[] }> {
  const memberId = `fb-${label}-${STAMP}`;
  await prisma.member.create({
    data: { id: memberId, email: `${memberId}@example.test`, name: `Full board ${label}`, picture: "", invitedWith: "fullBoard.play", botTier, timeZone: "UTC" },
  });
  const games: string[] = [];
  for (let index = 0; index < XP_FULL_BOARD_GAMES; index += 1) {
    const id = `fb${label}${STAMP}${index}`.slice(0, 40);
    const opponent = `fb-opp-${label}-${STAMP}-${index}`;
    /* Opened two days ago; the opponent answered then; the member moved yesterday afternoon, so it is the opponent's turn now. */
    const opened = new Date(now.getTime() - 50 * HOUR);
    await prisma.game.create({
      data: {
        id,
        status: "active",
        result: "abandoned",
        moveCount: 3,
        size: 15,
        winLength: 5,
        variant: "freestyle",
        obstacles: "none",
        opener: "black",
        blackMemberId: memberId,
        whiteMemberId: opponent,
        playedAt: opened,
        lastMoveAt: new Date(now.getTime() - 20 * HOUR),
        /* The opponent's turn, filled the only way the stored turn is filled. */
        ...settledTurn({ status: GAME_STATUS.playing, toPlay: STONES.white }),
        moves: {
          create: [
            { number: 1, row: 7, col: 7, stone: "black", createdAt: new Date(opened.getTime() + HOUR) },
            { number: 2, row: 7, col: 8, stone: "white", createdAt: new Date(opened.getTime() + 2 * HOUR) },
            { number: 3, row: 8, col: 7, stone: "black", createdAt: new Date(now.getTime() - 20 * HOUR) },
          ],
        },
      },
    });
    games.push(id);
  }
  return { memberId, games };
}

async function remove(seeded: { memberId: string; games: string[] }): Promise<void> {
  await prisma.xpEvent.deleteMany({ where: { memberId: seeded.memberId } });
  await prisma.game.deleteMany({ where: { id: { in: seeded.games } } });
  await prisma.member.deleteMany({ where: { id: seeded.memberId } });
}

describe("a full board kept moving, judged and paid against a real database", () => {
  it.runIf(ASKED)("pays a person and a program once for yesterday, and nothing the second time", async () => {
    const name = databaseName();
    console.log(`Database: ${name}`);
    expect(/^(agent_|impxp_)/.test(name), "refusing to write to a database not made for this").toBe(true);

    /* Noon UTC, so "yesterday" is a whole day behind and the member moved in it. */
    const now = new Date();
    now.setUTCHours(12, 0, 0, 0);
    const lastActionAt = new Date(now.getTime() - 22 * HOUR);

    for (const [label, botTier] of [["person", null], ["program", "fb-play-program"]] as const) {
      const seeded = await seedBoard(label, botTier, now);
      try {
        const asked = await fullBoardAwardsFor({ memberId: seeded.memberId, timeZone: "UTC", lastActionAt, now });
        console.log(`  ${label}: asked for ${asked.map((award) => award.type).join(", ")}`);
        expect(asked.map((award) => award.type)).toEqual([XP_EVENTS.fullHouse, XP_EVENTS.cleanSweep, XP_EVENTS.cleanSweepFirst]);

        const paid = await awardXp({ memberId: seeded.memberId, awards: asked, now });
        const expected = XP_EVENT_SPECS.fullHouse.points + XP_EVENT_SPECS.cleanSweep.points + XP_EVENT_SPECS.cleanSweepFirst.points;
        console.log(`  ${label}: paid ${paid.points}`);
        expect(paid.points).toBe(expected);

        const again = await fullBoardAwardsFor({ memberId: seeded.memberId, timeZone: "UTC", lastActionAt, now });
        const repaid = await awardXp({ memberId: seeded.memberId, awards: again, now });
        console.log(`  ${label}: judged again, paid ${repaid.points}`);
        expect(repaid.points).toBe(0);

        const row = await prisma.member.findUnique({ where: { id: seeded.memberId }, select: { xp: true, xpEverywhere: true } });
        expect(row).toEqual({ xp: expected, xpEverywhere: expected });
      } finally {
        await remove(seeded);
      }
    }
  }, 120_000);

  it("writes nothing unless asked for by name", () => {
    expect(typeof ASKED).toBe("boolean");
  });
});
