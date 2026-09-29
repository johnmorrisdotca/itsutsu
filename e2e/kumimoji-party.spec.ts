import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { judgeTiles } from "../src/lib/puzzles/kumimoji/computerPlay";
import { afterComputerTurn } from "../src/lib/puzzles/kumimoji/computerTurn";
import { generateKumimoji } from "../src/lib/puzzles/kumimoji/generate";
import { lettersOf, sameLetters } from "../src/lib/puzzles/kumimoji/grid";
import { partyTilesLeft, startParty } from "../src/lib/puzzles/kumimoji/party";
import type { PartyGame } from "../src/lib/puzzles/kumimoji/party.types";
import { endTurn, handCanSpell } from "../src/lib/puzzles/kumimoji/partyTurns";
import { KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { tileWords } from "../src/lib/puzzles/kumimoji/tileWords";
// This process has no browser: the lists are read from their modules (`tileWordsModule.ts`).
import { loadTileWordsFromModule as loadTileWords } from "../src/lib/puzzles/kumimoji/tileWordsModule";
import { freshPuzzleSeed, ready } from "./support";

/**
 * KUMIMOJI PASS AND PLAY: two to eight players round one device, a cover
 * between turns, and the game kept in this browser. Every case drives what a
 * player does — the Players chips, the names, "I'm …", laying tiles, Done,
 * Draw, Resign — on bags this spec reads from the same generator the page
 * uses, from the seed in the page's own address, so it knows each hand without
 * trusting anything a previous run left behind. Each case opens in a browser
 * context of its own, so no kept game from another case is in its storage.
 *
 * Nothing in the game is secret (John, 2026-09-28: "there are no secrets
 * because they are face up"): the pass screen marks that the device has
 * changed hands, over tables and hands anybody may look at, read-only.
 */
const KIND = "kumimoji";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const TINY = KUMIMOJI_HANDS.tiny;
const QUICK = KUMIMOJI_HANDS.quick;

test.beforeAll(async () => {
  await loadTileWords();
});

const isWord = (word: string) => tileWords().allowed.has(word);

/** A word of two to four letters the tiles make, each used once, wilds left out; or null. */
function wordIn(tiles: string): string | null {
  const have = lettersOf([...tiles].filter((tile) => tile !== "*"));
  for (const length of [4, 3, 2]) {
    const found = tileWords().byLength.get(length)?.find((word) => [...lettersOf(word)].every(([letter, count]) => (have.get(letter) ?? 0) >= count));
    if (found !== undefined) return found;
  }
  return null;
}

/** A three-letter word made of exactly these three tiles, or null. */
const anagram = (tiles: string) => tileWords().byLength.get(3)!.find((word) => sameLetters(lettersOf(word), lettersOf(tiles))) ?? null;

/** Where a tile hangs off a letter of a word laid across row 0 to make a two-letter word down: the square, or null. */
const hangs = (on: string, letter: string, col: number) => (isWord(on + letter) ? `1,${col}` : isWord(letter + on) ? `-1,${col}` : null);

/** Two players, hands of three, from a double-set Short bag of ten: the smallest bag pass and play can deal. */
const smallBag = (seed: number) => generateKumimoji(TINY, "medium", seed, { gameLength: "short", doubleSet: true }).givens;
const smallAddress = (seed: number) => `${AT}/play?size=${TINY}&level=medium&seed=${seed}&double=1&players=2`;

/**
 * A small bag in which player one can go out in one turn: their hand is a
 * three-letter word, and the tiles they draw with the two Draws (the bag's
 * seventh and ninth; the eighth and tenth go to player two) each hang off one
 * end of it.
 */
function goingOutGame(from: number) {
  for (let seed = from; ; seed += 1) {
    const bag = smallBag(seed);
    const across = anagram(bag.slice(0, TINY));
    if (across === null) continue;
    const first = hangs(across[0]!, bag[6]!, 0);
    const second = hangs(across[2]!, bag[8]!, 2);
    if (first !== null && second !== null) return { seed, across, drawn: [{ letter: bag[6]!, square: first }, { letter: bag[8]!, square: second }] };
  }
}

/** A small bag whose player one holds a three-letter word, and whose player two, after one Draw, holds a two-letter one. */
function standingGame(from: number) {
  for (let seed = from; ; seed += 1) {
    const bag = smallBag(seed);
    const across = anagram(bag.slice(0, TINY));
    const second = wordIn(bag.slice(TINY, 2 * TINY) + bag[7]!);
    if (across !== null && second !== null && second.length === 2) return { seed, across, second };
  }
}

/** A small bag whose player one's hand spells no word at all. */
function noWordGame(from: number) {
  for (let seed = from; ; seed += 1) {
    if (wordIn(smallBag(seed).slice(0, TINY)) === null) return { seed };
  }
}

/** Three players with hands of three from a Medium bag, player one's a three-letter word. */
function drawGame(from: number) {
  for (let seed = from; ; seed += 1) {
    const bag = generateKumimoji(TINY, "medium", seed, { gameLength: "medium" }).givens;
    const across = anagram(bag.slice(0, TINY));
    if (across !== null) return { seed, bag, across };
  }
}

/** Three players with hands of three from a Medium bag: player one's a three-letter word, and the other two each spelling something, so Done needs no trade. */
function leaveGame(from: number) {
  for (let seed = from; ; seed += 1) {
    const bag = generateKumimoji(TINY, "medium", seed, { gameLength: "medium" }).givens;
    const across = anagram(bag.slice(0, TINY));
    if (across !== null && wordIn(bag.slice(TINY, 2 * TINY)) !== null && wordIn(bag.slice(2 * TINY, 3 * TINY)) !== null) return { seed, bag, across };
  }
}

/** A small bag whose two players each hold a hand that spells something. */
function joinGame(from: number) {
  for (let seed = from; ; seed += 1) {
    const bag = smallBag(seed);
    if (wordIn(bag.slice(0, TINY)) !== null && wordIn(bag.slice(TINY, 2 * TINY)) !== null) return { seed, bag };
  }
}

const COMPUTER = { name: "", computer: true };

/**
 * A Quick game of a computer, seated first, and Aiko: the computer's first
 * turn and its second (after Aiko presses Done on a hand that spells a word),
 * read from the same planner the page plays, so the spec knows what the page
 * must show without trusting it.
 */
function computerGame(from: number) {
  const words = tileWords();
  const spells = (hand: readonly string[]) => handCanSpell(hand, words);
  for (let seed = from; ; seed += 1) {
    const bag = generateKumimoji(QUICK, "medium", seed).givens;
    const settings = { size: QUICK, level: "medium" as const, seed, gameLength: "short" as const, language: "english" as const, doubleSet: false, diagonals: false, hints: false };
    const first = afterComputerTurn(startParty(settings, bag, [COMPUTER, "Aiko"]), words);
    if (first.ending !== null || first.turn !== 1 || first.players[0]!.tiles.size === 0 || !spells(first.players[1]!.hand)) continue;
    const handed = endTurn(first, judgeTiles(first.players[1]!.tiles, words), spells);
    const second = afterComputerTurn(handed, words);
    if (second.ending === null && second.turn === 1) return { seed, first, second };
  }
}

/** What the pass screen's table must show of the computer: its tiles laid and in hand. */
async function computerTable(page: Page, game: PartyGame) {
  const viewer = page.getByTestId("kumimoji-party-viewer");
  await expect(viewer.getByTestId("kumimoji-party-board")).toHaveAttribute("data-player", "0");
  await expect(viewer.getByTestId("kumimoji-party-computer-mark")).toBeVisible();
  await expect(viewer.getByTestId("kumimoji-tile")).toHaveCount(game.players[0]!.tiles.size);
  await expect(viewer.getByTestId("kumimoji-party-hand-tile")).toHaveCount(game.players[0]!.hand.length);
}

/** Seat a computer at this place on the names screen, then name the rest and Begin. */
async function beginWithComputer(page: Page, computerAt: number, names: string[]) {
  await ready(page, "kumimoji-party");
  await page.locator(`[data-testid="kumimoji-party-seat-computer"][data-at="${computerAt}"]`).click();
  await expect(page.locator(`[data-testid="kumimoji-party-seat-row"][data-at="${computerAt}"]`)).toContainText("Computer 1");
  for (const [at, name] of names.entries()) if (at !== computerAt) await page.locator(`[data-testid="kumimoji-party-name"][data-at="${at}"]`).fill(name);
  await page.getByTestId("kumimoji-party-begin").click();
}

/** Tap a tile of this letter in the hand, then a square on the table. */
async function lay(page: Page, letter: string, square: string) {
  await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${letter}"]`).first().click();
  await page.locator(`[data-testid="kumimoji-square"][data-square="${square}"]`).click();
  await expect(page.locator(`[data-testid="kumimoji-tile"][data-square="${square}"]`)).toHaveAttribute("data-letter", letter);
}

async function layAcross(page: Page, word: string) {
  for (const [at, letter] of [...word].entries()) await lay(page, letter, `0,${at}`);
}

/** The letters in the hand now, in order. */
const handLetters = (page: Page) => page.getByTestId("kumimoji-hand-tile").evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute("data-letter")!).join(""));

