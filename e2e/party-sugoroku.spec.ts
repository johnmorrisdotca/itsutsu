import { expect, test, type Page } from "@playwright/test";

import { SUGOROKU_LENGTHS } from "../src/lib/party/sugoroku/sugoroku.constants";
import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { memberContext, removeMember } from "./members";
import { ready } from "./support";
import { removeTables } from "./tables";

/**
 * THE BACKGAMMON GAMES (`PartyKind` backgammon, nackgammon, longGammon,
 * hypergammon, backgammonRace, antiBackgammon and tabula; docs/plans/sugoroku/),
 * at home in the Tables family: round one device against the computer, and on
 * two devices.
 *
 * Driven as a table drives it: set up from the game's own page, the dice
 * rolled, a checker tapped and the point it goes to tapped, Done. A game is
 * played to its end, a gammon is taken from a known position, and the cube is
 * offered, taken and seen on the board. The table on one device lives in this
 * browser only; the table on two is this spec's own, taken away at the end.
 *
 * The computers are at their weakest, so a game is quick; the dice are the
 * game's own, thrown from a fresh seed, so the tests choose among whatever the
 * board lights, never a particular play.
 */
const PHONE = { width: 390, height: 844 };
/** The seven, by name: backgammon, nackgammon, longGammon, hypergammon, backgammonRace, antiBackgammon and tabula. */
const KINDS = ["backgammon", "nackgammon", "longGammon", "hypergammon", "backgammonRace", "antiBackgammon", "tabula"] as const;
const keptKey = (kind: string) => `itsutsu.${kind}`;

test.use({ reducedMotion: "reduce" });

const stage = (page: Page) => page.getByTestId("sugoroku-stage");

async function clearKept(page: Page, kind: string) {
  await page.goto("/games");
  await page.evaluate((key) => window.localStorage.removeItem(key), keptKey(kind));
}

/** Sets a table up from the game's page: a single game or a match, against the computer at the weakest strength. */
async function startAgainstComputer(page: Page, kind: string, points: number) {
  await clearKept(page, kind);
  await page.goto(`/games/${PARTY_SLUGS[kind as keyof typeof PARTY_SLUGS]}/pass-and-play`);
  await ready(page, "sugoroku-set-up");
  await page.locator(`[data-testid="sugoroku-length"][data-points="${points}"]`).click();
  await page.getByTestId("sugoroku-name").first().fill("Ann");
  await expect(page.getByTestId("sugoroku-computer")).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-testid="sugoroku-strength"] [data-value="random"]').click();
  await page.getByTestId("sugoroku-start").click();
  await ready(page, "sugoroku-game");
  await expect(stage(page)).toBeVisible();
}

/** Where a press on the board for white's own point goes: a point, the bar, or off the board. */
function spot(page: Page, own: number) {
  if (own === 25) return page.locator('[data-bar="white"]').first();
  if (own === 0) return page.locator('[data-tray="white"]').first();
  return page.locator(`.sg-point[data-board="${own}"]`);
}

/**
 * One turn of the person at white: roll if the table asks, then tap a lit checker and a lit point until Done
 * is offered, press Done. Returns false when there is nothing for a person to do now.
 */
async function takeTurn(page: Page): Promise<boolean> {
  const roll = page.getByTestId("sugoroku-roll");
  if ((await roll.count()) > 0 && (await roll.isEnabled())) await roll.click();
  await expect(stage(page)).toHaveAttribute("data-phase", /move|over/);
  if ((await stage(page).getAttribute("data-phase")) === "over") return false;
  for (let guard = 0; guard < 8; guard += 1) {
    if (await page.getByTestId("sugoroku-done").isEnabled()) break;
    const movable = ((await page.getByTestId("sugoroku-board").getAttribute("data-movable")) ?? "").split(",").filter(Boolean).map(Number);
    expect(movable.length, "a turn not played out lights a checker to move").toBeGreaterThan(0);
    await spot(page, movable[0]!).click();
    await expect(page.getByTestId("sugoroku-board")).toHaveAttribute("data-from", String(movable[0]));
    const targets = ((await page.getByTestId("sugoroku-board").getAttribute("data-targets")) ?? "").split(",").filter(Boolean).map(Number);
    expect(targets.length).toBeGreaterThan(0);
    const left = await stage(page).getAttribute("data-left");
    await spot(page, targets[0]!).click();
    await expect(stage(page)).not.toHaveAttribute("data-left", left!);
  }
  await page.getByTestId("sugoroku-done").click();
  return true;
}

/** Plays until the match is over, answering a double with Take. */
async function playToTheEnd(page: Page) {
  for (let turn = 0; turn < 400; turn += 1) {
    await expect(stage(page)).toHaveAttribute("data-phase", /roll|move|answer|over|waiting/);
    const phase = await stage(page).getAttribute("data-state");
    if (phase === "finished") return;
    const now = await stage(page).getAttribute("data-phase");
    if (now === "waiting") {
      await page.waitForTimeout(150);
      continue;
    }
    if (now === "answer") await page.getByTestId("sugoroku-take").click();
    else await takeTurn(page);
  }
  throw new Error("a match did not end in four hundred turns");
}

