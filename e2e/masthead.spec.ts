import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * THE MASTHEAD DOES NOT MOVE ONCE THE PAGE IS LIVE.
 *
 * The count of games waiting on you is read in the browser, so it arrives a
 * moment after the page does — and it used to arrive INTO the navigation bar's
 * flow. At 768, an iPad's width, the bar had no room for it: the badge wrapped
 * it onto a line of its own and pushed the whole page down 36 pixels, with the
 * masthead going from 61 to 97. See `YourTurnBadge`, which carries the fix and
 * the measurement.
 *
 * THREE ASSERTIONS, ONE STEP APART, AND THE LAST TWO ARE WHAT MAKE THE FIRST
 * HONEST. The masthead's height is the thing a reader sees, and on its own it
 * can pass for the wrong reason: the bar's width depends on how long the
 * signed-in address is, so a member whose address already wraps the bar has a
 * masthead that is the same height before and after — two lines either way —
 * however much the badge adds. So the bar's width is asserted too, which was
 * wrong at 768 before the fix (531 pixels, then 558); and the PLAY LINK's own
 * width, which was wrong at every width there is (28 pixels, then 55) because
 * it is the box the badge was appended to.
 *
 * Run against the badge as it was, the link's width fails in both cases below
 * and the bar's width fails at 768. The masthead's height at 390 does not:
 * there the bar is on two lines whatever the badge does, so that one case was
 * green before the fix as well. It is here as the guard for a phone — a change
 * that starts shifting the masthead on one is caught — and not as evidence.
 *
 * The count is held back rather than raced for. `page.route` keeps the reply to
 * `/api/games/mine` until the first measurement is taken, so "the badge is not
 * here yet" is a fact rather than a guess — and the slot it will appear in
 * carries `data-ready`, so the absence is asserted on a page the browser has
 * taken over rather than on one that has not finished arriving.
 */
test.describe("the masthead", () => {
  for (const width of [768, 390]) {
    test(`does not shift when the waiting count arrives, at ${width}`, async ({ browser, baseURL }) => {
      const stamp = `${Date.now().toString(36)}${width}`;
      const me = { email: `mast-${stamp}@example.test`, name: `Mast ${stamp}` };
      const context = await memberContext(browser, baseURL!, me);
      try {
        /*
         * Its own game, waiting on its own seat. The badge counts the seats
         * this browser holds and the ones bound to the account, so a spec that
         * leaned on whatever this database already had would be counting four
         * hundred other tests' leavings — see AGENTS.md, "A Spec Should Bring
         * Its Own World".
         */
        const made = await context.request.post("/api/games/live", {
          data: { blackName: "Kai", whiteName: me.name, size: 9 },
        });
        expect(made.status(), "could not start a game to wait on").toBe(201);
        const game = (await made.json()) as { id: string; blackToken: string; whiteToken: string };

        const page = await context.newPage();
        await page.setViewportSize({ width, height: 900 });
        // Taking the white seat binds it to this account, the way a seat link does.
        await page.goto(`/games/gomoku/match/${game.id}/seat/${game.whiteToken}`);
        const moved = await context.request.post(`/api/games/${game.id}/moves`, {
          data: { token: game.blackToken, row: 4, col: 4 },
        });
        expect(moved.ok(), "black could not move, so nothing is waiting").toBe(true);

        // The count is held until the page has been measured without it.
        let release = () => {};
        const held = new Promise<void>((resolve) => {
          release = resolve;
        });
        await page.route("**/api/games/mine**", async (route) => {
          await held;
          await route.continue();
        });

        await page.goto("/players");
        await ready(page, "your-turn-slot");
        await expect(
          page.getByTestId("your-turn-badge"),
          "the count arrived before it could be measured without it",
        ).toHaveCount(0);

        const masthead = page.locator("header[data-chrome]");
        const bar = masthead.locator("nav");
        const play = bar.locator('a[href="/play"]');
        const before = {
          masthead: await heightOf(masthead),
          bar: await widthOf(bar),
          play: await widthOf(play),
        };

        release();
        await expect(page.getByTestId("your-turn-badge")).toHaveText("1");

        expect(await widthOf(play), "the badge widened the link it hangs off").toBe(before.play);
        expect(await widthOf(bar), "the badge widened the navigation bar").toBe(before.bar);
        expect(await heightOf(masthead), "the badge moved the masthead, and the page under it").toBe(
          before.masthead,
        );
      } finally {
        await context.close();
        await removeMember(me.email);
      }
    });
  }
});

/** A rounded height, so a sub-pixel difference is not read as a shift. */
async function heightOf(locator: import("@playwright/test").Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("nothing to measure");
  return Math.round(box.height);
}

async function widthOf(locator: import("@playwright/test").Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("nothing to measure");
  return Math.round(box.width);
}
