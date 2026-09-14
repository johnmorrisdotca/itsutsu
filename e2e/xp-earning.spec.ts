import { expect, test } from "@playwright/test";

import { ready } from "./support";
import {
  ledgerFor,
  removeVisitors,
  seedVisitor,
  seedVisitorWithZone,
  standingFor,
  visitorContext,
  type Visitor,
} from "./xpLedger";

/**
 * THE ASSERTION NOBODY WAS MAKING.
 *
 * XP shipped at 0.162.0 with unit tests over the award rules, unit tests over the
 * day rules, a runner that played a real game and watched the winner be paid,
 * and three browser specs over the pages that show a total. Every one of them was
 * green while the live site paid NOBODY ANYTHING for a day, because not one of
 * them did what a member does — arrive — and then ask the database whether
 * anything had been written.
 *
 * That is the shape this file exists to close. It seeds its own member, winds
 * their clock back a day, opens a page as them, and reads `XpEvent`. It cannot be
 * satisfied by a page rendering a zero correctly, which is precisely what every
 * other XP spec could.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY EACH BIT OF THE FIXTURE IS THE WAY IT IS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `seedVisitor` makes the row with `lastSeenAt` a day back and `timeZone: ""`,
 * because that is what a real member who has never opened their profile carries
 * — and it is the state both bugs lived in. `visitorContext` signs the cookie
 * WITHOUT going through `seedMember`, whose update would stamp today over the
 * day just wound back. And every assertion is about rows this file created,
 * never about what this database happens to hold.
 */

const made: Visitor[] = [];

test.afterAll(async () => {
  await removeVisitors(made);
  made.length = 0;
});

test.describe("showing up is paid for", () => {
  test("a visit on a new day puts a row in the ledger", async ({ browser, baseURL }) => {
    const visitor = await seedVisitor("pays", 1);
    made.push(visitor);

    expect(await ledgerFor(visitor.id)).toEqual([]);

    const context = await visitorContext(browser, baseURL!, visitor);
    const page = await context.newPage();
    await page.goto("/");
    /*
     * Waited for on the masthead's own hydration marker rather than on a page
     * load event. The award itself is server-side and has happened by the time
     * the HTML arrives, but the zone write below runs in an effect — so one wait
     * makes both halves of this file honest, and an assertion made before React
     * attaches would be about the speed of the request.
     */
    await ready(page, "account-menu");

    /* Polled, because the ledger write is a different connection from the one
       that rendered the page: the row is there or it is arriving, and "not yet"
       must not read as "never". */
    await expect
      .poll(async () => (await ledgerFor(visitor.id)).map((one) => one.type), { timeout: 10_000 })
      .toContain("dailyVisit");

    const standing = await standingFor(visitor.id);
    expect(standing?.xp).toBeGreaterThan(0);

    await context.close();
  });

  test("a second visit the same day pays nothing more", async ({ browser, baseURL }) => {
    /*
     * The other half of "once a day", and the half a fixture can accidentally
     * make impossible. The first page load stamps today, so the second has to
     * find the ledger exactly as it left it.
     */
    const visitor = await seedVisitor("once", 1);
    made.push(visitor);

    const context = await visitorContext(browser, baseURL!, visitor);
    const page = await context.newPage();
    await page.goto("/");
    await ready(page, "account-menu");
    await expect
      .poll(async () => (await ledgerFor(visitor.id)).length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    const afterOne = await ledgerFor(visitor.id);

    await page.goto("/games");
    await ready(page, "account-menu");
    expect(await ledgerFor(visitor.id)).toEqual(afterOne);

    await context.close();
  });
});

test.describe("the zone a member's days are counted in", () => {
  test("is learned from the device when the member has never said", async ({ browser, baseURL }) => {
    const visitor = await seedVisitor("zone", 1);
    made.push(visitor);
    expect((await standingFor(visitor.id))?.timeZone).toBe("");

    /* The device's zone is the spec's to choose, so this asserts a literal
       rather than "whatever city this laptop is in". */
    const context = await visitorContext(browser, baseURL!, visitor, { timezoneId: "Asia/Tokyo" });
    const page = await context.newPage();
    /* The real request the browser makes, waited for rather than guessed at. */
    const saved = page.waitForResponse(
      (response) => response.url().includes("/api/me") && response.request().method() === "PATCH",
      { timeout: 15_000 },
    );
    await page.goto("/");
    await ready(page, "account-menu");
    await saved;

    await expect
      .poll(async () => (await standingFor(visitor.id))?.timeZone, { timeout: 10_000 })
      .not.toBe("");
    expect((await standingFor(visitor.id))?.timeZone).toBe("Asia/Tokyo");

    await context.close();
  });

  test("is never written over once the member has chosen one", async ({ browser, baseURL }) => {
    /*
     * The promise that matters most, and it is an ABSENCE — so it is asserted
     * only after a presence has been waited for. `ready` on the masthead means
     * React has attached in the very tree the sender would have been mounted in,
     * so "no PATCH was made" is a statement about a hydrated page rather than
     * about how fast this assertion ran.
     */
    const visitor = await seedVisitorWithZone("chosen", "Asia/Tokyo", 1);
    made.push(visitor);

    const context = await visitorContext(browser, baseURL!, visitor);
    const page = await context.newPage();
    const patches: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/me") && request.method() === "PATCH") patches.push(request.url());
    });

    await page.goto("/");
    await ready(page, "account-menu");

    expect(patches).toEqual([]);
    expect((await standingFor(visitor.id))?.timeZone).toBe("Asia/Tokyo");

    await context.close();
  });

  test("replaces a guess from the country with what the device measures", async ({ browser, baseURL }) => {
    /*
     * John's own case, end to end. His country is Canada, Canada's guess is
     * Toronto, and he is in Vancouver. A measurement beats an inference, so the
     * guess must give way to his browser the first time he opens a page.
     */
    const visitor = await seedVisitorWithZone("guess", "America/Toronto", 1, "Canada");
    made.push(visitor);

    const context = await visitorContext(browser, baseURL!, visitor, { timezoneId: "America/Vancouver" });
    const page = await context.newPage();
    const saved = page.waitForResponse(
      (response) => response.url().includes("/api/me") && response.request().method() === "PATCH",
      { timeout: 15_000 },
    );
    await page.goto("/");
    await ready(page, "account-menu");
    await saved;

    await expect
      .poll(async () => (await standingFor(visitor.id))?.timeZone, { timeout: 10_000 })
      .toBe("America/Vancouver");

    await context.close();
  });

  test("does not send back a guess the device agrees with, page after page", async ({ browser, baseURL }) => {
    /*
     * THE LOOP. A row holding exactly its country's guess reads as a guess for
     * ever, so the sender mounts on every page. Before `held` existed, a browser
     * that agreed with the guess PATCHed the same value on each of them — a
     * request per page to change nothing. Two pages, because one page cannot
     * show a loop, and the absence is asserted only after each has hydrated.
     */
    const visitor = await seedVisitorWithZone("agrees", "America/Toronto", 1, "Canada");
    made.push(visitor);

    const context = await visitorContext(browser, baseURL!, visitor, { timezoneId: "America/Toronto" });
    const page = await context.newPage();
    const patches: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/me") && request.method() === "PATCH") patches.push(request.url());
    });

    await page.goto("/");
    await ready(page, "account-menu");
    await page.goto("/games");
    await ready(page, "account-menu");

    expect(patches).toEqual([]);
    expect((await standingFor(visitor.id))?.timeZone).toBe("America/Toronto");

    await context.close();
  });
});
