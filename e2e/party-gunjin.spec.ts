import { expect, test, type Page } from "@playwright/test";

import { GUNJIN_BOARDS, GUNJIN_SIZES } from "../src/lib/party/gunjin/gunjin.constants";
import { gunjinMoves, gunjinOver, playGunjin, seededRandom, startGunjin } from "../src/lib/party/gunjin/gunjin";
import { flagWithinReach } from "../src/lib/party/gunjin/gunjinFlag";
import { encodeGunjin } from "../src/lib/party/gunjin/gunjinCodec";
import type { GunjinGame } from "../src/lib/party/gunjin/gunjin.types";
import { ready } from "./support";

/**
 * GUNJIN 軍人, the hidden-rank games for two (`PartyKind` "gunjin"), at home in
 * Party games: four boards, each its own game, passed round one device with
 * the board covered between turns.
 *
 * Driven as two people at one phone drive it: set up from the game's own
 * page, each side arranging in secret behind the hand-over, then moving. What
 * these cases are about is what each player may SEE — the other side's ranks
 * are read from the page's own markup, where the package's drawing leaves a
 * `data-kind` only on a piece the viewer owns — and what the hand-over covers.
 * Nothing here writes to the database.
 *
 * It finishes a game by Resign, and by taking the flag where the rules for that are the
 * point (`flagWithinReach`).
 */
const KEPT = "itsutsu.gunjin";
const AT = "/games/gunjin";
const SHOGI = 81;
const CAPTURE_FLAG = 100;

