import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { memberIdFor, removeMember, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * A finished game downloads as an .sgf file from its replay — and a game SGF
 * has no type for offers no file at all.
 *
 * The spec brings its own world: one invented member and one typed name, two
 * unrated games it writes itself, both taken away when it finishes. Unrated,
 * so finishing them writes no rating row to outlive them.
 *
 * It clicks the button a reader clicks and reads the file the browser was
 * handed, rather than calling the writer — the writer's own tests are in
 * src/lib/record/sgf.test.ts, and what this proves is that the page reaches it.
 */

type Seeded = { variant: string; size: number; winLength: number; moves: [number, number][] };

test.describe("a finished game as an SGF file", () => {
  const mine = gamesMade();
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `sgf-${stamp}@example.test`;
  const memberName = `Kasumi ${stamp}`;
  const typedName = `Ren ${stamp}`;

  test.beforeAll(async () => {
    await seedMember({ email, name: memberName });
  });

  test.afterAll(async () => {
    await removeMember(email);
  });

  async function seedFinished({ variant, size, winLength, moves }: Seeded): Promise<string> {
    process.loadEnvFile(".env");
    if (!isLocalDatabase(process.env.DATABASE_URL)) throw new Error("This spec writes games, and only to a database on this machine.");
    const id = mine(`sgf-${variant}-${stamp}`);
    const blackMemberId = await memberIdFor(email);
    const at = new Date("2026-09-10T12:00:00Z");
    const prisma = new PrismaClient();
    try {
      await prisma.game.create({
        data: {
          id,
          variant,
          size,
          winLength,
          obstacles: "none",
          opener: "black",
          status: "finished",
          result: "black",
          winner: "black",
          rated: false,
          playedAt: at,
          lastMoveAt: at,
          moveCount: moves.length,
          blackName: memberName,
          blackMemberId,
          whiteName: typedName,
          moves: {
            create: moves.map(([row, col], index) => ({
              number: index + 1,
              row,
              col,
              stone: index % 2 === 0 ? "black" : "white",
              kind: "place",
              createdAt: at,
            })),
          },
        },
      });
    } finally {
      await prisma.$disconnect();
    }
    return id;
  }

  test("a Renju game's replay hands over a file a Renju program can read", async ({ page }) => {
    // Black's five along row 8 from the left, white answering along the top edge.
    const id = await seedFinished({
      variant: "renju",
      size: 15,
      winLength: 5,
      moves: [
        [7, 5],
        [0, 0],
        [7, 6],
        [0, 2],
        [7, 7],
        [0, 4],
        [7, 8],
        [0, 6],
        [7, 9],
      ],
    });
    await page.goto(`/games/renju/match/${id}`);
    await ready(page, "game-replay");

    // The copy-out lives in the folded move list, so a reader opens it first.
    await page.getByTestId("move-list").locator("summary").click();
    const button = page.getByTestId("download-sgf");
    await expect(button).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
    // The config's browser is in UTC, so the reader's calendar day is the seeded one.
    expect(download.suggestedFilename()).toBe(`renju-Kasumi-${stamp}-vs-Ren-${stamp}-2026-09-10.sgf`);

    const file = readFileSync(await download.path(), "utf8");
    expect(file.startsWith("(;FF[4]GM[4]")).toBe(true);
    expect(file).toContain("SZ[15]");
    expect(file).toContain("RE[B+]");
    expect(file).toContain("RU[Renju]");
    expect(file).toContain(`PB[${memberName}]`);
    expect(file).toContain(`PW[${typedName}]`);
    expect(file).toContain("DT[2026-09-10]");
    // Row 8 is h from the top, columns f to j; white on the top row, a.
    expect(file).toContain(";B[fh];W[aa];B[gh];W[ca];B[hh]");
  });

  test("a game SGF has no type for offers no file", async ({ page }) => {
    const id = await seedFinished({
      variant: "tictactoe",
      size: 3,
      winLength: 3,
      moves: [
        [0, 0],
        [1, 1],
        [0, 1],
        [2, 2],
        [0, 2],
      ],
    });
    await page.goto(`/games/tic-tac-toe/match/${id}`);
    await ready(page, "game-replay");
    await page.getByTestId("move-list").locator("summary").click();

    // The button it would sit beside is there, so its absence is a statement about a drawn page.
    await expect(page.getByTestId("copy-moves")).toBeVisible();
    await expect(page.getByTestId("download-sgf")).toHaveCount(0);
  });
});
