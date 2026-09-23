import { expect, test, type BrowserContext } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { ready, readyHere } from "./support";

/**
 * THE INBOX: what happened while you were away (John, 2026-09-16, after
 * ItsYourTurn's). Two members nobody else has met; the things that happen to
 * them are done through the doors a player uses — a challenge asked, declined
 * by clicking on /play, a game resigned, a note sent with a word in it — and
 * each lands in the other's inbox, which counts it on /play until it is read.
 */
test.describe("the inbox", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();
  let asker: BrowserContext;
  let asked: BrowserContext;
  const stamp = Date.now().toString(36);
  const ASKER = { email: `inbox-asker-${stamp}@example.test`, name: under(`Asker${stamp} Inbox`) };
  const ASKED = { email: `inbox-asked-${stamp}@example.test`, name: under(`Asked${stamp} Inbox`) };

  test.beforeAll(async ({ browser, baseURL }) => {
    asker = await memberContext(browser, baseURL!, ASKER);
    asked = await memberContext(browser, baseURL!, ASKED);
  });

  test.afterAll(async () => {
    await asker?.close();
    await asked?.close();
    await removeMember(ASKER.email);
    await removeMember(ASKED.email);
  });

  test("tells the person asked, and then the asker, how a challenge went", async () => {
    const askedId = await memberIdFor(ASKED.email);
    const page = await asker.newPage();
    const offered = await page.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 5, challengeId: askedId, moveTimeMs: null },
    });
    expect(offered.status(), await offered.text()).toBe(201);
    const { id } = (await offered.json()) as { id: string };
    mine(id);

    // The one asked: counted on /play, and there in the inbox with the way to answer.
    const theirs = await asked.newPage();
    await theirs.goto("/play");
    await expect(theirs.getByTestId("play-inbox")).not.toHaveAttribute("data-unread", "0");
    await theirs.getByTestId("play-inbox").click();
    await expect(theirs.getByTestId("inbox")).toBeVisible();
    const item = theirs.getByTestId("inbox-item").filter({ has: theirs.locator(`[href*="${id}"]`) });
    await expect(item).toHaveAttribute("data-kind", "offer");
    // Names are shown with the surname cut to an initial; the first name is enough to know them.
    await expect(item).toContainText(ASKER.name.split(" ")[0]);
    await expect(item.getByTestId("inbox-open")).toContainText("Answer it");

    // Read now: /play no longer counts it.
    await theirs.goto("/play");
    await expect(theirs.getByTestId("play-inbox")).toHaveAttribute("data-unread", "0");

    // They decline it by clicking, and the asker hears.
    const row = theirs.getByTestId("my-games-offered").locator(`[data-id="${id}"]`);
    await readyHere(row.getByTestId("offer-buttons"));
    await row.getByTestId("offer-decline").click();
    await expect(row).toHaveCount(0);

    await page.goto("/inbox");
    await expect(page.getByTestId("inbox")).toBeVisible();
    const declined = page.getByTestId("inbox-item").filter({ has: page.locator(`[href*="${id}"]`) });
    await expect(declined).toHaveAttribute("data-kind", "offer-declined");
    await expect(declined).toContainText(ASKED.name.split(" ")[0]);
  });

  test("tells both players a game is over, and the other one about a note with words", async () => {
    const page = await asker.newPage();
    const started = await page.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, winLength: 5, moveTimeMs: null, rated: false, blackName: ASKER.name, whiteName: ASKED.name, open: true },
    });
    expect(started.status(), await started.text()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };
    mine(game.id);

    // The other member takes the posted seat from the lobby door: the poster hears.
    const theirs = await asked.newPage();
    const sat = await theirs.request.post(`/api/games/${game.id}/sit`);
    expect(sat.status(), await sat.text()).toBe(200);

    // A stone, and a note with words from Black; then Black resigns.
    const played = await page.request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    expect(played.status(), await played.text()).toBe(201);
    const noted = await page.request.post(`/api/games/${game.id}/reactions`, {
      data: { token: game.blackToken, emoji: "👋", moveNumber: 1, text: "Good luck" },
    });
    expect(noted.status(), await noted.text()).toBe(201);
    const resigned = await page.request.post(`/api/games/${game.id}/resign`, { data: { token: game.blackToken } });
    expect(resigned.status(), await resigned.text()).toBe(200);

    await page.goto("/inbox");
    await ready(page, "account-menu");
    const posterItems = page.getByTestId("inbox-item").filter({ has: page.locator(`[href*="${game.id}"]`) });
    await expect(posterItems.and(page.locator('[data-kind="seat-taken"]'))).toHaveCount(1);
    await expect(posterItems.and(page.locator('[data-kind="game-over"]'))).toContainText("you lost");

    await theirs.goto("/inbox");
    const theirItems = theirs.getByTestId("inbox-item").filter({ has: theirs.locator(`[href*="${game.id}"]`) });
    await expect(theirItems.and(theirs.locator('[data-kind="note"]'))).toContainText("Good luck");
    await expect(theirItems.and(theirs.locator('[data-kind="game-over"]'))).toContainText("you won");
  });
});
