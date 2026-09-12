import { readFileSync } from "node:fs";
import { expect, request as playwrightRequest, test } from "@playwright/test";

import { EMBED_TOKEN_FILE, PLAYER_STATE, ready } from "./support";

/**
 * Embedding, from the position another site is in: no session, no cookies.
 *
 * A cross-site iframe cannot rely on cookies, so these specs deliberately run
 * with none — the token in the URL has to carry the whole thing.
 */
function embedToken(): string {
  return (JSON.parse(readFileSync(EMBED_TOKEN_FILE, "utf8")) as { token: string })
    .token;
}

test.describe("an embedded board", () => {
  test("loads and is playable with a valid token", async ({ page }) => {
    await page.goto(`/embed?token=${embedToken()}&size=9`);

    await expect(page.getByRole("button", { name: /^E5, empty$/ })).toBeVisible();
    /*
     * The embedded board is server-rendered and hydrated in place — unlike
     * the practice board at /games/<slug>/play, which is loaded on the client
     * only and so has no window in which its controls exist without their
     * handlers. Here that window is real, and a stone played in it is lost.
     */
    await ready(page, "embed-board");
    await page.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
  });

  test("is refused without a token", async ({ page }) => {
    await page.goto("/embed?size=9");
    await expect(page).toHaveURL(/\/join/);
  });

  test("is refused a token that has been tampered with", async ({ page }) => {
    const [body, signature] = embedToken().split(".");
    await page.goto(`/embed?token=${body}.${signature.slice(0, -3)}abc`);
    await expect(page).toHaveURL(/\/join/);
  });

  test("unlocks the board and nothing else", async ({ page, request }) => {
    const token = embedToken();

    // The rest of the site stays shut to it. Not the front page, and not a
    // game's own page: those say what the site and the games ARE, and are open
    // to anybody, token or none — see OPEN_EXACTLY and OPEN_PATTERNS in
    // proxy.ts. These are pages the gate really does hold shut.
    //
    // A board it was not given is the sharpest of them: a token that unlocked
    // ANY board would be the whole of what this test is named for going wrong.
    await page.goto(`/games/gomoku/play?token=${token}`);
    await expect(page).toHaveURL(/\/join/);

    await page.goto(`/players?token=${token}`);
    await expect(page).toHaveURL(/\/join/);

    await page.goto(`/history?token=${token}`);
    await expect(page).toHaveURL(/\/join/);

    expect((await request.get(`/api/games?token=${token}`)).status()).toBe(401);
    expect(
      (await request.post(`/api/games/live?token=${token}`, { data: { size: 9 } }))
        .status(),
    ).toBe(401);
  });

  test("cannot be minted by a visitor with no session", async ({ request }) => {
    // The gate turns this away before the route is ever reached.
    const response = await request.post("/api/embed-tokens", {
      data: { label: "not allowed" },
    });
    expect(response.status()).toBe(401);
  });

  test("cannot be minted by a player who is not the operator", async ({ baseURL }) => {
    const player = await playwrightRequest.newContext({
      baseURL,
      storageState: PLAYER_STATE,
    });

    const response = await player.post("/api/embed-tokens", {
      data: { label: "not allowed" },
    });
    // 404 rather than 403: the route does not admit it exists.
    expect(response.status()).toBe(404);
    await player.dispose();
  });

  test("talks to its host by postMessage", async ({ page }) => {
    const messages: string[] = [];
    await page.exposeFunction("recordEmbedMessage", (type: string) => {
      messages.push(type);
    });
    await page.addInitScript(() => {
      window.addEventListener("message", (event) => {
        const type = (event.data as { type?: string })?.type;
        if (typeof type === "string" && type.startsWith("gomoku:")) {
          void (window as unknown as {
            recordEmbedMessage: (t: string) => void;
          }).recordEmbedMessage(type);
        }
      });
    });

    await page.goto(`/embed?token=${embedToken()}&size=9`);
    await ready(page, "embed-board");
    await page.getByRole("button", { name: /^E5, empty$/ }).click();
    await expect.poll(() => messages).toContain("gomoku:move");
  });
});
