import { expect, test } from "@playwright/test";

/**
 * The gate, exercised with no session at all.
 *
 * This is the spec that would notice if the site quietly became public again,
 * which is exactly what happened once already on the production alias.
 */
test.describe("a visitor with no invite", () => {
  test("is sent to the door instead of a board", async ({ page }) => {
    /*
     * A BOARD, not the games. The catalogue and a game's own page are open
     * reading now — see "the pages that stay open" below — so the path that
     * proves the gate still stands has to be one of the playing ones.
     */
    await page.goto("/games/gomoku/play");
    await expect(page).toHaveURL(/\/join\?next=%2Fgames%2Fgomoku%2Fplay/);
    await expect(page.getByTestId("google-signin")).toBeVisible();
    await expect(page.getByTestId("invite-code")).toHaveCount(0);
    await page.getByTestId("show-invite-code").click();
    await expect(page.getByTestId("invite-code")).toBeVisible();
  });

  test("can read the front page, which shows no game", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/join/);
    await expect(page.getByTestId("front-door")).toBeVisible();
    await expect(page.getByTestId("to-play")).toHaveCount(0);
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

  test("keeps the path when sending someone to the door", async ({ page }) => {
    // A link like /games/connect-six/play means "a board of this game".
    // Dropping the path would land the visitor on a different game from the
    // one they clicked, or on no game at all. The game ITSELF is open now, so
    // the path that tests this has to be one the gate still shuts.
    await page.goto("/games/connect-six/play");
    await expect(page).toHaveURL(/\/join\?next=%2Fgames%2Fconnect-six%2Fplay/);
  });
});

