import { expect, test } from "@playwright/test";

import { memberContext } from "./members";

/**
 * A name is how the site addresses a person, and on this site it is also
 * what a rating is filed under. So a rename may not reach a name that is
 * somebody else's — including somebody who is remembered rather than here.
 */
test.describe("a name is not free for the taking", () => {
  test("a member may not rename themselves to a remembered player, or to a name with a record", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `rename-${stamp}@example.test`, name: `Rename ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);

    // Chibi is remembered, not here to object; the name is kept for them.
    const reserved = await context.request.patch("/api/me", { data: { name: "Chibi" } });
    expect(reserved.status()).toBe(409);

    // A name that has finished a rated game has a record behind it.
    const played = `Played ${stamp}`;
    const started = await request.post("/api/games/live", {
      data: { blackName: played, whiteName: `Other ${stamp}`, size: 9 },
    });
    const game = (await started.json()) as { id: string; whiteToken: string };
    expect((await request.post(`/api/games/${game.id}/resign`, { data: { token: game.whiteToken } })).status()).toBe(200);

    const taken = await context.request.patch("/api/me", { data: { name: played } });
    expect(taken.status()).toBe(409);

    // A name nobody has is still theirs to take.
    const free = await context.request.patch("/api/me", { data: { name: `Rename ${stamp} again` } });
    expect(free.status()).toBe(200);

    await context.close();
  });
});