async function clearKept(page: Page) {
  await page.goto(AT);
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

async function keepGame(page: Page, game: GunjinGame) {
  await clearKept(page);
  await page.evaluate(([key, text]) => window.localStorage.setItem(key, text), [KEPT, encodeGunjin(game)] as const);
}

/** Both sides arranged (the first arrangement each is offered) and the device handed back to Ann: ready for her first move. */
function arranged(size: number): GunjinGame {
  let game = startGunjin(size, ["Ann", "Ben"])!;
  for (let step = 0; step < 3; step += 1) game = playGunjin(game, gunjinMoves(game)[0]!)!;
  return game;
}

/** A game played at random from a fixed seed until a fight has just been fought, so the device waits to be passed on. */
function justAfterAFight(size: number, seed: number): GunjinGame {
  const random = seededRandom(seed);
  let game = arranged(size);
  game = playGunjin(game, { kind: "hand" })!;
  for (let at = 0; at < 3000; at += 1) {
    const offered = gunjinMoves(game);
    game = playGunjin(game, offered[Math.floor(random() * offered.length)]!)!;
    const last = game.match.log.at(-1);
    if (last !== undefined && last.capturedCount > 0 && !gunjinOver(game)) return game;
  }
  throw new Error("no fight in three thousand moves");
}

/** The package's own roles, any of which on the page of a player who may not see them is a leak. */
const RANK_WORDS = /General|Colonel|Major|Captain|Lieutenant|Aircraft|Tank|Engineer|Cavalry|Mine\b|Spy\b|Flag\b|Marshal|Miner|Scout|Sergeant|Bomb|Commander|Officer|Soldier|Private/;

const board = (page: Page, id = "gunjin-board") => page.getByTestId(id);
const drawing = (page: Page, id = "gunjin-board") => page.getByTestId(`${id}-drawing`);
const square = (page: Page, x: number, y: number, id = "gunjin-board") => board(page, id).locator(`[data-square="${x},${y}"]`);

/** Every square's name on the board, in reading order, as a screen reader hears it: the whole picture of who stands where. */
async function labels(page: Page, id: string): Promise<string[]> {
  return board(page, id).locator("[data-square]").evaluateAll((squares) => squares.map((one) => one.getAttribute("aria-label") ?? ""));
}

test.describe("Gunjin, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Gunjin/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Party games");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/gunjin\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("Gunjin Shogi");
    await expect(page.getByTestId("rules-page")).toContainText("Capture Flag");

    await page.goto("/games/party");
    await expect(page.locator("main")).toContainText("Gunjin");

    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Gunjin, pass and play", () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    test(`nothing on the set-up moves when another game is chosen, ${viewport.width} wide`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await clearKept(page);
      await page.goto(`${AT}/pass-and-play`);
      await ready(page, "gunjin-set-up");
      const measure = async () => ({
        page: await page.evaluate(() => document.documentElement.scrollHeight),
        preview: (await page.getByTestId("gunjin-preview").boundingBox())!.height,
        form: (await page.getByTestId("gunjin-set-up").boundingBox())!.height,
      });
      const first = await measure();
      for (const size of GUNJIN_SIZES) {
        await page.locator(`[data-testid="gunjin-board-choice"][data-size="${size}"]`).click();
        await expect(page.getByTestId("gunjin-preview-board")).toHaveAttribute("data-width", String(GUNJIN_BOARDS[size]!.width));
        expect(await measure(), `choosing ${GUNJIN_BOARDS[size]!.name} moved the set-up`).toEqual(first);
      }
    });
  }

  test("each side arranges in secret behind the hand-over, and neither sees the other's ranks", async ({ page }) => {
    await clearKept(page);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "gunjin-set-up");
    // The four games are four tiles, and the one the game is named for is chosen.
    await expect(page.getByTestId("gunjin-board-choice")).toHaveCount(GUNJIN_SIZES.length);
    await expect(page.locator(`[data-testid="gunjin-board-choice"][data-size="${SHOGI}"]`)).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("gunjin-name").nth(0).fill("Ann");
    await page.getByTestId("gunjin-name").nth(1).fill("Ben");
    await page.getByTestId("gunjin-start").click();
    await ready(page, "gunjin-game");

    // The cover first: who the phone goes to, and no board at all.
    const game = page.getByTestId("gunjin-game");
    await expect(game).toHaveAttribute("data-covered", "true");
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ann");
    await expect(board(page)).toHaveCount(0);
    await expect(board(page, "gunjin-arrange-board")).toHaveCount(0);
    await page.getByTestId("gunjin-pass-ready").click();

    // Ann arranges: thirty-one pieces of her own, all hers, none of Ben's.
    await expect(page.getByTestId("gunjin-arrange")).toHaveAttribute("data-seat", "0");
    const own = drawing(page, "gunjin-arrange-board");
    await expect(own.locator('[data-owner="0"][data-kind]')).toHaveCount(31);
    await expect(own.locator('[data-owner="1"]')).toHaveCount(0);

    // Shuffle gives another layout.
    const first = (await labels(page, "gunjin-arrange-board")).join("|");
    await page.getByTestId("gunjin-shuffle").click();
    await expect.poll(async () => (await labels(page, "gunjin-arrange-board")).join("|")).not.toBe(first);

    // Tapping a piece and then another swaps them; tapping a piece and then an empty square of her side moves it.
    // Three of her pieces to work with (five of her thirty-six squares are empty, so no fixed square is sure to hold one).
    const held = await board(page, "gunjin-arrange-board")
      .locator("[data-square]")
      .evaluateAll((all) => all.filter((one) => !one.getAttribute("aria-label")!.endsWith(", empty") && Number(one.getAttribute("data-square")!.split(",")[1]) >= 5).map((one) => one.getAttribute("data-square")!.split(",").map(Number) as [number, number]));
    const [[ax, ay], [bx, by], [cx, cy]] = held as [[number, number], [number, number], [number, number]];
    const [a, b] = [(await square(page, ax, ay, "gunjin-arrange-board").getAttribute("aria-label"))!, (await square(page, bx, by, "gunjin-arrange-board").getAttribute("aria-label"))!];
    const kinds = (name: string) => name.split(", ")[1]!;
    await square(page, ax, ay, "gunjin-arrange-board").click();
    await expect(page.getByTestId("gunjin-arrange-board")).toHaveAttribute("data-selected", `${ax},${ay}`);
    await square(page, bx, by, "gunjin-arrange-board").click();
    await expect(square(page, ax, ay, "gunjin-arrange-board")).toHaveAttribute("aria-label", new RegExp(`, ${kinds(b)}$`));
    await expect(square(page, bx, by, "gunjin-arrange-board")).toHaveAttribute("aria-label", new RegExp(`, ${kinds(a)}$`));
    // An empty square on her own four rows (the board's other rows are empty too).
    const empty = await board(page, "gunjin-arrange-board")
      .locator('[data-square][aria-label$=", empty"]')
      .evaluateAll((all) => all.map((one) => one.getAttribute("data-square")!).find((at) => Number(at.split(",")[1]) >= 5)!);
    const movedKind = kinds((await square(page, cx, cy, "gunjin-arrange-board").getAttribute("aria-label"))!);
    await square(page, cx, cy, "gunjin-arrange-board").click();
    await board(page, "gunjin-arrange-board").locator(`[data-square="${empty}"]`).click();
    await expect(board(page, "gunjin-arrange-board").locator(`[data-square="${empty}"]`)).toHaveAttribute("aria-label", new RegExp(`, ${movedKind}$`));
    await expect(square(page, cx, cy, "gunjin-arrange-board")).toHaveAttribute("aria-label", /, empty$/);

    // A mine on D or F of the front row is refused with the board's own rule said, and the hand-over does not come.
    const mines = await board(page, "gunjin-arrange-board").locator('[data-square][aria-label$=", Mine"]').evaluateAll((all) => all.map((one) => one.getAttribute("data-square")!));
    await board(page, "gunjin-arrange-board").locator(`[data-square="${mines[0]}"]`).click();
    await square(page, 3, 5, "gunjin-arrange-board").click();
    if (mines[0] !== "3,5") {
      await page.getByTestId("gunjin-finish").click();
      await expect(page.getByTestId("gunjin-arrange-refused")).toContainText("D or F of your front row");
      await expect(game).toHaveAttribute("data-covered", "false");
      await page.getByTestId("gunjin-shuffle").click();
      await expect(page.getByTestId("gunjin-arrange-refused")).toHaveCount(0);
    }

    // Finished: the cover for Ben, with nothing of Ann's on the page.
    await page.getByTestId("gunjin-finish").click();
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ben");
    await expect(game).not.toContainText(RANK_WORDS);
    await expect(game.locator("[data-kind]")).toHaveCount(0);
    await page.getByTestId("gunjin-pass-ready").click();

    // Ben arranges his own thirty-one, and sees none of Ann's.
    await expect(page.getByTestId("gunjin-arrange")).toHaveAttribute("data-seat", "1");
    await expect(drawing(page, "gunjin-arrange-board").locator('[data-owner="1"][data-kind]')).toHaveCount(31);
    await expect(drawing(page, "gunjin-arrange-board").locator('[data-owner="0"]')).toHaveCount(0);
    await page.getByTestId("gunjin-finish").click();

    // And the cover back to Ann, who moves first.
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ann");
    await expect(page.getByTestId("gunjin-pass-news")).toContainText("Red moves first");
    await expect(game.locator("[data-kind]")).toHaveCount(0);
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(page.getByTestId("gunjin-moving")).toHaveAttribute("data-seat", "0");

    // Ann sees her thirty-one ranks and Ben's thirty-one as backs: nothing of Ben's in the markup, the labels or the ids.
    const ann = drawing(page);
    await expect(ann.locator('[data-owner="0"][data-kind]')).toHaveCount(31);
    await expect(ann.locator('[data-owner="1"][data-hidden="true"]')).toHaveCount(31);
    await expect(ann.locator('[data-owner="1"][data-kind]')).toHaveCount(0);
    await expect(ann.locator('[data-owner="1"][data-piece]')).toHaveCount(0);
    const seen = await labels(page, "gunjin-board");
    expect(seen.filter((name) => name.endsWith(", Opponent piece"))).toHaveLength(31);
    expect(seen.filter((name) => RANK_WORDS.test(name.split(", ")[1]!))).toHaveLength(31);

    // A move: the first of her pieces on the front row that can go anywhere, to its first lit square.
    let moved = false;
    for (let x = 0; x < 9 && !moved; x += 1) {
      // Not an aircraft: it may attack any square, and its first square could hold the flag, which ends the game.
      if (((await square(page, x, 5).getAttribute("aria-label")) ?? "").endsWith(", Aircraft")) continue;
      await square(page, x, 5).click();
      const lit = (await board(page).getAttribute("data-targets")) ?? "";
      if (lit !== "") {
        const [tx, ty] = lit.split(" ")[0]!.split(",").map(Number);
        await square(page, tx!, ty!).click();
        moved = true;
      }
    }
    expect(moved).toBe(true);

    // The cover again, saying only what both may know, and then Ben's own view of the same board.
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ben");
    await expect(page.getByTestId("gunjin-pass-news")).toContainText("Ann");
    await expect(game.locator("[data-kind]")).toHaveCount(0);
    await expect(board(page)).toHaveCount(0);
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(page.getByTestId("gunjin-moving")).toHaveAttribute("data-seat", "1");
    const ben = drawing(page);
    await expect(ben.locator('[data-owner="1"][data-kind]')).toHaveCount(31);
    await expect(ben.locator('[data-owner="0"][data-kind]')).toHaveCount(0);
    await expect(board(page).locator('[data-last="true"]')).toHaveCount(2);
    await expect(page.getByTestId("gunjin-news")).toContainText("Ann");

    // A reload covers the board again, whatever it was showing, and the cover opens on the same game.
    const moves = await game.getAttribute("data-moves");
    await page.reload();
    await ready(page, "gunjin-game");
    await expect(game).toHaveAttribute("data-covered", "true");
    await expect(board(page)).toHaveCount(0);
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(game).toHaveAttribute("data-moves", moves!);
    await expect(page.getByTestId("gunjin-moving")).toHaveAttribute("data-seat", "1");

    // Kept, and waiting on My games without a word of the board.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="gunjin"]');
    await expect(card).toContainText("Ben to play");
    await expect(card).not.toContainText(RANK_WORDS);
    await card.getByTestId("party-game-continue").click();
    await expect(page).toHaveURL(/\/games\/gunjin\/pass-and-play$/);
    await ready(page, "gunjin-game");
    await page.getByTestId("gunjin-pass-ready").click();

    // Resign: Ben, who is to move, gives up, and Ann wins; every piece is shown at the end.
    await page.getByTestId("gunjin-resign").click();
    await page.getByRole("button", { name: "Resign" }).last().click();
    await expect(game).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("win-cover")).toContainText("Ann");
    await expect(page.getByTestId("game-resigned")).toContainText("Ben");
    await page.getByTestId("win-cover-see-board").click();
    const end = drawing(page);
    await expect(end.locator("[data-hidden='true']")).toHaveCount(0);
    await expect(end.locator("[data-kind]")).toHaveCount(62);
    // Play again sets the same table out afresh: the same names, to arrange.
    await page.getByTestId("gunjin-again").click();
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ann");
  });

  test("a fight tells the table what was taken, and ranks only on Capture Flag", async ({ page }) => {
    for (const [size, seed, ranked] of [[SHOGI, 3, false], [CAPTURE_FLAG, 4, true]] as const) {
      const game = justAfterAFight(size, seed);
      await keepGame(page, game);
      await page.goto(`${AT}/pass-and-play`);
      await ready(page, "gunjin-game");
      const news = page.getByTestId("gunjin-pass-news");
      await expect(news).toContainText(/took|taken|both/);
      const said = (await news.textContent())!;
      if (ranked) await expect(news, "Capture Flag shows both ranks of a fight").toContainText(RANK_WORDS);
      else await expect(news, "no other board shows a rank").not.toContainText(RANK_WORDS);
      await page.getByTestId("gunjin-pass-ready").click();
      // Whoever the device went to sees their own ranks, the other side hidden, whatever just happened.
      const seat = game.match.currentPlayer;
      const mine = game.match.pieces.filter((piece) => piece.owner === seat).length;
      const theirs = game.match.pieces.filter((piece) => piece.owner !== seat).length;
      await expect(drawing(page).locator(`[data-owner="${seat}"][data-kind]`)).toHaveCount(mine);
      await expect(drawing(page).locator(`[data-owner="${1 - seat}"][data-hidden="true"]`)).toHaveCount(theirs);
      await expect(drawing(page).locator(`[data-owner="${1 - seat}"][data-kind]`)).toHaveCount(0);
      // The same sentence is under the board, for the player who was not looking.
      await expect(page.getByTestId("gunjin-news")).toHaveText(said);
    }
  });

  test("a draw is offered on the cover, answered by the other side, and agreed or declined", async ({ page }) => {
    await keepGame(page, arranged(SHOGI));
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "gunjin-game");
    const game = page.getByTestId("gunjin-game");
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(page.getByTestId("gunjin-moving")).toHaveAttribute("data-seat", "0");
    // No offer to answer on one's own turn, and the press asks first.
    await expect(page.getByTestId("gunjin-draw-answer")).toHaveCount(0);
    await page.getByTestId("gunjin-draw-offer").click();
    await expect(page.getByTestId("gunjin-draw-offer-confirm")).toContainText("Offer Ben a draw");
    await page.getByTestId("gunjin-draw-offer-no").click();
    await expect(game).toHaveAttribute("data-state", "playing");
    await page.getByTestId("gunjin-draw-offer").click();
    await page.getByTestId("gunjin-draw-offer-yes").click();

    // The device goes to Ben on the cover, which says only that the offer was made, and shows nothing of the board.
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ben");
    await expect(page.getByTestId("gunjin-pass-news")).toContainText("Ann has offered a draw");
    await expect(game.locator("[data-kind]")).toHaveCount(0);
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(page.getByTestId("gunjin-draw-answer")).toContainText("Ann offers a draw");
    // He may not offer one back before he has answered; declining leaves the game his to play.
    await expect(page.getByTestId("gunjin-draw-offer")).toHaveCount(0);
    await page.getByTestId("gunjin-draw-decline").click();
    await expect(page.getByTestId("gunjin-draw-answer")).toHaveCount(0);
    await expect(game).toHaveAttribute("data-state", "playing");
    await expect(game).toHaveAttribute("data-to-play", "1");

    // Ben offers one back, and Ann agrees: it ends level, with nobody the winner, and says why.
    await page.getByTestId("gunjin-draw-offer").click();
    await page.getByTestId("gunjin-draw-offer-yes").click();
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ann");
    await expect(page.getByTestId("gunjin-pass-news")).toContainText("Ben has offered a draw");
    await page.getByTestId("gunjin-pass-ready").click();
    await page.getByTestId("gunjin-draw-accept").click();
    await expect(game).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("gunjin-status")).toContainText("Drawn: a draw was agreed");
    await expect(page.getByTestId("win-cover")).toContainText(/draw/i);
    await page.getByTestId("win-cover-see-board").click();
    await expect(drawing(page).locator("[data-hidden='true']")).toHaveCount(0);
    // Kept as it ended: a reload shows the same ending.
    await page.reload();
    await ready(page, "gunjin-game");
    await expect(game).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("gunjin-status")).toContainText("Drawn: a draw was agreed");
  });

  test("a move instead of an answer declines a draw", async ({ page }) => {
    const offered = playGunjin(playGunjin(arranged(SHOGI), { kind: "hand" })!, { kind: "offer-draw" })!;
    await keepGame(page, offered);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "gunjin-game");
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(page.getByTestId("gunjin-draw-answer")).toBeVisible();
    let moved = false;
    for (let x = 0; x < 9 && !moved; x += 1) {
      if (((await square(page, x, 3).getAttribute("aria-label")) ?? "").endsWith(", Aircraft")) continue;
      await square(page, x, 3).click();
      const lit = (await board(page).getAttribute("data-targets")) ?? "";
      if (lit !== "") {
        const [tx, ty] = lit.split(" ")[0]!.split(",").map(Number);
        await square(page, tx!, ty!).click();
        moved = true;
      }
    }
    expect(moved).toBe(true);
    await expect(page.getByTestId("gunjin-pass-to")).toContainText("Pass to Ann");
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(page.getByTestId("gunjin-draw-answer")).toHaveCount(0);
    await expect(page.getByTestId("gunjin-game")).toHaveAttribute("data-state", "playing");
  });

  test("Capture Flag shades its lakes and no piece is offered a move onto one", async ({ page }) => {
    await keepGame(page, arranged(CAPTURE_FLAG));
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "gunjin-game");
    await page.getByTestId("gunjin-pass-ready").click();
    await expect(board(page).locator('[data-lake="true"]')).toHaveCount(8);
    await expect(square(page, 2, 4)).toHaveAttribute("aria-label", /lake/);
    // And the package draws them: two pieces of water, a 2 x 2 each, in the picture under the squares (the other boards have none).
    await expect(drawing(page).locator('g[data-lake="true"]')).toHaveCount(2);
    await expect(board(page).locator('[data-lake="true"]').first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test("taking the flag in Gunjin Shogi ends the game with the capturer the winner", async ({ page }) => {
    const { game, from, flag } = flagWithinReach();
    await keepGame(page, game);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "gunjin-game");
    await page.getByTestId("gunjin-pass-ready").click();
    await square(page, from.x, from.y).click();
    await square(page, flag.x, flag.y).click();
    await expect(page.getByTestId("gunjin-game")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("gunjin-status")).toContainText("Ann wins: the flag was taken");
    await expect(page.getByTestId("win-cover")).toContainText("Ann");
    await page.getByTestId("win-cover-see-board").click();
    await expect(drawing(page).locator("[data-hidden='true']")).toHaveCount(0);
  });

  test("New game asks before it ends a game in progress", async ({ page }) => {
    await keepGame(page, arranged(56));
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "gunjin-game");
    await page.getByTestId("gunjin-pass-ready").click();
    await page.getByTestId("gunjin-new").click();
    await page.getByRole("button", { name: /^(Yes|New game|Start a new game)/ }).last().click();
    await ready(page, "gunjin-set-up");
  });
});
