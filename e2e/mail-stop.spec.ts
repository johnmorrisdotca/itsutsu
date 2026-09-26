import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

import { signStopToken } from "../src/lib/mail/mailStop";
import { removeMemberById, seedMember } from "./members";

/**
 * EVERY EMAIL SAYS HOW TO STOP GETTING IT, and the way out works for somebody
 * who is not signed in — the browser here holds no session at all, as the
 * person reading their mail on another device would not. It brings its own
 * member, and reads what the presses wrote from that member's own row.
 *
 * The page is plain server-drawn forms that post and come back, so there is no
 * hydration to wait for: each press is a navigation, awaited as one.
 */
test.use({ storageState: { cookies: [], origins: [] } });

async function withPrisma<T>(read: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = new PrismaClient();
  try {
    return await read(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function wanted(id: string): Promise<{ gameOver: unknown; all: boolean }> {
  const row = await withPrisma((prisma) => prisma.member.findUniqueOrThrow({ where: { id }, select: { emailNotify: true, preferences: true } }));
  // Unchosen reads as the default, which for a finished game is on.
  return { gameOver: (row.preferences as Record<string, unknown> | null)?.["mail.gameOver"] ?? "on", all: row.emailNotify };
}

test.describe("stopping email from its own link", () => {
  let memberId = "";
  let token = "";

  test.beforeEach(async () => {
    const email = `stop-${Date.now().toString(36)}@example.test`;
    await seedMember({ email, name: "Stop Tester" });
    memberId = await withPrisma(async (prisma) => (await prisma.member.findUniqueOrThrow({ where: { email }, select: { id: true } })).id);
    token = (await signStopToken(memberId, "game-over"))!;
    expect(token, "no AUTH_SECRET to sign a stop link with").toBeTruthy();
  });

  test.afterEach(async () => {
    await removeMemberById(memberId);
  });

  test("stops one kind, then all of it, and turns each back on, with no sign-in", async ({ page }) => {
    await page.goto(`/stop/${token}`);
    const panel = page.getByTestId("stop-page");
    await expect(panel).toHaveAttribute("data-kind-on", "true");
    await expect(panel).toHaveAttribute("data-all-on", "true");
    // It names no member, only the kind of email.
    await expect(panel).not.toContainText("Stop Tester");

    await page.getByTestId("stop-kind-press").click();
    await expect(page.getByTestId("stop-done")).toHaveText("Done: no more emails telling you a game of yours has finished.");
    await expect(panel).toHaveAttribute("data-kind-on", "false");
    expect(await wanted(memberId)).toEqual({ gameOver: "off", all: true });

    // The way back, from the same page.
    await page.getByTestId("stop-kind-press").click();
    await expect(page.getByTestId("stop-done")).toHaveText("Done: you will get emails telling you a game of yours has finished again.");
    await expect(panel).toHaveAttribute("data-kind-on", "true");
    expect(await wanted(memberId)).toEqual({ gameOver: "on", all: true });

    await page.getByTestId("stop-all-press").click();
    await expect(page.getByTestId("stop-done")).toHaveText("Done: Itsutsu will not email you again.");
    await expect(panel).toHaveAttribute("data-all-on", "false");
    expect((await wanted(memberId)).all).toBe(false);

    await page.getByTestId("stop-all-press").click();
    await expect(panel).toHaveAttribute("data-all-on", "true");
    expect((await wanted(memberId)).all).toBe(true);
  });

  test("a mail program's own unsubscribe stops that kind in one post", async ({ page }) => {
    const answer = await page.request.post(`/api/mail/stop?token=${token}`, { form: { "List-Unsubscribe": "One-Click" } });
    expect(answer.status()).toBe(200);
    expect(await wanted(memberId)).toEqual({ gameOver: "off", all: true });
    await page.goto(`/stop/${token}`);
    await expect(page.getByTestId("stop-page")).toHaveAttribute("data-kind-on", "false");
  });

  test("opening the link changes nothing, and a broken one opens nothing", async ({ page }) => {
    await page.goto(`/stop/${token}`);
    await expect(page.getByTestId("stop-page")).toHaveAttribute("data-kind-on", "true");
    expect(await wanted(memberId)).toEqual({ gameOver: "on", all: true });

    // Copied in part: the gate treats it as any stranger's request.
    await page.goto(`/stop/${token.slice(0, -4)}`);
    await expect(page).toHaveURL(/\/join/);
  });
});
