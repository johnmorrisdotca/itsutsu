import { expect, test, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { removeMember, seedMember } from "./members";
import { readyHere } from "./support";

/**
 * ADMIN FITS A PHONE. Measured at 390×844 on 2026-09-26: Access was 422px
 * wide with invites listed — a long code widened the grid's one column —
 * and 490 once a Revoke question opened, because an invite row never
 * wrapped; Members was 572, six controls to a row in one line. Each is
 * measured here as a box, with rows of the spec's own making: nothing on
 * either page runs past the screen, and the question's answers are on it.
 */
const PHONE = { width: 390, height: 844 };

async function noSidewaysScroll(page: Page, what: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth), `${what} scrolls sideways`).toBeLessThanOrEqual(PHONE.width);
}

async function onScreen(locator: Locator, what: string) {
  const box = (await locator.boundingBox())!;
  expect(box.x, `${what}: left`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${what}: right`).toBeLessThanOrEqual(PHONE.width + 0.5);
}

test.describe("Admin on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  test("Access fits with a long invite listed, and Revoke's question wraps inside its row", async ({ page }) => {
    process.loadEnvFile(".env");
    const prisma = new PrismaClient();
    const code = `yukimi-tsukimi-hanami-${Date.now().toString(36)}`;
    await prisma.inviteCode.create({ data: { code, createdBy: "operator@example.test", note: "For Grandma Ueda and her friends from the go club", maxUses: 10 } });
    try {
      await page.goto("/admin");
      const row = page.getByTestId("active-invite").filter({ hasText: code });
      await readyHere(row.getByTestId(`revoke-${code}`));
      await noSidewaysScroll(page, "Access");
      await onScreen(row, "the invite's row");

      await row.getByTestId(`revoke-${code}`).click();
      const asking = row.getByTestId(`revoke-${code}-confirm`);
      await expect(asking).toContainText("cannot be brought back");
      await onScreen(asking, "the question");
      for (const answer of ["yes", "no"]) await onScreen(row.getByTestId(`revoke-${code}-${answer}`), answer);
      await noSidewaysScroll(page, "Access, asking");

      // Refused, the code is still there to use.
      await row.getByTestId(`revoke-${code}-no`).click();
      await expect(asking).toHaveCount(0);
      expect((await prisma.inviteCode.findUniqueOrThrow({ where: { code } })).revoked).toBe(false);
    } finally {
      await prisma.inviteCode.delete({ where: { code } });
      await prisma.$disconnect();
    }
  });

  test("Members fits: a row's controls wrap under its name, all on the screen", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const member = { email: `admin-phone-${stamp}@example.test`, name: `Phone Row ${stamp}` };
    await seedMember(member);
    try {
      await page.goto("/admin/members");
      const row = page.locator(`[data-testid="admin-member"][data-email="${member.email}"]`);
      await readyHere(row.getByTestId("ban-member"));
      await noSidewaysScroll(page, "Members");
      await onScreen(row, "the member's row");
      for (const control of ["member-words", "member-claim", "member-remove", "take-name-off", "ban-member"]) {
        const each = row.getByTestId(control);
        if ((await each.count()) > 0) await onScreen(each, control);
      }

      // Shut the account asks, inside the row and the screen too.
      await row.getByTestId("ban-member").click();
      await onScreen(row.getByTestId("ban-member-confirm"), "the shut question");
      await onScreen(row.getByTestId("ban-member-yes"), "Shut it");
      await row.getByTestId("ban-member-no").click();
      await expect(row.getByTestId("ban-member-confirm")).toHaveCount(0);
      await noSidewaysScroll(page, "Members, after asking");
    } finally {
      await removeMember(member.email);
    }
  });
});
