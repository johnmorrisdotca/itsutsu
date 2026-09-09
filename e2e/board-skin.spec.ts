import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, seedMember } from "./members";
import { openSetup } from "./support";

/**
 * The board a member likes, kept on their account.
 *
 * The wood, the stones and the grid were chosen per game and kept in one
 * browser, so a phone and a laptop set out different boards for the same
 * person. What is checked here is both directions: choosing one here writes
 * it to the account, and what the account holds is what a fresh browser
 * sets out.
 */
test.describe("the board a member likes", () => {
  test("follows them to another browser", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `dresser-${stamp}@example.test`, name: `Dresser ${stamp}` };

    const first = await memberContext(browser, baseURL!, me);
    const page = await first.newPage();
    await page.goto("/games/gomoku");

    await openSetup(page);
    await page.getByTestId("board-theme-sumi").click();
    await expect(page.getByTestId("board-theme-sumi")).toHaveAttribute("aria-pressed", "true");

    // The account is written to shortly after the choice, not on every render.
    await expect
      .poll(
        async () => {
          const prisma = new PrismaClient();
          try {
            const row = await prisma.member.findUnique({
              where: { email: me.email },
              select: { appearance: true },
            });
            return (row?.appearance as { boardTheme?: string } | null)?.boardTheme ?? null;
          } finally {
            await prisma.$disconnect();
          }
        },
        { message: "the chosen board should reach the account" },
      )
      .toBe("sumi");
    await first.close();

    // A different browser, same person, nothing in its storage: the account
    // decides what board they get.
    const second = await memberContext(browser, baseURL!, me);
    const elsewhere = await second.newPage();
    await elsewhere.goto("/games/gomoku");
    await openSetup(elsewhere);
    await expect(elsewhere.getByTestId("board-theme-sumi")).toHaveAttribute("aria-pressed", "true");
    await second.close();
  });

  test("is the ordinary one for somebody who has never chosen", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `plain-${stamp}@example.test`,
      name: `Plain ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/games/gomoku");
    await openSetup(page);
    // Kaya, as every board has always been set out.
    await expect(page.getByTestId("board-theme-kaya")).toHaveAttribute("aria-pressed", "true");
    await context.close();
  });

  test("survives a board the site no longer offers", async ({ browser, baseURL }) => {
    // A theme removed between releases, or a hand-edited row. The member
    // should get a board, not a broken one — and keep the choices that are
    // still good.
    const stamp = Date.now().toString(36);
    const me = { email: `ghost-${stamp}@example.test`, name: `Ghost ${stamp}` };
    await seedMember(me);

    const prisma = new PrismaClient();
    try {
      await prisma.member.update({
        where: { email: me.email },
        data: { appearance: { boardTheme: "mahogany", stoneSet: "jade" } },
      });
    } finally {
      await prisma.$disconnect();
    }

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();
    await page.goto("/games/gomoku");
    await openSetup(page);
    // The theme falls back; the stone set they really chose is kept.
    await expect(page.getByTestId("board-theme-kaya")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("stone-set-jade")).toHaveAttribute("aria-pressed", "true");
    await context.close();
  });
});
