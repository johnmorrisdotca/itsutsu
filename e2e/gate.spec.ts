import { expect, test } from "@playwright/test";

/**
 * The gate, exercised with no session at all.
 *
 * This is the spec that would notice if the site quietly became public again,
 * which is exactly what happened once already on the production alias.
 */
test.describe("a visitor with no invite", () => {
  test("is sent to the door instead of the board", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByTestId("invite-code")).toBeVisible();
  });

  test("is sent back to where they were heading, after joining", async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/join\?next=%2Fhistory/);
  });

  test("cannot read the game history", async ({ request }) => {
    const response = await request.get("/api/games");
    expect(response.status()).toBe(401);
  });

  test("cannot write a game record", async ({ request }) => {
    const response = await request.post("/api/games", {
      data: {
        size: 15, winLength: 5, variant: "freestyle", opener: "black",
        result: "draw", winner: null, moves: [],
      },
    });
    // This is the endpoint that was open on production.
    expect(response.status()).toBe(401);
  });

  test("cannot start a shared game", async ({ request }) => {
    expect((await request.post("/api/games/live", { data: { size: 9 } })).status())
      .toBe(401);
  });

  test("cannot read player names", async ({ request }) => {
    expect((await request.get("/api/players?q=a")).status()).toBe(401);
  });

  test("is refused a wrong invite code", async ({ request }) => {
    const response = await request.post("/api/session", {
      data: { kind: "invite", code: "hoshi-kuma-nami" },
    });
    // 401 or 429 — either way, not in.
    expect([401, 429]).toContain(response.status());
  });

  test("is refused the operator token with the wrong email", async ({ request }) => {
    const response = await request.post("/api/session", {
      data: { kind: "admin", email: "nobody@example.com", token: "local-operator-token" },
    });
    expect([401, 429]).toContain(response.status());
  });

  test("is throttled when guessing codes", async ({ request }) => {
    const codes = Array.from({ length: 8 }, (_, i) => `hoshi-kuma-${i}`);
    const statuses: number[] = [];
    for (const code of codes) {
      statuses.push(
        (await request.post("/api/session", { data: { kind: "invite", code } })).status(),
      );
    }
    expect(statuses, "guessing should hit a 429").toContain(429);
  });
});