test.describe("the pages that stay open", () => {
  // Everything here is about what somebody with no invite can reach.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the games, the rules and the learning are readable without an invite", async ({ page }) => {
    /*
     * READING IS OPEN, PLAYING IS GATED — John's rule, and what these are.
     * /rules and /rules/<game> used to be the open pair; a game is one address
     * with its facets underneath now, so the catalogue, a game, and what that
     * game IS are what a stranger may read.
     */
    for (const path of [
      "/games",
      "/games?view=list",
      "/games/gomoku",
      "/games/gomoku/family",
      "/games/gomoku/background",
      "/learn",
      "/about",
    ]) {
      await page.goto(path);
      await expect(page, `${path} should not send you to the door`).not.toHaveURL(
        /\/join/,
      );
    }
  });

  test("a variant's rules page is readable too", async ({ request }) => {
    expect((await request.get("/games/connect-six/rules")).status()).toBe(200);
  });

  test("and show nothing anybody wrote, which is what open means here", async ({ request }) => {
    /*
     * proxy.ts says what an open path may be, in as many words: documentation,
     * rendering "nothing a visitor wrote", holding "no data". A panel shipped
     * onto the rules page broke that the day it went out — real members' names,
     * their games, and links to their pages, on an address anybody could guess.
     *
     * It was the same concern John had raised from the other side. He asked for
     * his twelve-year-old's surname off the site's lists, and this handed it to
     * strangers in a link: the page read "Hanako M." and the href beside it
     * read /players/hanako-morris.
     *
     * Checked against the MARKUP rather than the rendered text, because that is
     * where the address lived. A signed-out reader must not be able to read a
     * member out of an open page by any route.
     */
    for (const path of [
      "/games/tic-tac-toe/rules",
      "/games/connect-six/rules",
      "/games",
      "/games?view=list",
      // The GAME'S OWN PAGE, which is the one that grew. It is open now and it
      // mounts the ladder and the played-games panel — both of which ask who is
      // reading and draw nothing for a stranger. That is the whole reason this
      // check had to follow the front door rather than stay on the rules page.
      "/games/gomoku",
      "/games/gomoku/family",
    ]) {
      const said = await (await request.get(path)).text();
      expect(said, `${path} links to a player's page without a session`).not.toMatch(/\/players\//);
      expect(said, `${path} names a member without a session`).not.toMatch(/data-testid=.player-name/);
    }
  });

  /**
   * The playing half, shut. A stranger may read about a game and may not open
   * a board, take a seat, or look at somebody's match.
   *
   * Signed out, and that is not decoration: written as a signed-in test this
   * would answer 200 quite correctly and prove nothing at all about the gate.
   */
  test("the playing half of a game still needs an invite", async ({ page }) => {
    for (const path of [
      "/games/gomoku/play",
      "/games/gomoku/new",
      "/games/gomoku/begin",
      "/games/gomoku/me",
      "/games/gomoku/match/nosuchgame",
      "/games/gomoku/history",
      "/games/gomoku/standings",
    ]) {
      await page.goto(path);
      await expect(page, `${path} should send you to the door`).toHaveURL(/\/join/);
    }
  });

  test("asking for a language cannot open a page the gate shuts", async ({ request }) => {
    /*
     * The language is remembered by the gate file, because a Server Component
     * can read a cookie and not set one — so something that runs on the way in
     * had to do it. AGENTS.md is exact about what that may be: an addition
     * wraps the `next()` a decision has already ARRIVED at, never the
     * deciding. This is that rule as a test rather than as a comment.
     *
     * Signed out on purpose. Run as the operator these all answer 200 quite
     * correctly, which is how a check like this passes while proving nothing.
     */
    for (const path of ["/players?lang=ja", "/history?lang=ja", "/me?lang=ja"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      const to = response.headers()["location"] ?? "";
      expect(`${response.status()} ${to}`, `${path} let a stranger past the door`).toContain("/join");
    }
  });

  test("the screenshots those pages load are readable", async ({ request }) => {
    // public/ is not exempted by the matcher, so these had to be named.
    expect((await request.get("/art/games/caro.jpg")).status()).toBe(200);
  });

  /*
   * /games and /games/<game> are DELIBERATELY open and are checked above. What
   * this guards is the edge of that decision: opening a game must not have
   * opened the site, and the facets of a game that are not "what the game is"
   * must still be shut. This list held /games and /games/gomoku until the
   * front door opened them, at which point it contradicted the test above —
   * two answers to one question, in the one spec where that is least
   * affordable.
   */
  test("but nothing else opened by accident", async ({ request }) => {
    for (const path of ["/history", "/players", "/admin", "/me", "/games/gomoku/play"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} should still be gated`).toBe(307);
    }
    for (const path of ["/api/games", "/api/players?q=a"]) {
      expect((await request.get(path)).status(), `${path}`).toBe(401);
    }
  });

  test("will not be talked into redirecting off-site", async ({ page }) => {
    /*
     * `next` is attacker-controlled, and startsWith("/") is not enough:
     * a browser reads //host and /\host as protocol-relative and leaves the
     * site, which is how a sign-in page becomes a phishing redirect wearing a
     * real domain.
     */
    for (const hostile of ["//example.com", "/\\example.com", "https://example.com"]) {
      await page.goto(`/join?next=${encodeURIComponent(hostile)}`);

      const next = await page.getByTestId("google-signin").getAttribute("data-next");
      expect(next, `${hostile} should not survive into the sign-in destination`).toMatch(/^\/(?![\/\\])/);
      expect(next ?? "").not.toContain("example.com");
    }
  });

  test("keeps a legitimate destination through the door", async ({ page }) => {
    await page.goto("/join?next=%2Fhistory");
    expect(await page.getByTestId("google-signin").getAttribute("data-next")).toBe("/history");
  });
});

test.describe("the account", () => {
  test("a stranger is offered a way in; nobody is signed in", async ({ page, request }) => {
    const who = await request.get("/api/session");
    expect(await who.json()).toMatchObject({ signedIn: false, admin: false, member: false });
    await page.goto("/");
    await expect(page.getByTestId("sign-in")).toBeVisible();
    await page.goto("/join");
    await expect(page.getByTestId("google-signin")).toBeVisible();
    await page.getByTestId("show-invite-code").click();
    await expect(page.getByTestId("invite-code")).toBeVisible();
  });
});

