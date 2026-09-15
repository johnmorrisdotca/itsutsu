import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { PLAYER_SESSION_DAYS, SESSION_COOKIE, expiryInDays, signSession } from "../src/lib/auth/session";
import { memberContext, memberIdFor, seedMember } from "./members";
import { ADMIN_STATE, ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * SOMEBODY WHO CAME IN WITH AN INVITE CODE HAS A FULL ACCOUNT.
 *
 * John chose it: "give them a full account". Redeeming a code used to let a
 * browser in and nothing more — no member row, no address — so everybody he
 * invited could post a seat and nothing else: every challenge, computer game,
 * buddy, ignore, mark and saved board answered 401. Redeeming a code makes a
 * member now, the session carries its id, and everything a member does is keyed
 * by that id.
 *
 * These specs drive it the way a person does, from the door: a code redeemed at
 * /join, a name chosen on the welcome, then the four things the old session could
 * not do. Beside them, a browser still holding an invite cookie from before is
 * turned into a member on its next visit, and a member signed in the old way — an
 * address in the cookie and no id — is unaffected.
 *
 * Every row a case makes is its own: a code minted for it, a person seeded for it,
 * games registered with `gamesMade`, and the members removed when the file ends.
 */

const stamp = Date.now().toString(36);
/** Members this file made that no fixture sweeps: the ones a code made have no address. */
const madeMembers: string[] = [];

test.afterAll(async () => {
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL) || madeMembers.length === 0) return;
  const prisma = new PrismaClient();
  try {
    await prisma.member.deleteMany({ where: { id: { in: madeMembers } } });
  } finally {
    await prisma.$disconnect();
  }
});

/** The member a code made, found by the unique name this file gave it. */
async function memberNamed(name: string): Promise<{ id: string; email: string | null }> {
  process.loadEnvFile(".env");
  const prisma = new PrismaClient();
  try {
    return await prisma.member.findFirstOrThrow({ where: { name }, select: { id: true, email: true } });
  } finally {
    await prisma.$disconnect();
  }
}

/** Presses a button that does nothing until React holds it, until it has done what it says. */
async function pressUntil(press: () => Promise<void>, done: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await press();
    await done();
  }).toPass({ timeout: 30_000 });
}

