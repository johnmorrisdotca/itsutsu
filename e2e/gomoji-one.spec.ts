import { expect, test, type Page } from "@playwright/test";

import { GAME_SETTINGS } from "../src/lib/catalogue/gameSettings";
import type { WordLanguage } from "../src/lib/catalogue/gameSettings.types";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { answersFor, languageOf } from "../src/lib/puzzles/gomoji/code";
import { hiddenWordsOf } from "../src/lib/puzzles/gomoji/futago";
import { kanaWordsOf } from "../src/lib/puzzles/gomojiKana/kanaWords";
import type { PuzzleKind, PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { tapKana } from "./kanaTyping";
import { ready } from "./support";
import { loadEveryWordList } from "./wordLists";

test.beforeAll(loadEveryWordList);
test.beforeAll(prepareEveryPuzzle);

/**
 * ONE GOMOJI, ITS LANGUAGE AND WORD LIST CHOSEN ON ITS SET-UP. John,
 * 2026-09-28, at five Gomoji cards on one shelf: "just have 1 and allow
 * language selection". Driven as a reader drives it: the one set-up, a
 * language pressed, Start, and a guess typed in that language — every
 * language, and the Pop culture list — with the set-up standing still under
 * every choice, and the old addresses leading here.
 */
const SET_UP = "/games/gomoji/new";
const PHONE = { width: 390, height: 844 };

/** A real word of the puzzle's length that is not its answer: from the same lists the site draws from. */
function aGuess(kind: PuzzleKind, size: number, level: PuzzleLevel, seed: number): string {
  const hidden = hiddenWordsOf(kind, size, generatePuzzle(kind, size, level, seed).givens)!.words[0]!;
  const pool = kind === "gomojiKana" ? [...kanaWordsOf(size).answers] : [...answersFor(size, level === "easy", languageOf(kind))];
  return pool.find((word) => word !== hidden)!;
}

/** Where the set-up's parts stand on the page, and how tall they are. */
async function standing(page: Page) {
  return page.evaluate(() => {
    const at = (id: string) => {
      const box = document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
      return { top: Math.round(box.top + window.scrollY), height: Math.round(box.height) };
    };
    // The preview and the options: what a language could move. (Start's place follows whether this reader has a puzzle of that language going, whose Resume leads the column.)
    return { preview: at("set-up-puzzle-preview"), settings: at("puzzle-settings") };
  });
}

const CHOICES: readonly { kind: PuzzleKind; language: WordLanguage; pop: boolean }[] = [
  { kind: "gomojiMot", language: "french", pop: false },
  { kind: "gomojiWort", language: "german", pop: false },
  { kind: "gomojiKana", language: "japanese", pop: false },
  { kind: "gomojiPop", language: "english", pop: true },
  { kind: "gomoji", language: "english", pop: false },
];

test.describe("one Gomoji, in every language", () => {
  test("its one set-up chooses each language and list by pressing, and stands still for every one", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(SET_UP);
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("word-settings")).toHaveAttribute("data-language", "english");
    const first = await standing(page);
    for (const choice of CHOICES) {
      if (choice.pop) {
        await page.getByTestId("word-language-english").click();
        await expect(page.getByTestId("word-settings")).toHaveAttribute("data-language", "english");
        await page.getByTestId("word-list-pop").click();
      } else {
        await page.getByTestId(`word-language-${choice.language}`).click();
        if (choice.language === "english") await page.getByTestId("word-list-everyday").click();
      }
      const settings = page.getByTestId("word-settings");
      await expect(settings).toHaveAttribute("data-language", choice.language);
      await expect(settings).toHaveAttribute("data-list", choice.pop ? "pop" : "everyday");
      // The address says the choice, so a reload or a shared link opens on it.
      const setting = GAME_SETTINGS[choice.kind]!;
      if (setting.language !== "english") await expect(page).toHaveURL(new RegExp(`language=${setting.language}`));
      if (choice.pop) await expect(page).toHaveURL(/list=pop/);
      expect(await standing(page), `${choice.kind}: the set-up moved`).toEqual(first);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);
    }
    // Pop culture is English only: offered, and switched off, in another language.
    await page.getByTestId("word-language-french").click();
    await expect(page.getByTestId("word-settings")).toHaveAttribute("data-language", "french");
    await expect(page.getByTestId("word-list-pop")).toBeDisabled();
    await expect(page.getByTestId("word-setting-note")).toContainText("Pop culture is in English only");
  });

  for (const choice of CHOICES) {
    test(`${choice.kind}: chosen on the set-up, started, and a guess played in its words`, async ({ page }) => {
      await page.goto(SET_UP);
      await ready(page, "puzzle-set-up");
      if (choice.pop) await page.getByTestId("word-list-pop").click();
      else if (choice.language !== "english") await page.getByTestId(`word-language-${choice.language}`).click();
      await expect(page.getByTestId("word-settings")).toHaveAttribute("data-language", choice.language);
      await expect(page.getByTestId("word-settings")).toHaveAttribute("data-list", choice.pop ? "pop" : "everyday");
      await page.getByTestId("puzzle-solve").click();
      await expect(page).toHaveURL(/\/games\/gomoji\/play\?/);
      await expect(page).toHaveURL(/seed=\d+/);
      await ready(page, "puzzle-play");
      const play = page.getByTestId("puzzle-play");
      await expect(play).toHaveAttribute("data-kind", choice.kind);
      const url = new URL(page.url());
      const size = Number(url.searchParams.get("size"));
      const level = url.searchParams.get("level") as PuzzleLevel;
      const seed = Number(url.searchParams.get("seed"));
      const guess = aGuess(choice.kind, size, level, seed);
      if (choice.kind === "gomojiKana") {
        await tapKana(page, guess);
        await page.getByTestId("kana-key-enter").click();
      } else {
        await page.keyboard.type(guess);
        await page.keyboard.press("Enter");
      }
      // Marked by the rules: the first row a guess's (a kana word's second row, under its free grey word on easy and medium).
      const row = choice.kind === "gomojiKana" && level !== "hard" ? 1 : 0;
      await expect(page.locator(`[data-testid="word-tile"][data-row="${row}"]`).first()).toHaveAttribute("data-mark", /^(hit|near|kin|miss)$/);
    });
  }

  test("an old address leads to the one Gomoji's page, its language chosen", async ({ page }) => {
    await page.goto(`/games/${PUZZLE_SLUGS.gomojiMot}/new`);
    // The set-up may add the reader's remembered size and level to the address; the language is what the old address promised.
    await expect(page).toHaveURL((url) => url.pathname === "/games/gomoji/new" && url.searchParams.get("language") === "french");
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("word-language-french")).toHaveAttribute("aria-checked", "true");
    await page.goto(`/games/${PUZZLE_SLUGS.gomojiPop}`);
    await expect(page).toHaveURL(/\/games\/gomoji\?list=pop$/);
    await expect(page.getByTestId("word-settings-panel").getByTestId("word-setting-row")).toHaveCount(5);
  });

  test("its rules are one page, a section for each other language and list", async ({ page }) => {
    await page.goto("/games/gomoji/rules");
    await expect(page.getByTestId("rules-setting")).toHaveCount(4);
    await expect(page.locator("#setting-japanese-everyday")).toContainText("hiragana");
  });
});