test.describe("the backgammon games, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const kind of KINDS) {
    test(`${kind}: its front door, rules and the family open with no session`, async ({ page }) => {
      const slug = PARTY_SLUGS[kind];
      await page.goto(`/games/${slug}`);
      await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
      await expect(page.getByTestId("game-family")).toContainText("Tables");
      await page.getByTestId("game-rules-link").click();
      await expect(page).toHaveURL(new RegExp(`/games/${slug}/rules$`));
      await expect(page.getByTestId("rules-page")).toContainText("bear off");
      await page.goto("/games/tables");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Tables");
      await expect(page.locator('[data-testid="family-mark"][data-family="Tables"]').first()).toBeVisible();
      await expect(page.locator("main")).toContainText("Hypergammon");
    });
  }
});

test.describe("the backgammon games, round one device", () => {
  for (const kind of KINDS) {
    test(`${kind}: set up against the computer, the dice rolled and a turn played, kept and waiting on My games`, async ({ page }) => {
      test.setTimeout(90_000);
      await startAgainstComputer(page, kind, 1);
      await expect(stage(page)).toHaveAttribute("data-state", "playing");
      await expect(page.getByTestId("sugoroku-board")).toHaveAttribute("data-orientation", "landscape");
      // Whoever the opening throw favours starts: a computer's first turn lands, then the person's.
      await expect(stage(page)).toHaveAttribute("data-phase", /roll|move/, { timeout: 30_000 });
      const before = await page.getByTestId("sugoroku-news").textContent();
      expect(await takeTurn(page)).toBe(true);
      await expect(stage(page)).toHaveAttribute("data-phase", /roll|move|waiting|over/);
      await expect(page.getByTestId("sugoroku-news")).not.toHaveText(before ?? "");

      const score = await stage(page).getAttribute("data-score");
      await page.reload();
      await ready(page, "sugoroku-game");
      await expect(stage(page)).toHaveAttribute("data-score", score!);
      await page.goto("/play/pass-and-play");
      const waiting = page.locator(`[data-testid="party-game"][data-variant="${kind}"]`);
      await expect(waiting).toContainText("Single game");
      await waiting.getByTestId("party-game-continue").click();
      await ready(page, "sugoroku-game");
      await page.getByTestId("sugoroku-new").click();
      await page.getByTestId("sugoroku-new-yes").click();
      await ready(page, "sugoroku-set-up");
    });
  }

  test("a single game of Hypergammon against the computer is played to its end", async ({ page }) => {
    test.setTimeout(180_000);
    await startAgainstComputer(page, "hypergammon", 1);
    await playToTheEnd(page);
    await expect(stage(page)).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("sugoroku-status")).toContainText(/wins/);
    await expect(page.getByTestId("sugoroku-again")).toBeVisible();
  });

  test("a match to three of Hypergammon is played to its end, with the cube offered along the way", async ({ page }) => {
    test.setTimeout(240_000);
    await startAgainstComputer(page, "hypergammon", 3);
    await playToTheEnd(page);
    await expect(page.getByTestId("sugoroku-status")).toContainText(/wins the match \d+ to \d+/);
    const score = (await stage(page).getAttribute("data-score"))!.split("-").map(Number);
    expect(Math.max(...score)).toBeGreaterThanOrEqual(3);
  });

  test("the cube: offered to the computer, which takes it, turns to two and is the computer's", async ({ page }) => {
    test.setTimeout(150_000);
    await startAgainstComputer(page, "backgammon", 5);
    await expect(stage(page)).toHaveAttribute("data-cube", "1");
    await expect(stage(page)).toHaveAttribute("data-cube-owner", "none");
    // Play on until the cube may be offered: after the opening turn, at the start of the person's turn, before the roll.
    for (let turn = 0; turn < 6; turn += 1) {
      await expect(stage(page)).toHaveAttribute("data-phase", /roll|move/, { timeout: 30_000 });
      if ((await stage(page).getAttribute("data-phase")) === "roll" && (await page.getByTestId("sugoroku-double").isEnabled())) break;
      await takeTurn(page);
    }
    await page.getByTestId("sugoroku-double").click();
    // The weakest computer takes every double.
    await expect(stage(page)).toHaveAttribute("data-cube", "2", { timeout: 30_000 });
    await expect(stage(page)).toHaveAttribute("data-cube-owner", "black");
    await expect(page.getByTestId("sugoroku-score")).toContainText("Cube 2");
    // The computer holds it, so there is no Double for the person now.
    await expect(stage(page)).toHaveAttribute("data-phase", /roll|move/, { timeout: 30_000 });
    if ((await stage(page).getAttribute("data-phase")) === "roll") await expect(page.getByTestId("sugoroku-double")).toBeDisabled();
  });

  test("a gammon, taken from a known position: the last turn bears off with the other side's checkers all still on the board", async ({ page }) => {
    test.setTimeout(60_000);
    await clearKept(page, "hypergammon");
    await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [keptKey("hypergammon"), GAMMON_ONE_TURN_AWAY] as const);
    await page.goto("/games/hypergammon/pass-and-play");
    await ready(page, "sugoroku-game");
    await expect(stage(page)).toHaveAttribute("data-phase", "roll");
    expect(await takeTurn(page)).toBe(true);
    await expect(stage(page)).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("sugoroku-status")).toContainText("with a gammon");
  });

  test("a link from a kept record carries its match length into the set-up", async ({ page }) => {
    await clearKept(page, "backgammon");
    await page.goto("/games/backgammon?points=9");
    await page.getByTestId("party-kind-offer").getByRole("link").click();
    await ready(page, "sugoroku-set-up");
    await expect(page.locator('[data-testid="sugoroku-length"][data-points="9"]')).toHaveAttribute("aria-checked", "true");
    // A length the game is not played to is ignored.
    await page.goto("/games/tabula/pass-and-play?points=9");
    await ready(page, "sugoroku-set-up");
    await expect(page.locator('[data-testid="sugoroku-length"]')).toHaveCount(SUGOROKU_LENGTHS.tabula.length);
  });

  test("on a phone the board stands up and the page does not scroll sideways", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await startAgainstComputer(page, "nackgammon", 1);
    await expect(page.getByTestId("sugoroku-board")).toHaveAttribute("data-orientation", "portrait");
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
  });
});

