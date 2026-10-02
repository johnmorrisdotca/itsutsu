import { expect, test, type Page } from "@playwright/test";

import { TENKA_PHASES } from "../src/lib/party/tenka/tenka.constants";
import { playTenka } from "../src/lib/party/tenka/tenka";
import type { TenkaGame } from "../src/lib/party/tenka/tenka.types";
import { decodeTenka, encodeTenka } from "../src/lib/party/tenka/tenkaKeep";
import { TENKA_TERRITORIES, tenkaNeighbours } from "../src/lib/party/tenka/tenkaMap";
import { sensibleTenkaMove } from "../src/lib/party/tenka/tenkaPolicy";
import { startTenka } from "../src/lib/party/tenka/tenkaStart";
import { ready } from "./support";

/**
 * TENKA'S DICE ARE KOROKORO'S AND ITS CARDS ARE TORANPU'S, drawn through the
 * package's dressing (`TenkaDressed.tsx`), and the game under them is the same
 * game: the face on a die, the card in a hand and the cards left in the deck
 * are what the rules decided, whatever draws them.
 *
 * The spec brings its own world: a game it plays ahead in Node to a hand of
 * cards and a throw already made, kept in this browser the way the page keeps
 * it, so nothing depends on what this machine has seen. Nothing here writes to
 * the database.
 */

const KEPT = "itsutsu.tenka";

/** A small seeded random, so the game played ahead is the same every run. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** A game of three played on by the computer's own sensible moves until a player has the cards and a throw is on the table. */
function gameWithCardsAndThrow(): TenkaGame {
  for (let seed = 1; seed < 40; seed += 1) {
    let game = startTenka(60, ["Ann", "Ben", "Cy"], seed)!;
    const random = seeded(seed);
    for (let step = 0; step < 4000 && game.phase !== TENKA_PHASES.over; step += 1) {
      const next = playTenka(game, sensibleTenkaMove(game, random));
      if (next === null) break;
      game = next;
      if (game.phase === TENKA_PHASES.attack && game.lastRoll !== null && game.hands[game.toPlay].length >= 2) return game;
    }
  }
  throw new Error("no game reached a throw with cards in hand");
}

async function open(page: Page, game: TenkaGame) {
  await page.goto("/games/tenka");
  await page.evaluate(([key, text]) => window.localStorage.setItem(key, text), [KEPT, encodeTenka(game)]);
  await page.goto("/games/tenka/pass-and-play");
  await ready(page, "tenka-game");
  await page.getByTestId("tenka-ready").click();
  await expect(page.getByTestId("tenka-game")).toHaveAttribute("data-handed", "true");
}

test("a table opened on a throw already made shows the game's dice and cards, drawn, at rest", async ({ page }) => {
  const game = gameWithCardsAndThrow();
  const roll = game.lastRoll!;
  const hand = game.hands[game.toPlay];
  await open(page, game);

  // Every card of the hand is drawn (an outline of its territory, not a line of text), and each says which it is.
  const cards = page.getByTestId("tenka-card");
  await expect(cards).toHaveCount(hand.length);
  for (const [at] of hand.entries()) await expect(cards.nth(at).locator("svg").first()).toBeVisible();
  // The deck is the game's: its count is the cards left, drawn as a back.
  const deck = page.getByTestId("tenka-deck");
  await expect(deck).toHaveAttribute("data-left", String(game.deck.length));
  await expect(deck).toContainText(`Deck: ${game.deck.length}`);
  await expect(deck.locator("svg").first()).toBeVisible();

  // Every die shows the face the game threw, and nothing is tumbling: this throw was made before the table was opened.
  const faces = [...roll.attackDice, ...roll.defendDice];
  const dice = page.getByTestId("tenka-dice").getByTestId("tenka-die");
  await expect(dice).toHaveCount(faces.length);
  for (const [at, face] of faces.entries()) {
    await expect(dice.nth(at)).toHaveAttribute("data-face", String(face));
    await expect(dice.nth(at).locator('[data-testid="kk-solo-die"]')).toHaveAttribute("data-face", String(face));
  }
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
});

test("a throw made while the table is open tumbles, and lands on the face the game threw", async ({ page }) => {
  const start = startTenka(60, ["Ann", "Ben", "Cy"], 5)!;
  await open(page, start);

  // Every army onto one territory with a neighbour of somebody else's, that territory against the neighbour, and a throw.
  const from = start.owners.findIndex((owner, territory) => owner === start.toPlay && tenkaNeighbours(territory).some((next) => start.owners[next] !== start.toPlay));
  const to = tenkaNeighbours(from).find((next) => start.owners[next] !== start.toPlay)!;
  const chip = (territory: number) => page.locator(`[data-testid="tenka-territory"][data-territory="${TENKA_TERRITORIES[territory].key}"]`);
  await chip(from).click();
  await page.getByTestId("tenka-place-all").click();
  await chip(from).click();
  await chip(to).click();
  await page.getByTestId("tenka-roll").first().click();
  await expect(page.getByTestId("tenka-dice")).toHaveAttribute("data-rolled", "true");

  // The game kept the faces; the dice drawn end on exactly those, whatever they tumbled through on the way.
  const kept = decodeTenka(await page.evaluate((key) => window.localStorage.getItem(key), KEPT))!;
  const faces = [...kept.lastRoll!.attackDice, ...kept.lastRoll!.defendDice];
  const dice = page.getByTestId("tenka-dice").getByTestId("tenka-die");
  await expect(dice).toHaveCount(faces.length);
  for (const [at, face] of faces.entries()) {
    await expect(dice.nth(at).locator('[data-testid="kk-solo-die"]')).toHaveAttribute("data-rolling", "false");
    await expect(dice.nth(at).locator('[data-testid="kk-solo-die"]')).toHaveAttribute("data-face", String(face));
  }
});
