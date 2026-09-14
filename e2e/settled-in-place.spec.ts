import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { playAt, ready } from "./support";

/**
 * A game that ends in front of you becomes the record IN PLACE — no new
 * document, for either player, however the game ended.
 *
 * `useLiveGame` hands the page back to the server the moment a game settles,
 * and its own comment promised that nothing flickers and nothing is lost. It
 * was true only for a board that had never seen a move land since it loaded.
 * The board keeps its address on the move number with `history.replaceState`,
 * and Next's router takes that native call as its own URL: from then on the
 * router's address named the `[move]` route while the page it was holding was
 * the `[id]` one. The hand-back asked for the one with the tree of the other,
 * and Next answered a mismatch it could not patch by loading the whole
 * document again. `game-ends-under-you.spec.ts` never saw it, because it
 * checks what the page SHOWS afterwards, and a reload shows the same thing.
 *
 * So each case here marks the window before the ending and asks afterwards
 * whether the mark survived. A reload clears it; an in-place hand-back keeps
 * it. Nothing here reloads, and every move is clicked by the player whose
 * move it is.
 *
 * IT BRINGS ITS OWN WORLD: members made here, games made here, names made
 * here, all taken away at the end.
 */
test.describe("a game that settles in front of you", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  type Seat = { context: BrowserContext; page: Page; email: string };

  async function twoPlayers(
    browser: Parameters<typeof memberContext>[0],
    baseURL: string,
    label: string,
  ): Promise<{ black: Seat; white: Seat; names: { black: string; white: string } }> {
    const stamp = `${Date.now().toString(36)}${label}`;
    const kuro = { email: `settle-black-${stamp}@example.test`, name: under(`Kuro${stamp} Settle`) };
    const shiro = { email: `settle-white-${stamp}@example.test`, name: under(`Shiro${stamp} Settle`) };
    const blackContext = await memberContext(browser, baseURL, kuro);
    const whiteContext = await memberContext(browser, baseURL, shiro);
    return {
      black: { context: blackContext, page: await blackContext.newPage(), email: kuro.email },
      white: { context: whiteContext, page: await whiteContext.newPage(), email: shiro.email },
      names: { black: kuro.name, white: shiro.name },
    };
  }

  async function goodbye(black: Seat, white: Seat) {
    await black.context.close();
    await white.context.close();
    await removeMember(black.email);
    await removeMember(white.email);
  }

  /**
   * Marks this document, and returns the check that it is still the same one.
   *
   * Two witnesses rather than one: a window property a new document cannot
   * inherit, and a count of documents the page has started since. The check
   * is only ever asked after the filed record has been waited for, so an
   * absence of reloads is a statement about a page that has finished
   * settling rather than about how quickly the question was asked.
   */
  async function markDocument(page: Page) {
    let documents = 0;
    page.on("domcontentloaded", () => {
      documents += 1;
    });
    await page.evaluate(() => {
      (window as unknown as { settledHere?: boolean }).settledHere = true;
    });
    return async (who: string) => {
      expect(documents, `${who}'s page loaded a new document when the game settled`).toBe(0);
      const kept = await page.evaluate(() => (window as unknown as { settledHere?: boolean }).settledHere === true);
      expect(kept, `${who}'s page is not the document that was open when the game settled`).toBe(true);
    };
  }

  /** The filed record, at the address naming the final position. */
  async function isTheRecord(page: Page, game: string, variant: string, moves: number) {
    await expect(page.getByRole("link", { name: /Play again as/ })).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(new RegExp(`/games/${variant}/match/${game}/${moves}$`));
  }

  async function seat(page: Page, variant: string, game: string, token: string) {
    await page.goto(`/games/${variant}/match/${game}/seat/${token}`);
    await ready(page, "shared-game");
    return page.getByTestId("shared-game");
  }

  test("two passes end a Go game, and both boards become the record without a reload", async ({ browser, baseURL }) => {
    const { black, white, names } = await twoPlayers(browser, baseURL!, "p");
    try {
      const started = await black.page.request.post("/api/games/live", {
        data: { variant: "go", size: 9, moveTimeMs: null, rated: false, blackName: names.black, whiteName: names.white },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      const blackBoard = await seat(black.page, "go", game.id, game.blackToken);
      const whiteBoard = await seat(white.page, "go", game.id, game.whiteToken);
      const blackKept = await markDocument(black.page);
      const whiteKept = await markDocument(white.page);

      // A stone from black lands on white's board; white's pass lands on black's.
      await playAt(black.page, 9, 4, 4);
      await expect(whiteBoard.getByTestId("live-moves")).toContainText("E5");
      const whitePass = whiteBoard.getByRole("button", { name: "Pass", exact: true });
      await expect(whitePass).toBeEnabled();
      await whitePass.click();
      await expect(blackBoard.getByTestId("live-moves")).toContainText("pass");

      // Black passes back: two in a row end it, under black's hand and in front of white.
      const blackPass = blackBoard.getByRole("button", { name: "Pass", exact: true });
      await expect(blackPass).toBeEnabled();
      await blackPass.click();

      await isTheRecord(black.page, game.id, "go", 3);
      await isTheRecord(white.page, game.id, "go", 3);
      await blackKept("black, who passed last");
      await whiteKept("white, who was waiting");
    } finally {
      await goodbye(black, white);
    }
  });

  test("the last pass, clicked on a board that has seen nothing land since it opened, still becomes the record", async ({ browser, baseURL }) => {
    /*
     * The other face of the same fault. This board's router never saw the
     * address move before the ending — so its hand-back was not reloaded, it
     * was LOST: the move that ended the game moved the address in the same
     * breath, the request came back, and the page stayed the live board for
     * good. `go-live-pass`'s white player, and one of CI's two screenshots.
     */
    const { black, white, names } = await twoPlayers(browser, baseURL!, "l");
    try {
      const started = await black.page.request.post("/api/games/live", {
        data: { variant: "go", size: 9, moveTimeMs: null, rated: false, blackName: names.black, whiteName: names.white },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      // The setting: four stones and black's pass, through the API, before anybody looks.
      const setting: ([string, number, number] | [string, "pass"])[] = [
        [game.blackToken, 2, 2],
        [game.whiteToken, 6, 6],
        [game.blackToken, 2, 6],
        [game.whiteToken, 6, 2],
        [game.blackToken, "pass"],
      ];
      for (const [token, row, col] of setting) {
        const body = row === "pass" ? { token, pass: true } : { token, row, col };
        const played = await black.page.request.post(`/api/games/${game.id}/moves`, { data: body });
        expect(played.status(), await played.text()).toBe(201);
      }

      await seat(black.page, "go", game.id, game.blackToken);
      const whiteBoard = await seat(white.page, "go", game.id, game.whiteToken);
      const blackKept = await markDocument(black.page);
      const whiteKept = await markDocument(white.page);

      const whitePass = whiteBoard.getByRole("button", { name: "Pass", exact: true });
      await expect(whitePass).toBeEnabled();
      await whitePass.click();

      await isTheRecord(white.page, game.id, "go", 6);
      await isTheRecord(black.page, game.id, "go", 6);
      await whiteKept("white, who passed last");
      await blackKept("black, who was waiting");
    } finally {
      await goodbye(black, white);
    }
  });

  test("a resignation clicked after moves have landed files the game in place on both boards", async ({ browser, baseURL }) => {
    const { black, white, names } = await twoPlayers(browser, baseURL!, "r");
    try {
      const started = await black.page.request.post("/api/games/live", {
        data: { variant: "freestyle", size: 9, winLength: 5, moveTimeMs: null, rated: false, blackName: names.black, whiteName: names.white },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      const blackBoard = await seat(black.page, "gomoku", game.id, game.blackToken);
      const whiteBoard = await seat(white.page, "gomoku", game.id, game.whiteToken);
      const blackKept = await markDocument(black.page);
      const whiteKept = await markDocument(white.page);

      await playAt(black.page, 9, 4, 4);
      await expect(whiteBoard.getByTestId("live-moves")).toContainText("E5");
      await expect(whiteBoard.getByTestId("turn-banner")).toContainText("Your move");
      await playAt(white.page, 9, 0, 0);
      await expect(blackBoard.getByTestId("live-moves")).toContainText("A9");

      // Black gives it up from the board, and white is looking at theirs.
      await blackBoard.getByTestId("resign").click();
      await black.page.getByTestId("resign-yes").click();

      await isTheRecord(black.page, game.id, "gomoku", 2);
      await isTheRecord(white.page, game.id, "gomoku", 2);
      await blackKept("black, who resigned");
      await whiteKept("white, who was waiting");
    } finally {
      await goodbye(black, white);
    }
  });

  test("a board opened on a numbered position with nothing landing since still settles in place, at that address", async ({ browser, baseURL }) => {
    const { black, white, names } = await twoPlayers(browser, baseURL!, "n");
    try {
      const started = await black.page.request.post("/api/games/live", {
        data: { variant: "freestyle", size: 9, winLength: 5, moveTimeMs: null, rated: false, blackName: names.black, whiteName: names.white },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      // The setting, not the subject: two stones through the API before anybody looks.
      for (const [token, row, col] of [[game.blackToken, 4, 4], [game.whiteToken, 0, 0]] as const) {
        const played = await black.page.request.post(`/api/games/${game.id}/moves`, { data: { token, row, col } });
        expect(played.status(), await played.text()).toBe(201);
      }

      // Black claims the seat, then opens the position by its number, as a shared link would.
      await seat(black.page, "gomoku", game.id, game.blackToken);
      await black.page.goto(`/games/gomoku/match/${game.id}/2`);
      await ready(black.page, "shared-game");
      const whiteBoard = await seat(white.page, "gomoku", game.id, game.whiteToken);
      const blackKept = await markDocument(black.page);
      const whiteKept = await markDocument(white.page);

      await whiteBoard.getByTestId("resign").click();
      await white.page.getByTestId("resign-yes").click();

      await isTheRecord(white.page, game.id, "gomoku", 2);
      await isTheRecord(black.page, game.id, "gomoku", 2);
      await whiteKept("white, who resigned");
      await blackKept("black, who was waiting");
    } finally {
      await goodbye(black, white);
    }
  });
});