test.describe("the backgammon games on two devices", () => {
  const stamp = Date.now().toString(36);
  const host = { email: `sugoroku-host-${stamp}@example.test`, name: `Ada-${stamp}` };
  const made: string[] = [];

  test.afterAll(async () => {
    await removeTables(made);
    await removeMember(host.email);
  });

  test("a member and the computer at a table of their own: a turn sent, checked by the server, and answered by the computer", async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const context = await memberContext(browser, baseURL!, host, { viewport: PHONE, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/games/hypergammon/pass-and-play");
    await ready(page, "sugoroku-set-up");
    await page.getByTestId("online-where-several").click();
    await page.locator('[data-testid="online-seat-choice"][data-seat="1"]').selectOption("computer:random");
    await page.getByTestId("sugoroku-start").click();
    await expect(page).toHaveURL(/\/games\/hypergammon\/tables\/[a-z0-9]{4}-[a-z0-9]{4}$/);
    made.push(new URL(page.url()).pathname.split("/").at(-1)!);
    await ready(page, "online-table");
    await expect(stage(page)).toHaveAttribute("data-seat", "0");

    // Whoever the opening throw favours: a computer's first turn arrives, then the member's own.
    await expect(stage(page)).toHaveAttribute("data-phase", /roll|move/, { timeout: 40_000 });
    const before = Number(await page.getByTestId("online-table").getAttribute("data-version"));
    expect(await takeTurn(page)).toBe(true);
    await expect.poll(async () => Number(await page.getByTestId("online-table").getAttribute("data-version")), { timeout: 20_000 }).toBeGreaterThan(before);
    // The server refuses a move that is not the seat's to make, and a play the dice do not allow.
    const id = made[0]!;
    const refused = await context.request.post(`/api/tables/${id}/moves`, { data: { moves: 0, seat: 1, move: { t: "play", steps: [[24, 23]] } } });
    expect([403, 409, 422]).toContain(refused.status());
    await expect(page.getByTestId("online-seat").nth(1)).toContainText("Computer");
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(wide, "the page scrolls sideways at 390px").toBeLessThanOrEqual(0);
    await context.close();
  });
});

/** Ann (white) to play the last turn of a game of Hypergammon in which she will bear off her last checker while Bot has borne off none. */
const GAMMON_ONE_TURN_AWAY = `sugoroku-table 1
kind hypergammon
names ["Ann","Bot"]
levels ["","random"]
sugoroku 1
variant hypergammon
points 1
cube off
crawford on
jacoby off
beaver off
gammons off
seed 2
game 1
open 5 2
white 52: 24/19 23/21
black 24: 23/19/17
white 64: 22/16/12
black 33: 22/19 17/14/11/8
white 51: 19/14/13
black 52: 19/14 8/6
white 36: 12/6/3
black 41: 24/20 6/5
white 53: 21/16/13
black 61: 14/8/7
white 61: 13/7/6
black 12: 20/18/17
white 16: 13/7 6/5
black 34: 17/14 5/1
white 62: 7/5/off
black 33: 14/11/8/5/2
white 14: 5/1/off
black 11: 7/6/5/4 2/1
`;
