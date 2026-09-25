import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { memberIdFor, removeMember, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * A finished checkers game downloads as a .pdn file from its replay, and its
 * record writes the capture with a colon. John, 2026-09-24, from a vint.ee
 * replay: "I found out how they do their moves: for your info. do we use this
 * system?"
 *
 * Brings its own world, as `sgf-download.spec.ts` does: one invented member and
 * one typed name, one unrated game written here and taken away after. The game
 * is a real one the engine plays — 9-13 21-17 5-9 17-14 9x18 — so the replay
 * rebuilds the capture the file and the record write.
 */
test.describe("a finished draughts game as a PDN file", () => {
  const mine = gamesMade();
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `pdn-${stamp}@example.test`;
  const memberName = `Kasumi ${stamp}`;
  const typedName = `Ren ${stamp}`;

  test.beforeAll(async () => {
    await seedMember({ email, name: memberName });
  });

  test.afterAll(async () => {
    await removeMember(email);
  });

  test("a checkers replay writes its capture with a colon and hands over a PDN file", async ({ page }) => {
    process.loadEnvFile(".env");
    if (!isLocalDatabase(process.env.DATABASE_URL)) throw new Error("This spec writes games, and only to a database on this machine.");
    const id = mine(`pdn-checkers-${stamp}`);
    const blackMemberId = await memberIdFor(email);
    const at = new Date("2026-09-10T12:00:00Z");
    const slides: [number, number, number, number][] = [
      [2, 1, 3, 0],
      [5, 0, 4, 1],
      [1, 0, 2, 1],
      [4, 1, 3, 2],
      [2, 1, 4, 3],
    ];
    const prisma = new PrismaClient();
    try {
      await prisma.game.create({
        data: {
          id,
          variant: "checkers",
          size: 8,
          winLength: 5,
          obstacles: "none",
          opener: "black",
          status: "finished",
          result: "black",
          winner: "black",
          rated: false,
          playedAt: at,
          lastMoveAt: at,
          moveCount: slides.length,
          blackName: memberName,
          blackMemberId,
          whiteName: typedName,
          moves: {
            create: slides.map(([fromRow, fromCol, row, col], index) => ({
              number: index + 1,
              row,
              col,
              fromRow,
              fromCol,
              stone: index % 2 === 0 ? "black" : "white",
              kind: "move",
              createdAt: at,
            })),
          },
        },
      });
    } finally {
      await prisma.$disconnect();
    }

    await page.goto(`/games/checkers/match/${id}`);
    await ready(page, "game-replay");

    // The record: a slide with an arrow, the capture with a colon.
    const played = page.getByTestId("played-moves");
    await expect(played.locator('[data-move="1"]')).toContainText("→");
    await expect(played.locator('[data-move="5"]')).toContainText(":");

    await page.getByTestId("move-list").locator("summary").click();
    // SGF has no number for draughts, so the one file offered is PDN.
    await expect(page.getByTestId("download-sgf")).toHaveCount(0);
    const button = page.getByTestId("download-pdn");
    await expect(button).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
    expect(download.suggestedFilename()).toBe(`checkers-Kasumi-${stamp}-vs-Ren-${stamp}-2026-09-10.pdn`);

    const file = readFileSync(await download.path(), "utf8");
    expect(file).toContain('[GameType "21"]');
    expect(file).toContain(`[Black "${memberName}"]`);
    expect(file).toContain(`[White "${typedName}"]`);
    expect(file).toContain('[Result "0-1"]');
    expect(file).toContain("1. 9-13 21-17 2. 5-9 17-14 3. 9x18 0-1");
  });
});
