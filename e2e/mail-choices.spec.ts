import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { PLAYER_SESSION_DAYS, SESSION_COOKIE, expiryInDays, signSession } from "../src/lib/auth/session";
import { ready } from "./support";
import { removeMemberById, seedMember } from "./members";

/**
 * WHAT A MEMBER HEARS ABOUT BY EMAIL, chosen where John asked for it: "on
 * signup and in profile". A row a kind under one switch for all of it, each at
 * its stated default until chosen — a finished game on, a your-turn off — and
 * kept on the account.
 *
 * It brings its own member, an adult with an address, signed in as nobody
 * else is, and reads what each press kept from that member's own row.
 */
const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function ownMember(): Promise<string> {
  const email = `mail-choices-${Date.now().toString(36)}@example.test`;
  await seedMember({ email, name: "Mail Chooser" });
  const { id } = await prisma.member.update({ where: { email }, data: { ageBand: "18_plus" }, select: { id: true } });
  return id;
}

async function asMember(browser: Browser, baseURL: string, memberId: string): Promise<BrowserContext> {
  const token = await signSession({ kind: "player", memberId, code: "playwright", exp: expiryInDays(PLAYER_SESSION_DAYS) });
  if (token === null) throw new Error("No AUTH_SECRET: cannot sign a test session.");
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  await context.addCookies([{ name: SESSION_COOKIE, value: token, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
  return context;
}

async function kept(memberId: string): Promise<{ all: boolean; yourTurn: unknown; gameOver: unknown }> {
  const row = await prisma.member.findUniqueOrThrow({ where: { id: memberId }, select: { emailNotify: true, preferences: true } });
  const preferences = (row.preferences ?? {}) as Record<string, unknown>;
  return { all: row.emailNotify, yourTurn: preferences["mail.yourTurn"], gameOver: preferences["mail.gameOver"] };
}

/** The PATCH that carries `words`: the page also reports the device's time zone through the same address as it arrives. */
const patchWith = (page: Page, words: string) =>
  page.waitForResponse((answer) => answer.url().endsWith("/api/me") && answer.request().method() === "PATCH" && (answer.request().postData() ?? "").includes(words));

/** The checkbox inside one row of the choices. */
const box = (page: Page, testId: string) => page.getByTestId(testId).getByRole("checkbox");

test("Settings offers a row a kind under one switch, at the stated defaults, and keeps what is chosen", async ({ browser, baseURL }) => {
  const memberId = await ownMember();
  const member = await asMember(browser, baseURL!, memberId);
  try {
    const page = await member.newPage();
    await page.goto("/me?view=settings");
    await ready(page, "settings-form");

    // The defaults, as the row states them: all of it on, a finished game on, a your-turn off.
    await expect(box(page, "mail-all")).toBeChecked();
    await expect(box(page, "mail-kind-game-over")).toBeChecked();
    await expect(box(page, "mail-kind-your-turn")).not.toBeChecked();

    await box(page, "mail-kind-your-turn").check();
    await box(page, "mail-kind-game-over").uncheck();
    const saved = patchWith(page, "mail.gameOver");
    await page.getByRole("button", { name: "Save settings" }).click();
    expect((await saved).status()).toBe(200);
    expect(await kept(memberId)).toEqual({ all: true, yourTurn: "on", gameOver: "off" });

    // Off for all of it greys every row: the site never writes, whatever a row says.
    await box(page, "mail-all").uncheck();
    await expect(box(page, "mail-kind-your-turn")).toBeDisabled();
    const savedAll = patchWith(page, "emailNotify");
    await page.getByRole("button", { name: "Save settings" }).click();
    await savedAll;
    expect((await kept(memberId)).all).toBe(false);

    // And the way back, read from a fresh page as the next visit would.
    await page.goto("/me?view=settings");
    await ready(page, "settings-form");
    await expect(box(page, "mail-all")).not.toBeChecked();
    await expect(box(page, "mail-kind-your-turn")).toBeChecked();
    await box(page, "mail-all").check();
    const savedBack = patchWith(page, "emailNotify");
    await page.getByRole("button", { name: "Save settings" }).click();
    await savedBack;
    expect((await kept(memberId)).all).toBe(true);
  } finally {
    await member.close();
    await removeMemberById(memberId);
  }
});

test("the welcome asks too, and keeps each choice the moment it is pressed", async ({ browser, baseURL }) => {
  const memberId = await ownMember();
  const member = await asMember(browser, baseURL!, memberId);
  try {
    const page = await member.newPage();
    await page.goto("/me?welcome=1");
    await ready(page, "welcome-mail");
    await expect(box(page, "mail-kind-your-turn")).not.toBeChecked();

    const kept1 = patchWith(page, "mail.yourTurn");
    await box(page, "mail-kind-your-turn").check();
    await kept1;
    expect((await kept(memberId)).yourTurn).toBe("on");

    const kept2 = patchWith(page, "emailNotify");
    await box(page, "mail-all").uncheck();
    await kept2;
    expect((await kept(memberId)).all).toBe(false);
  } finally {
    await member.close();
    await removeMemberById(memberId);
  }
});

test("a member under 13 is offered no email at all, in Settings or the welcome", async ({ browser, baseURL }) => {
  const memberId = await ownMember();
  await prisma.member.update({ where: { id: memberId }, data: { ageBand: "under_13" } });
  const member = await asMember(browser, baseURL!, memberId);
  try {
    const page = await member.newPage();
    await page.goto("/me?view=settings");
    await ready(page, "settings-form");
    await expect(page.getByTestId("child-settings-note")).toBeVisible();
    await expect(page.getByTestId("mail-choices")).toHaveCount(0);
    await page.goto("/me?welcome=1");
    await expect(page.getByTestId("welcome")).toBeVisible();
    await expect(page.getByTestId("welcome-mail")).toHaveCount(0);
  } finally {
    await member.close();
    await removeMemberById(memberId);
  }
});
