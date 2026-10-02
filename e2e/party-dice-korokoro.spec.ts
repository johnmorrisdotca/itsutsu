import { expect, test, type Page } from "@playwright/test";

import { pachisiMoves, playPachisi, startPachisi } from "../src/lib/party/pachisi/pachisi";
import { decodePachisi, encodePachisi } from "../src/lib/party/pachisi/pachisiCodec";
import type { PachisiGame } from "../src/lib/party/pachisi/pachisi.types";
import { playYacht, startYacht } from "../src/lib/party/yacht/yacht";
import { decodeYacht, encodeYacht } from "../src/lib/party/yacht/yachtCodec";
import { ready } from "./support";

/**
 * YACHT'S AND PACHISI'S DICE ARE KOROKORO'S, drawn and tumbled by its die
 * (`PartyDie`), and the game under them is the same game: the face on a die is
 * the one the rules threw from the game's seed, whatever draws it, so a game
 * read back from its moves shows the dice it showed before.
 *
 * Each spec brings its own world: a game made here by the same rules the page
 * plays and kept in this browser the way the table keeps it, so nothing
 * depends on what this machine has seen. Nothing here writes to the database.
 */
const YACHT_KEPT = "itsutsu.yacht";
const PACHISI_KEPT = "itsutsu.pachisi";

async function keep(page: Page, at: string, key: string, text: string) {
  await page.goto(at);
  await page.evaluate(([name, value]) => window.localStorage.setItem(name, value), [key, text] as const);
}

/** The lone die inside one of the table's dice: Korokoro's, with the face it shows. */
const solo = (die: ReturnType<Page["locator"]>) => die.locator('[data-testid="kk-solo-die"]');

test("Yacht: a table opened on a roll already made shows the game's dice at rest; a roll tumbles the dice not held and lands on the faces the game kept", async ({ page }) => {
  const first = playYacht(startYacht(["Ann"], 20261002, [false])!, { kind: "roll", hold: 0 })!;
  await keep(page, "/games/yacht", YACHT_KEPT, encodeYacht(first));
  await page.goto("/games/yacht/pass-and-play");
  await ready(page, "yacht-game");

  // The sound is off until somebody turns it on, and the dice are drawn on their own, each a six-sided die of Korokoro's on the face the game threw.
  await expect(page.getByTestId("dice-sound")).toHaveAttribute("data-on", "false");
  const dice = page.getByTestId("dice-die");
  await expect(dice).toHaveCount(5);
  for (const [at, face] of first.dice.entries()) {
    await expect(dice.nth(at)).toHaveAttribute("data-value", String(face));
    await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));
    await expect(solo(dice.nth(at))).toHaveAttribute("data-sides", "6");
  }
  // This roll was made before the table was opened: nothing tumbles.
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);

  // Hold the first die and roll the rest by the tray: the four tumble, the held one lies still.
  await dice.first().click();
  await expect(dice.first()).toHaveAttribute("data-held", "true");
  await page.getByTestId("yacht-roll").click();
  await expect(page.getByTestId("yacht-game")).toHaveAttribute("data-rolls", "2");
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(4);
  await expect(solo(dice.first())).toHaveAttribute("data-rolling", "false");

  // The game kept the faces; the dice end on exactly those, and a game read back from its moves has the same ones.
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
  const kept = decodeYacht(await page.evaluate((key) => window.localStorage.getItem(key), YACHT_KEPT))!;
  expect(kept.dice[0]).toBe(first.dice[0]);
  const replayed = playYacht(first, { kind: "roll", hold: 1 })!;
  expect(replayed.dice).toEqual(kept.dice);
  for (const [at, face] of kept.dice.entries()) {
    await expect(dice.nth(at)).toHaveAttribute("data-value", String(face));
    await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));
  }

  // A reload opens on the same dice, at rest.
  await page.reload();
  await ready(page, "yacht-game");
  for (const [at, face] of kept.dice.entries()) await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
});

test("Yacht: before the first roll the dice are empty squares, and the first roll tumbles all five onto the game's faces", async ({ page }) => {
  await keep(page, "/games/yacht", YACHT_KEPT, encodeYacht(startYacht(["Ann"], 20261003, [false])!));
  await page.goto("/games/yacht/pass-and-play");
  await ready(page, "yacht-game");
  const dice = page.getByTestId("dice-die");
  for (let at = 0; at < 5; at += 1) await expect(dice.nth(at)).toHaveAttribute("data-value", "0");
  await page.getByTestId("yacht-roll").click();
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(5);
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
  const kept = decodeYacht(await page.evaluate((key) => window.localStorage.getItem(key), YACHT_KEPT))!;
  expect(kept.dice.every((face) => face >= 1 && face <= 6)).toBe(true);
  for (const [at, face] of kept.dice.entries()) await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));

  // Every roll tumbles, the third too, after which the dice can no longer be held and so are no longer pressed: a die that stopped being a control must not be drawn afresh.
  for (const roll of [2, 3]) {
    await page.getByTestId("yacht-roll").click();
    await expect(page.getByTestId("yacht-game")).toHaveAttribute("data-rolls", String(roll));
    await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(5);
    await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
  }
  const last = decodeYacht(await page.evaluate((key) => window.localStorage.getItem(key), YACHT_KEPT))!;
  for (const [at, face] of last.dice.entries()) await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));
});

/** A person and a computer, on a seed whose first throw brings a pawn out: the person has something to move at once. */
function pachisiOpening(): PachisiGame {
  for (let seed = 1; ; seed += 1) {
    const game = startPachisi(["Ann", ""], seed, [false, true])!;
    const thrown = playPachisi(game, { kind: "roll" })!;
    if (thrown.phase === "move" && thrown.toPlay === 0 && pachisiMoves(thrown).length > 0) return game;
  }
}

test("Pachisi: the two dice are Korokoro's, empty before the first throw, tumbling onto the game's faces when thrown, and at rest when the table is opened again", async ({ page }) => {
  await keep(page, "/games/pachisi", PACHISI_KEPT, encodePachisi(pachisiOpening()));
  await page.goto("/games/pachisi/pass-and-play");
  await ready(page, "pachisi-game");
  const dice = page.getByTestId("pachisi-die");
  await expect(dice).toHaveCount(2);
  await expect(dice.first()).toHaveAttribute("data-value", "0");

  await page.getByTestId("pachisi-roll").click();
  await expect(page.getByTestId("pachisi-game")).toHaveAttribute("data-state", "move");
  const kept = decodePachisi(await page.evaluate((key) => window.localStorage.getItem(key), PACHISI_KEPT))!;
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
  for (const [at, face] of kept.dice.entries()) {
    await expect(dice.nth(at)).toHaveAttribute("data-value", String(face));
    await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));
    await expect(solo(dice.nth(at))).toHaveAttribute("data-sides", "6");
  }

  // Opened again, the same throw lies at rest on the same faces.
  await page.reload();
  await ready(page, "pachisi-game");
  for (const [at, face] of kept.dice.entries()) await expect(solo(dice.nth(at))).toHaveAttribute("data-face", String(face));
  await expect(page.locator('[data-testid="kk-solo-die"][data-rolling="true"]')).toHaveCount(0);
});
