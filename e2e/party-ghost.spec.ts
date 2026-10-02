import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * SUPERGHOST, PASSED ROUND ONE DEVICE: the second party game of its own
 * (`PartyKind`), at home on the Party games shelf.
 *
 * Driven as a table would drive it: from the game's own page, by pressing
 * Play, choosing how many and which language, naming the players, then
 * tapping a letter on the keyboard and the end it goes on — or Challenge, or,
 * when challenged, typing a word and Enter. The game lives in this browser
 * only, so each case starts by clearing this browser's kept game; nothing
 * here writes to the database. The words are the site's own lists, fetched
 * by the table: CATS and WORD are in SCOWL's, かつこう (がっこう) and
 * さくらんぼ in JMdict's, and XQ is in no word at all.
 */

const KEPT = "itsutsu.superghost";

const game = (page: Page) => page.getByTestId("ghost-game");
const fragment = (page: Page) => page.getByTestId("ghost-fragment");
const player = (page: Page, seat: number) => page.locator(`[data-testid="ghost-player"][data-player="${seat}"]`);

/** Tap a letter's key, then the end it goes on — by the button, or by the dashed place at that end of the letters. */
async function add(page: Page, key: string, end: "before" | "after", by: "button" | "slot" = "button") {
  const was = (await fragment(page).getAttribute("data-fragment")) ?? "";
  const rounds = Number(await game(page).getAttribute("data-rounds"));
  await page.getByTestId(/^[a-z]$/.test(key) ? `word-key-${key}` : `kana-key-${key}`).click();
  await expect(page.getByTestId("ghost-turn-keys")).toHaveAttribute("data-pending", key);
  await page.getByTestId(by === "slot" ? `ghost-slot-${end}` : `ghost-add-${end}`).click();
  // Either the letter is on the table, or it finished a word and the round is over.
  const grown = end === "before" ? key + was : was + key;
  await expect
    .poll(async () => (await fragment(page).getAttribute("data-fragment")) === grown || Number(await game(page).getAttribute("data-rounds")) === rounds + 1)
    .toBe(true);
}

/** Type a word on the keyboard as the player challenged, and press Enter. */
async function type(page: Page, keys: readonly string[]) {
  for (const key of keys) await page.getByTestId(/^[a-z]$/.test(key) ? `word-key-${key}` : key.startsWith("kana-") ? key : `kana-key-${key}`).click();
}

async function challenge(page: Page, whom: string) {
  await expect(page.getByTestId("ghost-challenge")).toHaveText(`Challenge ${whom}`);
  await page.getByTestId("ghost-challenge").click();
  await expect(page.getByTestId("ghost-answer")).toBeVisible();
}

async function concede(page: Page) {
  const rounds = Number(await game(page).getAttribute("data-rounds"));
  await page.getByTestId("ghost-concede").click();
  await expect(game(page)).toHaveAttribute("data-rounds", String(rounds + 1));
}

/** A new table from the set-up: this many, in this language, with these names (the rest left blank). */
async function sitDown(page: Page, count: number, language: "english" | "japanese", names: readonly string[]) {
  await page.goto("/games/superghost");
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
  await page.goto("/games/superghost/pass-and-play");
  await ready(page, "ghost-set-up");
  await page.locator(`[data-testid="ghost-count"][data-count="${count}"]`).click();
  await page.locator(`[data-testid="ghost-language"][data-language="${language}"]`).click();
  for (const [at, name] of names.entries()) await page.getByTestId("ghost-name").nth(at).fill(name);
  await expect(page.getByTestId("ghost-preview").getByTestId("ghost-player")).toHaveCount(count);
  await page.getByTestId("ghost-start").click();
  // Ready once hydrated AND the word list is here: a table that cannot read the list offers no move.
  await ready(page, "ghost-game");
  await expect(game(page)).toHaveAttribute("data-language", language);
  await expect(game(page)).toHaveAttribute("data-players", String(count));
}

