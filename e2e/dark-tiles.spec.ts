import { expect, test, type Locator, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateKumimoji } from "../src/lib/puzzles/kumimoji/generate";
import { KUMIMOJI_HANDS } from "../src/lib/puzzles/kumimoji/tiles.constants";
import { tileWords } from "../src/lib/puzzles/kumimoji/tileWords";
// This process has no browser: the lists are read from their modules (`tileWordsModule.ts`).
import { loadTileWordsFromModule as loadTileWords } from "../src/lib/puzzles/kumimoji/tileWordsModule";
import { freshPuzzleSeed, ready } from "./support";

/**
 * EVERY LETTER CAN BE READ, IN BOTH THEMES.
 *
 * John, 2026-09-28, on Kumimoji in dark mode: "The tiles seem to be all
 * clear! BUG: MAJOR". A tile is white in both themes, and its letter was
 * written in `text-ink`, the theme's ink — charcoal by day and ivory by
 * night — so at night every letter was white on white. The same fault sat
 * under Gomoji's typed tiles, Koushi's plain tiles and every number puzzle's
 * white paper. A surface that is light in both themes now carries the light
 * theme's tokens (`surface-light`, globals.css), so whatever is written on it
 * reads the ink meant for it.
 *
 * This measures what a reader sees: each letter's computed colour against the
 * computed colour behind it, as a contrast ratio worked out in the page, with
 * the browser told the reader prefers light, then dark. A white-on-white is a
 * ratio of 1 and cannot pass.
 */

/** WCAG's ratio for body text. */
const READABLE = 4.5;

/**
 * A marble's letter is a second mark beside its colour, and the marbles are
 * Okabe and Ito's colours, fixed in both themes: red and green carry white
 * letters at about 3.3–3.8, WCAG's ratio for large type and graphics. What this
 * holds them to is that the theme cannot move them.
 */
const MARBLE = 3;

type Reading = { text: string; ratio: number; ink: string; ground: string };

/**
 * Each element's text against what is behind it: its own background, or the
 * first one under it, composited down to an opaque colour; for a round face
 * drawn as a gradient, the stop nearest its middle. Colours are read through
 * a canvas, so oklab and color-mix come back as plain sRGB.
 */
async function readings(elements: Locator): Promise<Reading[]> {
  return elements.evaluateAll((nodes) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const pen = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgba = (colour: string): [number, number, number, number] => {
      pen.clearRect(0, 0, 1, 1);
      pen.fillStyle = "rgba(0,0,0,0)";
      pen.fillStyle = colour;
      pen.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pen.getImageData(0, 0, 1, 1).data;
      return [r!, g!, b!, a! / 255];
    };
    const over = (top: [number, number, number, number], under: [number, number, number]): [number, number, number] => [
      top[0] * top[3] + under[0] * (1 - top[3]),
      top[1] * top[3] + under[1] * (1 - top[3]),
      top[2] * top[3] + under[2] * (1 - top[3]),
    ];
    /** The colour stop nearest the middle of a gradient, split at its top-level commas. */
    const middleStop = (image: string): string | null => {
      const inner = image.slice(image.indexOf("(") + 1, image.lastIndexOf(")"));
      const parts: string[] = [];
      let depth = 0;
      let from = 0;
      for (let at = 0; at < inner.length; at += 1) {
        if (inner[at] === "(") depth += 1;
        else if (inner[at] === ")") depth -= 1;
        else if (inner[at] === "," && depth === 0) {
          parts.push(inner.slice(from, at).trim());
          from = at + 1;
        }
      }
      parts.push(inner.slice(from).trim());
      let best: { colour: string; distance: number } | null = null;
      for (const part of parts) {
        const stop = /^(.*\))\s+([\d.]+)%$/.exec(part);
        if (stop === null) continue;
        const distance = Math.abs(Number(stop[2]) - 50);
        if (best === null || distance < best.distance) best = { colour: stop[1]!, distance };
      }
      return best?.colour ?? null;
    };
    const luminance = ([r, g, b]: [number, number, number]) => {
      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    /** The element a letter is actually written in: the parent of the first piece of text under the one found. */
    const letterOf = (found: Element): Element => {
      const walker = document.createTreeWalker(found, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text !== null; text = walker.nextNode()) if ((text.textContent ?? "").trim() !== "") return text.parentElement ?? found;
      return found;
    };
    return nodes.map((found) => {
      const node = letterOf(found);
      const layers: [number, number, number, number][] = [];
      for (let at: Element | null = node; at !== null; at = at.parentElement) {
        const style = getComputedStyle(at);
        const own = rgba(style.backgroundColor);
        if (own[3] > 0) layers.push(own);
        if (own[3] < 1 && style.backgroundImage.includes("gradient")) {
          const middle = middleStop(style.backgroundImage);
          if (middle !== null) layers.push(rgba(middle));
        }
        if (layers.length > 0 && layers[layers.length - 1]![3] >= 1) break;
      }
      let ground: [number, number, number] = [255, 255, 255];
      for (const layer of layers.reverse()) ground = over(layer, ground);
      const ink = over(rgba(getComputedStyle(node).color), ground);
      const [light, dark] = [luminance(ink), luminance(ground)].sort((a, b) => b - a);
      return {
        text: (found.textContent ?? "").trim(),
        ratio: Math.round(((light! + 0.05) / (dark! + 0.05)) * 100) / 100,
        ink: `rgb(${ink.map(Math.round).join(",")})`,
        ground: `rgb(${ground.map(Math.round).join(",")})`,
      };
    });
  });
}