/** Names typed on the names screen, one a seat or empty for its number, then Begin. */
async function begin(page: Page, names: string[]) {
  await ready(page, "kumimoji-party");
  await expect(page.getByTestId("kumimoji-party-names")).toBeVisible();
  for (const [at, name] of names.entries()) await page.locator(`[data-testid="kumimoji-party-name"][data-at="${at}"]`).fill(name);
  await page.getByTestId("kumimoji-party-begin").click();
}

/**
 * The pass screen is up, naming this player, and nobody's desk is: the
 * tables behind it are face up, but no tile can be moved until the player
 * says they are there.
 */
async function passFor(page: Page, name: string) {
  await expect(page.getByTestId("kumimoji-party-pass-screen")).toBeVisible();
  await expect(page.getByTestId("kumimoji-party-pass")).toHaveText(`Pass to ${name}`);
  await expect(page.getByTestId("kumimoji-tray")).toHaveCount(0);
  await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(0);
}

/** Every tile of a hand shown to be looked at is pressed by nobody: none of them is a button. */
async function readOnlyHands(page: Page) {
  const tags = await page.getByTestId("kumimoji-party-hand-tile").evaluateAll((tiles) => tiles.map((tile) => tile.tagName));
  expect(tags.length).toBeGreaterThan(0);
  expect(tags.every((tag) => tag !== "BUTTON")).toBe(true);
}

