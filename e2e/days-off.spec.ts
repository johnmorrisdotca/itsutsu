import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, seedMember } from "./members";

/**
 * The days of the week somebody does not play.
 *
 * Standing, unlike the away range: named once and honoured every week, for
 * ever, without spending anything from the yearly allowance. What is checked
 * here is both halves — that the choice sticks to the account, and that a
 * deadline landing on one of those days really does hold a timeout off.
 */
test.describe("days I do not play", () => {
  test("are chosen on the profile and stay chosen", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `restful-${stamp}@example.test`,
      name: `Restful ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/me");

    await expect(page.getByTestId("days-off")).toBeVisible();
    // Nobody starts with a day off: deadlines work as they always have.
    await expect(page.getByTestId("day-off-0")).toHaveAttribute("aria-pressed", "false");

    await page.getByTestId("day-off-0").click();
    await page.getByTestId("day-off-6").click();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    // On the account, not in this browser: it survives a reload.
    await page.reload();
    await expect(page.getByTestId("day-off-0")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("day-off-6")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("day-off-3")).toHaveAttribute("aria-pressed", "false");

    await context.close();
  });

  test("cannot be every day, since somebody has to play sometime", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `hermit-${stamp}@example.test`,
      name: `Hermit ${stamp}`,
    });
    const page = await context.newPage();
    await page.goto("/me");

    for (const day of [0, 1, 2, 3, 4, 5]) await page.getByTestId(`day-off-${day}`).click();
    // Six taken; the seventh is not on offer, because a game that could never
    // reach a deadline is not a preference.
    await expect(page.getByTestId("day-off-6")).toBeDisabled();

    await context.close();
  });

  test("hold a missed deadline off until the day they play again", async ({ request }) => {
    const stamp = Date.now().toString(36);
    const sleeper = { email: `sleeper-${stamp}@example.test`, name: `Sleeper ${stamp}` };
    await seedMember(sleeper);

    const started = await request.post("/api/games/live", {
      data: {
        blackName: sleeper.name,
        whiteName: `Waker ${stamp}`,
        size: 9,
        moveTimeMs: 86_400_000,
      },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };

    const prisma = new PrismaClient();
    try {
      // Black holds the seat and takes today off, wherever the server is.
      const today = new Date().getUTCDay();
      const sleeperRow = await prisma.member.update({
        where: { email: sleeper.email },
        data: { daysOff: [today], timeZone: "UTC" },
      });
      // A deadline that went by an hour ago: white could claim it but for the
      // day off. The clock is the one thing a test cannot wait for.
      const gone = new Date(Date.now() - 3_600_000);
      await prisma.game.update({
        where: { id: game.id },
        data: { blackMemberId: sleeperRow.id, lastMoveAt: new Date(gone.getTime() - 86_400_000), deadlineAt: gone },
      });

      const refused = await request.post(`/api/games/${game.id}/timeout`, {
        data: { token: game.whiteToken },
      });
      expect(refused.status(), "a day off should hold the claim off").toBe(409);
      expect(await refused.text()).toContain("not up yet");

      // The same claim, with the day off taken back: now it lands.
      await prisma.member.update({ where: { email: sleeper.email }, data: { daysOff: [] } });
      const allowed = await request.post(`/api/games/${game.id}/timeout`, {
        data: { token: game.whiteToken },
      });
      expect(allowed.status(), "with no day off the deadline is simply missed").toBe(200);
    } finally {
      await prisma.$disconnect();
    }
  });
});