/** Every element found has a letter on it, and every letter reads at `least`. */
async function expectReadable(elements: Locator, least: number, what: string) {
  // An absence proves nothing: there must be letters here to read.
  await expect(elements.first()).toBeVisible();
  const found = (await readings(elements)).filter((reading) => reading.text !== "");
  expect(found.length, `${what}: no lettered element to measure`).toBeGreaterThan(0);
  const unreadable = found.filter((reading) => reading.ratio < least);
  expect(unreadable, `${what}: letters under ${least}:1`).toEqual([]);
}

async function screenshotAt(page: Page, name: string) {
  const out = process.env.DARK_TILES_SHOTS;
  if (out === undefined || out === "") return;
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
}

/** A Classic Kumimoji bag with two letters of its hand that are not a word, either way round. */
function kumimojiGame(from: number): { seed: number; first: string; second: string } {
  const allowed = tileWords().allowed;
  for (let seed = from; ; seed += 1) {
    const hand = [...generateKumimoji(KUMIMOJI_HANDS.classic, "medium", seed).givens.slice(0, KUMIMOJI_HANDS.classic)].filter((letter) => letter !== "*");
    for (let a = 0; a < hand.length; a += 1)
      for (let b = a + 1; b < hand.length; b += 1)
        if (hand[a] !== hand[b] && !allowed.has(hand[a]! + hand[b]!) && !allowed.has(hand[b]! + hand[a]!)) return { seed, first: hand[a]!, second: hand[b]! };
  }
}

