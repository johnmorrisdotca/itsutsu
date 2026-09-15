import { join } from "node:path";

import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";

import { playerKey } from "../src/lib/rating/playerKey";
import { clearPeopleStanding, memberContext, memberIdFor, removeMember, seedMember, seedPeopleStanding } from "./members";
import { readyHere } from "./support";

/**
 * EVERY ROW'S ACTIONS ARE WHOLLY ON SCREEN, AND EACH ONE WORKS.
 *
 * The members list put ☆ Buddy, Ignore and Challenge at the end of every row, and
 * the row could not hold them: at 1280 the table wanted 1,199 pixels in a box of
 * 1,118, so "Challenge" ran 81 pixels past the table's right edge and read
 * "Challe…" (768: 529 past; 400: 865). The game standings did the same at 768 and
 * 400. A row now offers the game in plain sight and the rest behind "⋯", and the
 * actions cell holds to the right edge of the table's own scroll box.
 *
 * Driven by clicking, after each control says the browser has it. Each width
 * brings its own world: a reader, and a member with a long name, who has a rating
 * at Gomoku so the standings list them too.
 */

const SHOTS = process.env.SHOTS_DIR;
const LONG = "Wolfeschlegelsteinhausenbergerdorff";

type Look = { width: number; scheme: "light" | "dark"; shot: string };
const LOOKS: Look[] = [
  { width: 1280, scheme: "light", shot: "rowactions-1280-light" },
  { width: 1280, scheme: "dark", shot: "rowactions-1280-dark" },
  { width: 400, scheme: "light", shot: "rowactions-400" },
];

/** The control lies wholly inside the box the table scrolls in — not clipped by it, on either side. */
async function whollyInside(control: Locator, table: Locator, what: string) {
  await expect(control, `${what} is not visible`).toBeVisible();
  const box = await table.evaluate((element) => {
    const at = (element.parentElement as HTMLElement).getBoundingClientRect();
    return { left: at.left, right: at.right };
  });
  const at = await control.boundingBox();
  expect(at, `${what} has no box`).not.toBeNull();
  expect(at!.x, `${what} starts before the table's edge`).toBeGreaterThanOrEqual(box.left - 0.5);
  expect(at!.x + at!.width, `${what} runs past the table's right edge`).toBeLessThanOrEqual(box.right + 0.5);
}

async function noSidewaysPage(page: Page) {
  const over = await page.evaluate(() => document.scrollingElement!.scrollWidth - window.innerWidth);
  expect(over, "the page itself scrolls sideways").toBeLessThanOrEqual(0);
}

async function world(browser: Browser, baseURL: string, look: Look) {
  const stamp = `${Date.now().toString(36)}${look.width}${look.scheme[0]}`;
  const me = { email: `rowactions-${stamp}@example.test`, name: `Reader ${stamp}` };
  const them = { email: `rowactions-them-${stamp}@example.test`, name: `${LONG} ${stamp}` };
  await seedMember(them);
  const theirId = await memberIdFor(them.email);
  const key = await seedPeopleStanding("freestyle", {
    key: playerKey(them.name),
    name: them.name,
    rating: 2890,
    games: 12,
    wins: 11,
    losses: 1,
    memberId: theirId,
  });
  const context = await memberContext(browser, baseURL, me, {
    viewport: { width: look.width, height: 900 },
    colorScheme: look.scheme,
  });
  return { me, them, theirId, key, context, page: await context.newPage() };
}