/** From a player's page through the set-up screen and the doorstep, to the board a game was made on. */
async function askFromTheirPage(page: Page, playerId: string, mine: (id: string) => string): Promise<void> {
  await page.goto(`/players/${playerId}`);
  const actions = page.getByTestId("player-actions");
  await expect(actions).toBeVisible();
  await actions.getByTestId("challenge").click();
  await ready(page, "set-up-game");
  const go = page.getByTestId("set-up-start");
  await expect(go).toBeEnabled();
  await go.click();
  await ready(page, "doorstep");
  await page.getByTestId("doorstep-begin").click();
  await expect(page).toHaveURL(/\/games\/[^/]+\/match\/[^/?#]+(?:\/\d+)?$/);
  mine(new URL(page.url()).pathname.split("/")[4]);
}

test.describe("a player who came in with an invite code", () => {
  const mine = gamesMade();

  test("redeems a code, chooses a name, and challenges a person, plays a computer, keeps a buddy and applauds", async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(180_000);

    // The operator mints the code, exactly as the invitations panel does.
    const operator = await browser.newContext({ storageState: ADMIN_STATE });
    const minted = await operator.request.post("/api/invites", { data: { note: `invite-accounts ${stamp}` } });
    expect(minted.status(), await minted.text()).toBe(201);
    const { code } = (await minted.json()) as { code: string };

    // Somebody to ask, with an account of their own.
    const person = { email: `asked-${stamp}@example.test`, name: `Asked${stamp} Person` };
    await seedMember(person);
    const personId = await memberIdFor(person.email);

    // THE DOOR: a fresh browser, the code from the invitation link, one press.
    const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const page = await guest.newPage();
    await page.goto(`/join?code=${code}`);
    await ready(page, "join-form");
    await expect(page.getByTestId("invite-code")).toHaveValue(code);
    await page.getByTestId("join-submit").click();

    // THE WELCOME: an account with a placeholder name, and the one thing it lacks said out loud.
    await expect(page).toHaveURL(/\/me\?welcome=1/);
    await expect(page.getByTestId("welcome")).toBeVisible();
    await expect(page.getByTestId("welcome-no-address")).toBeVisible();
    await expect(page.getByTestId("me-name")).toContainText("Guest");

    const chosen = `Kiko${stamp}`;
    await pressUntil(
      async () => {
        await page.getByTestId("display-name").fill(chosen);
        await page.getByRole("button", { name: /save/i }).click();
      },
      async () => expect(page).not.toHaveURL(/welcome=1/, { timeout: 3_000 }),
    );
    const account = await memberNamed(chosen);
    madeMembers.push(account.id);
    expect(account.email, "a code makes an account with no address").toBeNull();

    // CHALLENGE A PERSON: an offer, from their page.
    await askFromTheirPage(page, personId, mine);

    // PLAY A COMPUTER PLAYER, from its page. The directory's Computers tab makes sure the programs exist.
    await page.goto("/players?view=computers");
    await expect(page.getByTestId("computer-player-name").first()).toBeVisible();
    await askFromTheirPage(page, "dan", mine);

    // KEEP A BUDDY, on the person's page, and find them on this account's own list.
    await page.goto(`/players/${personId}`);
    const toggle = page.getByTestId("player-actions").getByTestId("buddy-toggle");
    await pressUntil(
      async () => {
        if ((await toggle.textContent())?.includes("☆")) await toggle.click();
      },
      async () => expect(toggle).toHaveText(/★ Buddy/, { timeout: 3_000 }),
    );
    await page.goto("/me?view=people");
    await expect(page.getByTestId("buddies")).toContainText(`Asked${stamp}`);

    // APPLAUD A FINISHED GAME: one this account starts and resigns, then marks on its page.
    const started = await guest.request.post("/api/games/live", {
      data: { blackName: `Clap${stamp}`, whiteName: `Foil${stamp}`, size: 9 },
    });
    expect(started.status(), await started.text()).toBe(201);
    const game = (await started.json()) as { id: string; whiteToken: string };
    mine(game.id);
    expect((await guest.request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);
    await page.goto(`/games/gomoku/match/${game.id}`);
    await ready(page, "applause");
    await page.getByTestId("applause-well-played").click();
    await expect(page.getByTestId("applause-well-played")).toHaveAttribute("aria-pressed", "true");

    await guest.close();
    await operator.close();
  });

  test("is told on the welcome that the account lives only in this browser, and can link Google or add four words from there", async ({
    browser,
    baseURL,
  }) => {
    const operator = await browser.newContext({ storageState: ADMIN_STATE });
    const minted = await operator.request.post("/api/invites", { data: { note: `invite-keep ${stamp}` } });
    expect(minted.status(), await minted.text()).toBe(201);
    const { code } = (await minted.json()) as { code: string };
    await operator.close();

    const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const page = await guest.newPage();
    await page.goto(`/join?code=${code}`);
    await ready(page, "join-form");
    await page.getByTestId("join-submit").click();
    await expect(page).toHaveURL(/\/me\?welcome=1/);
    const guestName = ((await page.getByTestId("me-name").textContent()) ?? "").trim();
    expect(guestName).toContain("Guest");
    madeMembers.push((await memberNamed(guestName)).id);

    // SAID PLAINLY, ON THE WELCOME, BEFORE ANY NAME IS SAVED: this browser, this month, and what changes that.
    await ready(page, "welcome-keep");
    const said = page.getByTestId("welcome-no-address");
    await expect(said).toContainText(`only in this browser, and only for ${PLAYER_SESSION_DAYS} days`);
    await expect(said).toContainText("unless you link Google");

    // FOUR WORDS: one press from the welcome to the picker that sets them.
    await page.getByTestId("welcome-add-words").click();
    await expect(page).toHaveURL(/\/me\?view=words$/);
    await ready(page, "phrase-setup");
    await page.getByTestId("phrase-set-button").click();
    await expect(page.getByTestId("phrase-picker")).toBeVisible();

    // GOOGLE: back to the welcome, and the button starts Google's sign-in, returning through the route that attaches the address.
    await page.goto("/me?welcome=1");
    await ready(page, "welcome-keep");
    // Nothing leaves this machine: NextAuth's answer is stood in for, and sends the browser home rather than to Google.
    await page.route("**/api/auth/signin/google", (route) => route.fulfill({ json: { url: `${baseURL}/me` } }));
    const started = page.waitForRequest((request) => request.url().includes("/api/auth/signin/google") && request.method() === "POST");
    await page.getByTestId("welcome-link-google").click();
    const form = new URLSearchParams((await started).postData() ?? "");
    expect(form.get("callbackUrl")).toBe("/api/session/google?next=%2Fme");
    await expect(page).toHaveURL(/\/me$/);

    await guest.close();
  });

  test("is made a member on the next visit when their invite cookie is from before accounts", async ({ browser, baseURL }) => {
    // What a browser that redeemed a code yesterday is holding: a signed session with a code and nobody in it.
    const legacyCode = `legacy-${stamp}`;
    const token = await signSession({ kind: "player", code: legacyCode, exp: expiryInDays(PLAYER_SESSION_DAYS) });
    expect(token, "the suite's .env has an AUTH_SECRET").not.toBeNull();
    const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    await context.addCookies([{ name: SESSION_COOKIE, value: token as string, url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();

    // Any page: the account menu asks /api/session who is here, and that is where the member is made.
    const asked = page.waitForResponse((response) => response.url().endsWith("/api/session") && response.request().method() === "GET");
    await page.goto("/games");
    expect((await asked).status()).toBe(200);

    // The next page is a member's: their own page, with a name to change rather than the door.
    await page.goto("/me");
    await expect(page).toHaveURL(/\/me/);
    await expect(page.getByTestId("me-name")).toContainText("Guest");

    process.loadEnvFile(".env");
    const prisma = new PrismaClient();
    try {
      const made = await prisma.member.findMany({ where: { invitedWith: legacyCode }, select: { id: true } });
      expect(made, "one member for one browser, however many parts of the page asked").toHaveLength(1);
      madeMembers.push(...made.map((one) => one.id));
    } finally {
      await prisma.$disconnect();
    }
    await context.close();
  });
});

test.describe("a member who came in by Google", () => {
  const mine = gamesMade();

  test("keeps a buddy and applauds exactly as before, with a cookie that names them by address", async ({ browser, baseURL }) => {
    const me = { email: `google-${stamp}@example.test`, name: `Google${stamp} Member` };
    const them = { email: `their-${stamp}@example.test`, name: `Their${stamp} Member` };
    await seedMember(them);
    const theirId = await memberIdFor(them.email);
    // `memberContext` signs the session the way a Google sign-in from before did: an address, and no member id.
    const context = await memberContext(browser, baseURL!, me);
    const page = await context.newPage();

    await page.goto(`/players/${theirId}`);
    const toggle = page.getByTestId("player-actions").getByTestId("buddy-toggle");
    await expect(toggle).toBeVisible();
    await pressUntil(
      async () => {
        if ((await toggle.textContent())?.includes("☆")) await toggle.click();
      },
      async () => expect(toggle).toHaveText(/★ Buddy/, { timeout: 3_000 }),
    );

    const started = await context.request.post("/api/games/live", {
      data: { blackName: `Gclap${stamp}`, whiteName: `Gfoil${stamp}`, size: 9 },
    });
    const game = (await started.json()) as { id: string; whiteToken: string };
    mine(game.id);
    expect((await context.request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);
    await page.goto(`/games/gomoku/match/${game.id}`);
    await ready(page, "applause");
    await page.getByTestId("applause-brilliant").click();
    await expect(page.getByTestId("applause-brilliant")).toHaveAttribute("aria-pressed", "true");

    // Their own page still shows the address they signed in with.
    await page.goto("/me");
    await expect(page.getByText(me.email)).toBeVisible();
    await context.close();
  });
});

test.describe("a reader with no session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is opened nothing: the lobby is the catalogue, and setting up and players are behind the door", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByTestId("games-join")).toBeVisible();
    await expect(page.getByTestId("lobby-start")).toHaveCount(0);

    await page.goto("/games/gomoku/new");
    await expect(page).toHaveURL(/\/join/);

    await page.goto("/players/dan");
    await expect(page).toHaveURL(/\/join/);
  });
});