async function uncover(page: Page, name: string) {
  await page.getByTestId("kumimoji-party-uncover").click();
  await expect(page.getByTestId("kumimoji-party-whose")).toContainText(`${name}’s turn`);
  await expect(page.getByTestId("kumimoji-tray")).toBeVisible();
}

test.describe("Kumimoji pass and play", () => {
  test("six or more players choose the Double set's 288 tiles and mark it recommended, and it can still be turned off", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("kumimoji-players-6").click();
    await expect(page.getByTestId("kumimoji-double-on")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("kumimoji-double-on")).toHaveAttribute("data-recommended", "true");
    await expect(page.getByTestId("kumimoji-length-full")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("kumimoji-double-on")).toContainText("288");
    await expect(page.getByTestId("kumimoji-players-blurb")).toContainText("Double, 288 tiles, is recommended");
    // Not forced: turned off it stays off, and back under six the mark goes.
    await page.getByTestId("kumimoji-double-off").click();
    await expect(page.getByTestId("kumimoji-double-off")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("kumimoji-players-3").click();
    await expect(page.getByTestId("kumimoji-players-blurb")).toContainText("3 players pass this device round");
    await expect(page.getByTestId("kumimoji-double-on")).not.toHaveAttribute("data-recommended", "true");
  });

  test("three players set up with a name, the pass screen first, a word, Done, face-up tables to swipe through, All tables, and the next player's own hand", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator(`[data-testid="set-up-size"][data-size="${QUICK}"]`).click();
    await page.getByTestId("kumimoji-players-3").click();
    await expect(page.getByTestId("kumimoji-players-3")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("kumimoji-players-blurb")).toContainText("3 players pass this device round");
    // A race is two members on two devices: not offered for pass and play.
    await expect(page.getByTestId("puzzle-race")).toBeDisabled();
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /players=3/);
    await page.getByTestId("puzzle-solve").click();

    await begin(page, ["Aiko", "", "Cho"]);
    await expect(page).toHaveURL(/players=3/);
    const seed = Number(new URL(page.url()).searchParams.get("seed"));
    expect(seed).toBeGreaterThan(0);
    const bag = generateKumimoji(QUICK, "medium", seed).givens;
    const [first, second] = [bag.slice(0, QUICK), bag.slice(QUICK, 2 * QUICK)];

    await passFor(page, "Aiko");
    await uncover(page, "Aiko");
    expect([...(await handLetters(page))].sort()).toEqual([...first].sort());

    const word = wordIn(first);
    expect(word, `a word in the hand ${first}`).not.toBeNull();
    await layAcross(page, word!);
    await expect(page.getByTestId("kumimoji-said")).toHaveAttribute("data-sound", "true");
    await page.getByTestId("kumimoji-party-done").click();

    // The second seat has no name: its number. Behind the pass layer, the table just played on: Aiko's word, and what is left in her hand.
    await passFor(page, "Player 2");
    const viewer = page.getByTestId("kumimoji-party-viewer");
    await expect(viewer.getByTestId("kumimoji-party-board")).toHaveAttribute("data-player", "0");
    await expect(viewer.getByTestId("kumimoji-tile")).toHaveCount(word!.length);
    await expect(viewer.getByTestId("kumimoji-party-hand-tile")).toHaveCount(QUICK - word!.length);
    await readOnlyHands(page);

    // A swipe shows the next player's table and hand; the arrow goes back.
    const box = (await viewer.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2, { steps: 5 });
    await page.mouse.up();
    await expect(viewer.getByTestId("kumimoji-party-board")).toHaveAttribute("data-player", "1");
    await expect(viewer.getByTestId("kumimoji-party-hand-tile")).toHaveCount(QUICK);
    await page.getByTestId("kumimoji-party-view-prev").click();
    await expect(viewer.getByTestId("kumimoji-party-board")).toHaveAttribute("data-player", "0");

    await uncover(page, "Player 2");
    const theirs = await handLetters(page);
    expect([...theirs].sort()).toEqual([...second].sort());
    expect([...theirs].sort()).not.toEqual([...first].sort());
    // Their table is their own: Aiko's word is not on it.
    await expect(page.getByTestId("kumimoji-table").getByTestId("kumimoji-tile")).toHaveCount(0);

    // All tables: three, each with its hand; another's opens large and read-only; your own takes you back to play.
    await page.getByTestId("kumimoji-party-all-open").click();
    const tables = page.getByTestId("kumimoji-party-all-table");
    await expect(tables).toHaveCount(3);
    await expect(page.getByTestId("kumimoji-tray")).toHaveCount(0);
    await expect(tables.nth(0).getByTestId("kumimoji-tile")).toHaveCount(word!.length);
    await expect(tables.nth(2).getByTestId("kumimoji-party-hand-tile")).toHaveCount(QUICK);
    await readOnlyHands(page);
    await tables.nth(0).click();
    await expect(page.getByTestId("kumimoji-party-one")).toHaveAttribute("data-player", "0");
    await page.getByTestId("kumimoji-party-one-back").click();
    await page.locator('[data-testid="kumimoji-party-all-table"][data-own="true"]').click();
    await expect(page.getByTestId("kumimoji-tray")).toBeVisible();
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(QUICK);
  });

  test("a game set up with Diagonals reads each player's table along its diagonals", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator(`[data-testid="set-up-size"][data-size="${QUICK}"]`).click();
    await page.getByTestId("kumimoji-players-2").click();
    await page.getByTestId("kumimoji-diagonals-on").click();
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /diagonals=1/);
    await page.getByTestId("puzzle-solve").click();

    await begin(page, ["Aiko", "Ben"]);
    await expect(page).toHaveURL(/diagonals=1/);
    const seed = Number(new URL(page.url()).searchParams.get("seed"));
    const hand = [...generateKumimoji(QUICK, "medium", seed, { diagonals: true }).givens.slice(0, QUICK)].filter((tile) => tile !== "*");
    let notWord: string | null = null;
    for (let a = 0; a < hand.length && notWord === null; a += 1)
      for (let b = 0; b < hand.length && notWord === null; b += 1)
        for (let c = 0; c < hand.length && notWord === null; c += 1)
          if (a !== b && b !== c && a !== c && !isWord(hand[a]! + hand[b]! + hand[c]!)) notWord = hand[a]! + hand[b]! + hand[c]!;
    expect(notWord, `three letters of ${hand.join("")} that are not a word`).not.toBeNull();

    await passFor(page, "Aiko");
    await uncover(page, "Aiko");
    // Corner to corner and touching nothing across or down: read, marked, and named.
    for (const [at, letter] of [...notWord!].entries()) await lay(page, letter, `${at},${at}`);
    await expect(page.locator('[data-testid="kumimoji-tile"][data-mark="misspelt"]')).toHaveCount(3);
    await expect(page.getByTestId("kumimoji-said")).toContainText(`Not a word: ${notWord!.toUpperCase()}`);
  });

  test("Draw gives every player a tile, and a reload opens on the pass screen of the same player", async ({ page }) => {
    const { seed, bag, across } = drawGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${TINY}&level=medium&seed=${seed}&length=medium&players=3`);
    await begin(page, ["Aiko", "Ben", "Cho"]);
    await passFor(page, "Aiko");
    await uncover(page, "Aiko");
    const before = Number(await page.getByTestId("kumimoji-bag").getAttribute("data-left"));
    expect(before).toBe(bag.length - 3 * TINY);
    await expect(page.getByTestId("kumimoji-draw")).toBeDisabled();
    await layAcross(page, across);
    await page.getByTestId("kumimoji-draw").click();
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(before - 3));
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(1);
    await page.getByTestId("kumimoji-party-done").click();

    await passFor(page, "Ben");
    await page.reload();
    await ready(page, "kumimoji-party");
    await passFor(page, "Ben");
    await uncover(page, "Ben");
    // A hand of three and the one tile the Draw gave them.
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(TINY + 1);
    expect([...(await handLetters(page))].sort()).toEqual([...(bag.slice(TINY, 2 * TINY) + bag[3 * TINY + 1]!)].sort());
    await page.getByTestId("kumimoji-party-hide").click();
    await passFor(page, "Ben");
    // Behind the pass layer, the table Aiko has just played on: her word and the tile she drew.
    await expect(page.getByTestId("kumimoji-party-viewer").getByTestId("kumimoji-tile")).toHaveCount(TINY);

    // The set-up screen offers the game back, and takes the reader to Ben's cover.
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("kumimoji-party-continue").click();
    await ready(page, "kumimoji-party");
    await passFor(page, "Ben");

    // And it waits in My games, on Pass and play, until it is finished (AGENTS.md "Anything a person plays is kept").
    await page.goto("/play/pass-and-play");
    await expect(page.getByTestId("local-party")).toContainText("Ben to play");
    await page.getByTestId("local-party-continue").click();
    await ready(page, "kumimoji-party");
    await passFor(page, "Ben");
  });

  test("a hand that spells nothing is traded before Done", async ({ page }) => {
    const { seed } = noWordGame(freshPuzzleSeed());
    await page.goto(smallAddress(seed));
    await begin(page, ["Aiko", "Ben"]);
    await uncover(page, "Aiko");
    const done = page.getByTestId("kumimoji-party-done");
    await expect(done).toBeDisabled();
    await expect(page.getByTestId("kumimoji-party-done-note")).toContainText("No word in your hand");
    await page.getByTestId("kumimoji-hand-tile").first().click();
    await page.getByTestId("kumimoji-trade").click();
    await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(TINY - 1 + 3);
    await expect(done).toBeEnabled();
    await done.click();
    await passFor(page, "Ben");
  });

  test("one player goes out, the other has one last turn, and the finish names the winner with both crosswords", async ({ page }) => {
    const { seed, across, drawn } = goingOutGame(freshPuzzleSeed());
    await page.goto(smallAddress(seed));
    await begin(page, ["Aiko", "Ben"]);
    await uncover(page, "Aiko");
    // Four tiles in the bag: a trade can still be had, so there is no Resign.
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", "4");
    await expect(page.getByTestId("kumimoji-party-resign")).toHaveCount(0);
    await layAcross(page, across);
    for (const tile of drawn) {
      await page.getByTestId("kumimoji-draw").click();
      await lay(page, tile.letter, tile.square);
    }
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", "0");
    await expect(page.getByTestId("kumimoji-party-done")).toHaveText("Done, and go out");
    await page.getByTestId("kumimoji-party-done").click();

    await passFor(page, "Ben");
    await expect(page.getByTestId("kumimoji-party-last")).toHaveText("Aiko went out — last turn for Ben");
    await uncover(page, "Ben");
    await page.getByTestId("kumimoji-party-done").click();

    await expect(page.getByTestId("kumimoji-party-winner")).toHaveText("Aiko wins");
    const crosswords = page.getByTestId("kumimoji-party-board");
    await expect(crosswords).toHaveCount(2);
    await expect(crosswords.nth(0)).toHaveAttribute("data-won", "true");
    await expect(crosswords.nth(0).getByTestId("kumimoji-tile")).toHaveCount(TINY + 2);
    await expect(page.getByTestId("kumimoji-party-again")).toBeVisible();
  });

  test("Resign is offered once the bag cannot give three, and the last one standing wins by laying a tile", async ({ page }) => {
    const { seed, across, second } = standingGame(freshPuzzleSeed());
    await page.goto(smallAddress(seed));
    await begin(page, ["Aiko", "Ben"]);
    await uncover(page, "Aiko");
    await expect(page.getByTestId("kumimoji-tray")).toBeVisible();
    await expect(page.getByTestId("kumimoji-party-resign")).toHaveCount(0);
    await layAcross(page, across);
    await page.getByTestId("kumimoji-draw").click();
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", "2");
    await page.getByTestId("kumimoji-party-resign").click();
    await page.getByTestId("kumimoji-party-resign-yes").click();

    await passFor(page, "Ben");
    await uncover(page, "Ben");
    await expect(page.getByTestId("kumimoji-party-whose")).toContainText("the last one standing");
    const done = page.getByTestId("kumimoji-party-done");
    await expect(done).toBeDisabled();
    await expect(page.getByTestId("kumimoji-party-done-note")).toContainText("Everybody else has resigned");
    await layAcross(page, second);
    await expect(done).toBeEnabled();
    await done.click();
    await expect(page.getByTestId("kumimoji-party-winner")).toHaveText("Ben wins, the last one standing");
    await expect(page.getByTestId("kumimoji-party-board").nth(0)).toHaveAttribute("data-resigned", "true");
  });

  test("a player leaves between turns: their tiles go back into the bag, and the turn order skips them", async ({ page }) => {
    const { seed, bag, across } = leaveGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${TINY}&level=medium&seed=${seed}&length=medium&players=3`);
    await begin(page, ["Aiko", "Ben", "Cho"]);
    await uncover(page, "Aiko");
    const left = bag.length - 3 * TINY;
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(left));
    await layAcross(page, across);
    await page.getByTestId("kumimoji-party-done").click();

    // Ben's pass screen: Aiko gets up, and her word goes back into the bag.
    await passFor(page, "Ben");
    await page.getByTestId("kumimoji-party-seats-open").click();
    await expect(page.getByTestId("kumimoji-party-seat")).toHaveCount(3);
    await page.locator('[data-testid="kumimoji-party-seat"][data-player="0"]').getByTestId("kumimoji-party-leave").click();
    await expect(page.getByTestId("kumimoji-party-seats")).toContainText(`put ${TINY} tiles back in the bag`);
    await page.getByTestId("kumimoji-party-leave-yes").click();

    await passFor(page, "Ben");
    const order = page.getByTestId("kumimoji-party-order").locator("li");
    await expect(order).toHaveCount(2);
    await expect(order).toHaveText(["Ben", "Cho"]);
    await uncover(page, "Ben");
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(left + TINY));
    await page.getByTestId("kumimoji-party-done").click();
    await passFor(page, "Cho");
    await uncover(page, "Cho");
    await page.getByTestId("kumimoji-party-done").click();
    // Round again, with nobody in Aiko's seat.
    await passFor(page, "Ben");
  });

  test("a player joins between turns with a hand from the bag, and joining says why once the bag cannot deal one", async ({ page }) => {
    const { seed, bag } = joinGame(freshPuzzleSeed());
    await page.goto(smallAddress(seed));
    await begin(page, ["Aiko", "Ben"]);
    await passFor(page, "Aiko");
    await page.getByTestId("kumimoji-party-seats-open").click();
    await page.getByTestId("kumimoji-party-join-name").fill("Dai");
    await page.getByTestId("kumimoji-party-join").click();
    await expect(page.getByTestId("kumimoji-party-seat")).toHaveCount(3);
    await expect(page.getByTestId("kumimoji-party-order").locator("li")).toHaveText(["Aiko", "Ben", "Dai"]);
    // Ten tiles, six dealt and three to Dai: one left, less than a hand.
    await expect(page.getByTestId("kumimoji-party-join-why")).toHaveAttribute("data-why", "bag");
    await expect(page.getByTestId("kumimoji-party-join-why")).toContainText("The bag holds 1 tile");

    await uncover(page, "Aiko");
    await page.getByTestId("kumimoji-party-done").click();
    await passFor(page, "Ben");
    await uncover(page, "Ben");
    await page.getByTestId("kumimoji-party-done").click();
    await passFor(page, "Dai");
    await uncover(page, "Dai");
    expect([...(await handLetters(page))].sort()).toEqual([...bag.slice(2 * TINY, 3 * TINY)].sort());
  });

  test("a computer seat plays its own turn where everybody can see, then play returns to the person; a reload during or after it finds the same turn", async ({ page }) => {
    const { seed, first, second } = computerGame(freshPuzzleSeed());
    await page.goto(`${AT}/play?size=${QUICK}&level=medium&seed=${seed}&players=2`);
    await beginWithComputer(page, 0, ["", "Aiko"]);

    // The computer plays first: no pass screen for it, its table gaining tiles under a line saying what it did.
    const turn = page.getByTestId("kumimoji-party-computer");
    await expect(turn).toBeVisible();
    await expect(turn).toHaveAttribute("data-player", "0");
    await expect(page.getByTestId("kumimoji-party-whose")).toContainText("Computer 1 is playing");
    await expect(turn.getByTestId("kumimoji-party-computer-mark").first()).toBeVisible();
    await expect(page.getByTestId("kumimoji-party-computer-said")).toContainText("Laid");
    await expect(turn.getByTestId("kumimoji-tile").first()).toBeVisible();

    // A reload in the middle of its turn — nothing of it kept yet, the kept game still the computer's to play — plays the same turn again, from its start.
    const keptTurn = await page.evaluate(() => (JSON.parse(window.localStorage.getItem("itsutsu:kumimoji-party") ?? "{}") as { turn?: number }).turn);
    expect(keptTurn).toBe(0);
    await page.reload();
    await ready(page, "kumimoji-party");
    await expect(page.getByTestId("kumimoji-party-computer")).toBeVisible();
    await passFor(page, "Aiko");
    await computerTable(page, first);

    // And a reload after it finds it done.
    await page.reload();
    await ready(page, "kumimoji-party");
    await passFor(page, "Aiko");
    await computerTable(page, first);

    await uncover(page, "Aiko");
    await expect(page.getByTestId("kumimoji-bag")).toHaveAttribute("data-left", String(partyTilesLeft(first)));
    expect([...(await handLetters(page))].sort()).toEqual([...first.players[1]!.hand].sort());
    await page.getByTestId("kumimoji-party-done").click();

    await expect(page.getByTestId("kumimoji-party-computer")).toBeVisible();
    await passFor(page, "Aiko");
    await computerTable(page, second);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("nothing scrolls sideways: the Players chips, the names, the pass screen, a turn and All tables", async ({ page }) => {
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth);
      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await page.getByTestId("kumimoji-players-8").click();
      await expect(page.getByTestId("kumimoji-players-8")).toHaveAttribute("aria-checked", "true");
      // Eight Classic hands and a round of draws are 96 tiles: from one set, Short and Medium cannot deal them
      // (eight players choose the Double set, so it is turned off here to see the one set's limits).
      await page.locator(`[data-testid="set-up-size"][data-size="${KUMIMOJI_HANDS.classic}"]`).click();
      await page.getByTestId("kumimoji-double-off").click();
      await expect(page.getByTestId("kumimoji-length-short")).toBeDisabled();
      await expect(page.getByTestId("kumimoji-length-full")).toHaveAttribute("aria-checked", "true");
      expect(await wide()).toBeLessThanOrEqual(390);

      await page.goto(`${AT}/play?size=${QUICK}&level=medium&seed=${freshPuzzleSeed()}&length=medium&players=8`);
      await ready(page, "kumimoji-party");
      await expect(page.getByTestId("kumimoji-party-name")).toHaveCount(8);
      expect(await wide()).toBeLessThanOrEqual(390);
      await begin(page, ["A very long name indeed"]);
      await passFor(page, "A very long name ind");
      expect(await wide()).toBeLessThanOrEqual(390);
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await uncover(page, "A very long name ind");
      await expect(page.getByTestId("kumimoji-hand-tile")).toHaveCount(QUICK);
      expect(await wide()).toBeLessThanOrEqual(390);
      await page.getByTestId("kumimoji-party-all-open").click();
      await expect(page.getByTestId("kumimoji-party-all-table")).toHaveCount(8);
      expect(await wide()).toBeLessThanOrEqual(390);
    });

    test("nothing scrolls sideways with a computer at the table: the seats, its turn, and Join or leave", async ({ page }) => {
      const wide = () => page.evaluate(() => document.documentElement.scrollWidth);
      const { seed } = computerGame(freshPuzzleSeed());
      await page.goto(`${AT}/play?size=${QUICK}&level=medium&seed=${seed}&players=3`);
      await ready(page, "kumimoji-party");
      await page.locator('[data-testid="kumimoji-party-seat-computer"][data-at="0"]').click();
      await page.locator('[data-testid="kumimoji-party-name"][data-at="1"]').fill("A very long name indeed");
      expect(await wide()).toBeLessThanOrEqual(390);
      await page.getByTestId("kumimoji-party-begin").click();
      await expect(page.getByTestId("kumimoji-party-computer")).toBeVisible();
      expect(await wide()).toBeLessThanOrEqual(390);
      await passFor(page, "A very long name ind");
      await page.getByTestId("kumimoji-party-seats-open").click();
      await expect(page.getByTestId("kumimoji-party-seat")).toHaveCount(3);
      expect(await wide()).toBeLessThanOrEqual(390);
    });
  });
});
