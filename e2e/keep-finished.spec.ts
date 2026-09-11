import { expect, test } from "@playwright/test";

import { PrismaClient } from "@prisma/client";

import { memberContext } from "./members";
import { shownName } from "../src/lib/rating/shownName";

/*
 * Names are matched by what the site PRINTS, through the same function the
 * site prints them with — a first name and an initial. Spelling the displayed
 * form out here instead would be a second copy of the rule, and the two would
 * disagree the first time it changed.
 */

/**
 * How long a finished game stays in your own list.
 *
 * The list is a working queue, and every finished game staying in it for
 * ever turns it into an archive. What is checked here is the promise the
 * setting makes and the promise it does not: the game leaves the queue, and
 * the record still has it.
 */
test.describe("keeping finished games in your own list", () => {
  test("is set on the profile, and offers keeping everything", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `keeper-${stamp}@example.test`,
      name: `Keeper ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/me?view=profile");

    const choice = page.getByTestId("keep-finished-days");
    await expect(choice).toBeVisible();
    // Everybody starts keeping everything: nothing disappears unless asked.
    await expect(choice).toHaveValue("0");

    await choice.selectOption("14");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // It survives a reload, which is the whole point of it being on the
    // account rather than in this browser.
    await page.reload();
    await expect(page.getByTestId("keep-finished-days")).toHaveValue("14");

    await context.close();
  });

  test("hides nothing from the record, whatever it is set to", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `keeper2-${stamp}@example.test`, name: `Sweeper ${stamp}` };
    const opponent = `Broom ${stamp}`;

    const started = await request.post("/api/games/live", {
      data: { blackName: me.name, whiteName: opponent, size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // The shortest window there is. The game was finished seconds ago, so it
    // is still inside it — the setting is about age, not about hiding.
    await page.goto("/me?view=profile");
    await page.getByTestId("keep-finished-days").selectOption("7");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // Still in the record, which keeps everything however the queue is set.
    await page.goto(`/history?search=${encodeURIComponent(stamp)}`);
    await expect(page.getByTestId("history-list")).toContainText(shownName(me.name));

    await context.close();
  });

  test("lets go of a game older than the window, and only from the list", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    // Unique in the first word, which is the part a list prints.
    const me = { email: `keeper3-${stamp}@example.test`, name: `Duster${stamp} Tester` };

    const started = await request.post("/api/games/live", {
      data: { blackName: me.name, whiteName: `Cloth${stamp} Tester`, size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect(
      (await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status(),
    ).toBe(200);

    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    // Claim the black seat for this member, then age the game a month. The
    // clock is the only thing a test cannot wait for.
    const prisma = new PrismaClient();
    try {
      const old = new Date(Date.now() - 30 * 86_400_000);
      const mine = await prisma.member.findUnique({ where: { email: me.email }, select: { id: true } });
      await prisma.game.update({
        where: { id: game.id },
        data: { blackMemberId: mine!.id, playedAt: old, lastMoveAt: old },
      });
    } finally {
      await prisma.$disconnect();
    }

    // Keeping everything: it is in the list.
    await page.goto("/games");
    await expect(page.getByTestId("my-games-finished")).toContainText(shownName(`Cloth${stamp} Tester`));

    await page.goto("/me?view=profile");
    await page.getByTestId("keep-finished-days").selectOption("7");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // A month old, a week's window: gone from the queue.
    await page.goto("/games");
    await expect(page.getByTestId("my-games-finished")).toHaveCount(0);

    // And still in the record, which keeps everything.
    await page.goto(`/history?search=${encodeURIComponent(stamp)}`);
    await expect(page.getByTestId("history-list")).toContainText(shownName(me.name));

    await context.close();
  });
});