test.describe("Superghost, read by anybody", () => {
  // Reading is open: the game's page and its rules name games and nobody who plays them.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and its rules open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto("/games/superghost");
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Superghost/ })).toBeVisible();
    await expect(page.getByTestId("party-offered")).toContainText("2–8 players");
    await expect(page.getByTestId("party-offered")).toContainText("in English or Japanese");
    await expect(page.getByTestId("game-family")).toContainText("Word games");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/gomoji/family");
    const picture = page.locator('img[src="/art/games/superghost.jpg"]').first();
    await expect(picture).toBeVisible();
    expect(await picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/superghost\/rules$/);
    const rules = page.getByTestId("rules-page");
    await expect(rules).toContainText("either end");
    await expect(rules).toContainText("GHOST");
    await expect(rules).toContainText("おばけだぞ");

    // Playing is for members: a stranger pressing Play is asked for an invite.
    await page.goto("/games/superghost");
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Superghost, pass and play", () => {
  test("three play in English: letters at both ends, a word finished, a challenge both ways, kept, on My games, a player out, a winner", async ({ page }) => {
    await page.goto("/games/superghost");
    await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
    // From the front door, by the one big Play.
    await page.goto("/games/superghost");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Play →");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/games\/superghost\/pass-and-play$/);
    await sitDown(page, 3, "english", ["Ann", "Ben"]);
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ann");
    // Nothing to challenge before the first letter.
    await expect(page.getByTestId("ghost-challenge")).toBeDisabled();

    // Round 1: A, then C before it (tapping the dashed place), then T after, then S after: CATS is a word, and Ann finished it.
    await add(page, "a", "after");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ben");
    await add(page, "c", "before", "slot");
    await expect(fragment(page)).toHaveAttribute("data-fragment", "ca");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Player 3");
    await add(page, "t", "after");
    // CAT is three letters: safe.
    await expect(game(page)).toHaveAttribute("data-rounds", "0");
    await add(page, "s", "after");
    await expect(game(page)).toHaveAttribute("data-rounds", "1");
    await expect(page.getByTestId("ghost-round-over")).toHaveAttribute("data-how", "spelled");
    await expect(page.getByTestId("ghost-round-over")).toContainText("Ann finished CATS");
    await expect(player(page, 0)).toHaveAttribute("data-letters", "1");
    await expect(player(page, 0).locator('[data-taken="true"]')).toHaveText(["G"]);
    // The loser begins the next round, from nothing.
    await expect(fragment(page)).toHaveAttribute("data-fragment", "");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ann");

    // Round 2: R, then O before it; Player 3 challenges Ben, who names WORD — after two tries the game hands back.
    await add(page, "r", "after");
    await add(page, "o", "before");
    await challenge(page, "Ben");
    await expect(page.getByTestId("ghost-turn")).toHaveAttribute("data-answering", "true");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ben");
    await type(page, ["o", "r"]);
    await page.getByTestId("word-key-enter").click();
    await expect(page.getByTestId("ghost-problem")).toHaveAttribute("data-problem", "short");
    await type(page, ["z", "z"]);
    await page.getByTestId("word-key-enter").click();
    await expect(page.getByTestId("ghost-problem")).toHaveAttribute("data-problem", "unknown");
    await expect(page.getByTestId("ghost-problem")).toContainText("ORZZ is not in the site's word list");
    for (let at = 0; at < 4; at += 1) await page.getByTestId("word-key-back").click();
    await expect(page.getByTestId("ghost-typed")).toHaveText("");
    await type(page, ["w", "o", "r", "d"]);
    await page.getByTestId("word-key-enter").click();
    await expect(game(page)).toHaveAttribute("data-rounds", "2");
    await expect(page.getByTestId("ghost-round-over")).toHaveAttribute("data-how", "named");
    await expect(page.getByTestId("ghost-round-over")).toContainText("Ben named WORD, so Player 3 takes a letter");
    await expect(player(page, 2)).toHaveAttribute("data-letters", "1");

    // Round 3: Player 3 begins with X, Ann adds Q; Ben challenges Ann, who has no word, and gives the round up.
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Player 3");
    await add(page, "x", "after");
    await add(page, "q", "after");
    await challenge(page, "Ann");
    await concede(page);
    await expect(page.getByTestId("ghost-round-over")).toHaveAttribute("data-how", "caught");
    await expect(page.getByTestId("ghost-round-over")).toContainText("Ann could not name a word");
    await expect(player(page, 0)).toHaveAttribute("data-letters", "2");

    // Kept in this browser: a letter down, then a reload brings back the same table, letters and turn.
    await add(page, "e", "after");
    await page.reload();
    await ready(page, "ghost-game");
    await expect(fragment(page)).toHaveAttribute("data-fragment", "e");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ben");
    await expect(player(page, 0)).toHaveAttribute("data-letters", "2");
    await expect(player(page, 0).locator('[data-taken="true"]')).toHaveText(["G", "H"]);

    // And it waits on My games' Pass and play tab, with the way back.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="party-game"][data-variant="superghost"]');
    await expect(card).toContainText("English");
    await expect(card).toContainText("3 players");
    await expect(card).toContainText("Ben to play");
    await card.getByTestId("party-game-continue").click();
    await ready(page, "ghost-game");
    await expect(fragment(page)).toHaveAttribute("data-fragment", "e");

    // The front door says Continue while it is going.
    await page.goto("/games/superghost");
    await ready(page, "party-kind-offer");
    await expect(page.getByTestId("game-set-up")).toHaveText("Continue →");
    await page.getByTestId("game-set-up").click();
    await ready(page, "ghost-game");

    // On a phone the whole table fits the width of the glass, on a turn and when challenged.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("ghost-turn")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    // Ann is caught three more times: out, greyed and struck through, and the turn passes her by.
    await challenge(page, "Ann");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await concede(page);
    for (let round = 0; round < 2; round += 1) {
      await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ann");
      await add(page, "x", "after");
      await challenge(page, "Ann");
      await concede(page);
    }
    await expect(player(page, 0)).toHaveAttribute("data-letters", "5");
    await expect(player(page, 0)).toHaveAttribute("data-out", "true");
    await expect(player(page, 0).getByTestId("ghost-out")).toHaveText("Out");
    await expect(page.getByTestId("ghost-round-over")).toContainText("Ann is out.");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ben");

    // Ben is caught five times; Player 3 is the last one left, and wins.
    for (let round = 0; round < 5; round += 1) {
      await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ben");
      await add(page, "z", "before");
      await challenge(page, "Ben");
      await concede(page);
    }
    await expect(game(page)).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("ghost-winner")).toHaveAttribute("data-winners", "2");
    await expect(page.getByTestId("ghost-winner")).toContainText("Player 3 wins");
    await expect(page.getByTestId("ghost-turn-keys")).toHaveCount(0);
    // The same table again, from nothing, the next player round beginning — and waiting on My games as it goes.
    await page.getByTestId("ghost-again").click();
    await expect(game(page)).toHaveAttribute("data-state", "adding");
    await expect(game(page)).toHaveAttribute("data-rounds", "0");
    await expect(page.getByTestId("ghost-turn-name")).toHaveText("Ben");
    await page.goto("/play/pass-and-play");
    await expect(page.locator('[data-testid="party-game"][data-variant="superghost"]')).toContainText("Ben to play");
  });

  test("a short round in Japanese, in the Kumimoji's kana: がっこう finished, and さくらんぼ typed with its mark", async ({ page }) => {
    await sitDown(page, 2, "japanese", ["Aki", "Bo"]);
    // か, つ, こ: three kana, safe; う finishes かつこう, which is がっこう read in the tiles' kana, and Bo put it there.
    await add(page, "か", "after");
    await add(page, "つ", "after");
    await add(page, "こ", "after");
    await add(page, "う", "after");
    await expect(page.getByTestId("ghost-round-over")).toHaveAttribute("data-how", "spelled");
    await expect(page.getByTestId("ghost-round-over")).toContainText("かつこう");
    await expect(player(page, 1).locator('[data-taken="true"]')).toHaveText(["お"]);

    // Bo begins: く, then ら; Bo challenges Aki, who types さくらんほ and gives the ほ its mark: さくらんぼ.
    await add(page, "く", "after");
    await add(page, "ら", "after");
    await challenge(page, "Aki");
    await type(page, ["さ", "く", "ら", "ん", "ほ"]);
    await expect(page.getByTestId("kana-key-mark")).toHaveAttribute("data-makes", "ぼ");
    await page.getByTestId("kana-key-mark").click();
    await expect(page.getByTestId("ghost-typed")).toHaveText("さくらんぼ");
    await page.getByTestId("kana-key-enter").click();
    await expect(page.getByTestId("ghost-round-over")).toHaveAttribute("data-how", "named");
    await expect(player(page, 1).locator('[data-taken="true"]')).toHaveText(["お", "ば"]);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("kana-keyboard")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("Superghost on the Word games shelf", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is at home there and leads to its own page", async ({ page }) => {
    await page.goto("/games/gomoji/family");
    const card = page.getByTestId("family-game-superghost");
    await expect(card).toHaveAttribute("data-listed", "home");
    await card.getByRole("link", { name: /Superghost/ }).first().click();
    await expect(page).toHaveURL(/\/games\/superghost$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games/superghost");
    await expect(page.getByTestId("game-front-door")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