for (const look of LOOKS) {
  test(`at ${look.width}px in ${look.scheme}, a member's row actions fit inside the table and each one works`, async ({
    browser,
    baseURL,
  }) => {
    const { me, them, theirId, key, context, page } = await world(browser, baseURL!, look);
    try {
      await page.goto("/players");
      const table = page.getByTestId("directory");
      await expect(table).toBeVisible();
      const row = table.locator(`tbody tr:has(a[href="/players/${theirId}"])`);
      const challenge = row.getByTestId("challenge");
      const more = row.getByTestId("row-more");
      await readyHere(more);

      await whollyInside(challenge, table, "Challenge");
      await whollyInside(more, table, "the ⋯ button");
      await noSidewaysPage(page);

      // A real disclosure: named for whose row it is, and saying whether it is open.
      await expect(more).toHaveAttribute("aria-label", /^More for Wolfeschlegelsteinhausenbergerdorff/);
      await expect(more).toHaveAttribute("aria-expanded", "false");
      await more.click();
      await expect(more).toHaveAttribute("aria-expanded", "true");
      const menu = page.locator(`#${await more.getAttribute("aria-controls")}`);
      await expect(menu).toBeVisible();
      const buddy = menu.getByTestId("buddy-toggle");
      const ignore = menu.getByTestId("ignore-toggle");
      await expect(buddy, "the menu puts focus on its first control").toBeFocused();
      await expect(buddy).toBeInViewport({ ratio: 1 });
      await expect(ignore).toBeInViewport({ ratio: 1 });
      if (SHOTS !== undefined) await page.screenshot({ path: join(SHOTS, `${look.shot}.png`) });

      // Buddy, pressed: the row marks them as a buddy. Then pressed back, which is the way out.
      await buddy.click();
      await expect(buddy).toHaveText("★ Buddy");
      await expect(more).toHaveAttribute("aria-label", /your buddy/);
      await buddy.click();
      await expect(buddy).toHaveText("☆ Buddy");
      // Ignore is pressable — asked of the control without ignoring anybody.
      await ignore.click({ trial: true });

      // Escape closes it, and focus goes back to the button that opened it.
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(more).toHaveAttribute("aria-expanded", "false");

      // The same on the game's standings, where the row offers Play and "⋯".
      await page.goto("/games/gomoku/standings");
      const standings = page.getByTestId("standings-table");
      await expect(standings).toBeVisible();
      const ladderRow = standings.locator(`tbody tr:has(a[href="/players/${theirId}"])`);
      await readyHere(ladderRow.getByTestId("row-more"));
      await whollyInside(ladderRow.getByTestId("challenge"), standings, "Play on the standings");
      await whollyInside(ladderRow.getByTestId("row-more"), standings, "the standings' ⋯ button");
      await noSidewaysPage(page);

      // And Challenge goes where it says: to the set-up page, for this member.
      await page.goto("/players");
      await readyHere(row.getByTestId("row-more"));
      await challenge.click();
      await page.waitForURL(new RegExp(`/games/new\\?against=${theirId}`));
    } finally {
      await context.close();
      await clearPeopleStanding("freestyle", key);
      await removeMember(me.email);
      await removeMember(them.email);
    }
  });
}

test("the ⋯ menu opens when pressing it first scrolls it into view, and a real scroll still closes it", async ({
  browser,
  baseURL,
}) => {
  /*
   * WHERE CI'S DATABASE PUT THE ROW, AND WHEN CI'S BROWSER TOLD THE PAGE. Its
   * "players here" panel holds a hundred names, so at 1280×900 the long-named
   * member's row sat at the foot of the window with the ⋯ button just past it.
   * Pressing it scrolled the page twenty pixels first — the trace's DOM snapshots
   * record the scroll before the press — but the screencast still drew the page
   * unscrolled ninety milliseconds after it. A browser fires a scroll's event when
   * it next renders, and that runner was rendering late, so the event arrived
   * after the menu had opened and begun listening for scrolls, and the menu shut
   * the instant it appeared. The 1280px cases above failed on CI in light and dark
   * and pass every time on a development database, whose panel is short, whose
   * row never needs scrolling to, and whose browser renders on time.
   *
   * So the window is sized to leave the button half below the fold on any
   * database, it is pressed the way a reader presses it, and the scroll's event is
   * then delivered late, as that runner delivered it.
   */
  const look: Look = { width: 1280, scheme: "light", shot: "rowactions-scrolled" };
  const { me, them, theirId, key, context, page } = await world(browser, baseURL!, look);
  try {
    await page.goto("/players");
    const table = page.getByTestId("directory");
    await expect(table).toBeVisible();
    const more = table.locator(`tbody tr:has(a[href="/players/${theirId}"])`).getByTestId("row-more");
    await readyHere(more);

    const box = await more.boundingBox();
    expect(box, "the ⋯ button has no box").not.toBeNull();
    await page.setViewportSize({ width: look.width, height: Math.floor(box!.y + box!.height / 2) });
    expect(await page.evaluate(() => window.scrollY), "the page had scrolled before the press").toBe(0);

    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    const menu = page.locator(`#${await more.getAttribute("aria-controls")}`);
    await expect(menu).toBeVisible();
    expect(await page.evaluate(() => window.scrollY), "pressing did not scroll the button into view").toBeGreaterThan(0);

    // The press's own scroll, told to the page late, as CI's runner told it: nothing has moved since the menu opened.
    await page.evaluate(() => document.dispatchEvent(new Event("scroll", { bubbles: true })));
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await expect(menu, "a scroll that moved nothing shut the menu").toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "true");

    // The way back: a scroll that moves the row away from the menu closes it.
    await page.mouse.wheel(0, 300);
    await expect(menu).toBeHidden();
    await expect(more).toHaveAttribute("aria-expanded", "false");
  } finally {
    await context.close();
    await clearPeopleStanding("freestyle", key);
    await removeMember(me.email);
    await removeMember(them.email);
  }
});