test.beforeAll(async () => {
  await loadTileWords();
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`Letters read on their tiles, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test("Kumimoji: the hand, the table, a misspelt line, the set-up preview and the front door's hand", async ({ page }) => {
      const AT = `/games/${PUZZLE_SLUGS.kumimoji}`;
      const { seed, first, second } = kumimojiGame(freshPuzzleSeed());
      await page.goto(`${AT}/play?size=${KUMIMOJI_HANDS.classic}&level=medium&seed=${seed}`);
      await ready(page, "puzzle-play");

      // Two letters that are no word, laid side by side as a player would: tile, then square.
      await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${first}"]`).first().click();
      await page.locator('[data-testid="kumimoji-square"][data-square="0,0"]').click();
      await expect(page.locator('[data-testid="kumimoji-tile"][data-square="0,0"]')).toHaveAttribute("data-letter", first);
      await page.locator(`[data-testid="kumimoji-hand-tile"][data-letter="${second}"]`).first().click();
      await page.locator('[data-testid="kumimoji-square"][data-square="0,1"]').click();
      await expect(page.locator('[data-testid="kumimoji-tile"][data-square="0,1"]')).toHaveAttribute("data-letter", second);
      await expect(page.locator('[data-testid="kumimoji-tile"][data-square="0,1"]')).toHaveAttribute("data-mark", "misspelt");
      await screenshotAt(page, `dark-kumimoji-${scheme}-${page.viewportSize()!.width}`);
      await expectReadable(page.getByTestId("kumimoji-tile"), READABLE, "table");
      await expectReadable(page.getByTestId("kumimoji-hand-tile"), READABLE, "hand");

      await page.goto(`${AT}/new`);
      await ready(page, "puzzle-set-up");
      await expectReadable(page.getByTestId("set-up-puzzle-preview").getByTestId("kumimoji-tile"), READABLE, "set-up preview");

      await page.goto(AT);
      await ready(page, "kumimoji-try");
      await expectReadable(page.getByTestId("kumimoji-try-tile"), READABLE, "front door's hand");
    });

    test.describe("on a phone", () => {
      test.use({ viewport: { width: 390, height: 844 } });

      test("Kumimoji: the hand in the tray at the foot of the screen", async ({ page }) => {
        await page.goto(`/games/${PUZZLE_SLUGS.kumimoji}/play?size=${KUMIMOJI_HANDS.classic}&level=medium&seed=${freshPuzzleSeed()}`);
        await ready(page, "puzzle-play");
        await screenshotAt(page, `dark-kumimoji-${scheme}-390`);
        await expectReadable(page.getByTestId("kumimoji-hand-tile"), READABLE, "hand on a phone");
      });
    });

    test("Gomoji: typed letters on the white tiles", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=5&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      await page.getByTestId("word-style-tiles").click();
      // On a desk the keys under the grid are folded away, so the letters are typed, as a reader at a keyboard does.
      await page.keyboard.type("sto");
      await expect(page.locator('[data-testid="word-tile"][data-row="0"]').nth(2)).toHaveText(/o/i);
      await screenshotAt(page, `dark-gomoji-${scheme}`);
      await expectReadable(page.locator('[data-testid="word-tile"][data-row="0"]'), READABLE, "typed tiles");
      // The style is kept on the account every spec plays as: put it back, or a later spec meets Tiles where it expects the default.
      await page.getByTestId("word-style-reversi").click();
      await expect(page.getByTestId("word-style-reversi")).toHaveAttribute("aria-pressed", "true");
    });

    test("Koushi: the lattice's tiles", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.koushi}/play?size=5&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      await screenshotAt(page, `dark-koushi-${scheme}`);
      await expectReadable(page.getByTestId("koushi-tile"), READABLE, "lattice tiles");
    });

    test("Number Place: the givens and a written number on the white paper, and the chosen cell", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      const cells = page.getByTestId("puzzle-cell");
      await expectReadable(cells, READABLE, "givens");
      const empty = page.locator('[data-testid="puzzle-cell"][data-given="false"]').first();
      await empty.click();
      await page.keyboard.press("1");
      await expect(empty).toHaveText("1");
      await screenshotAt(page, `dark-sudoku4-${scheme}`);
      await expectReadable(cells, READABLE, "written and chosen");
    });

    test("Sudoku at 16×16, and Towers: the digits and letters on the paper, the clues on the wood, the coordinates on the page", async ({ page }) => {
      await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=16&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      await screenshotAt(page, `dark-sudoku16-${scheme}`);
      await expectReadable(page.getByTestId("puzzle-cell"), READABLE, "16×16 givens");
      await expectReadable(page.locator(".board-coordinates span"), READABLE, "coordinates");

      await page.goto(`/games/${PUZZLE_SLUGS.towers}/play?size=4&level=medium&seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
      // The clues stand on the wood, not the page: measured against the kaya they are printed on (its gradient's middle).
      await screenshotAt(page, `dark-towers-${scheme}`);
      await expectReadable(page.getByTestId("puzzle-tower-clue"), READABLE, "Towers clues");
    });

    test("Dots and Boxes: each player's marble and its letter", async ({ page }) => {
      await page.goto("/games/dots-and-boxes");
      await page.evaluate(() => window.localStorage.removeItem("itsutsu.dotsAndBoxes"));
      await page.goto("/games/dots-and-boxes/pass-and-play");
      await ready(page, "dots-set-up");
      await page.locator('[data-testid="dots-count"][data-count="6"]').click();
      await page.getByTestId("dots-start").click();
      await ready(page, "dots-game");
      await expectReadable(page.getByTestId("dots-game").locator("[data-marble]"), MARBLE, "marbles");
    });
  });
}
