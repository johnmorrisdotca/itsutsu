import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { encodeDots, replayDots } from "../src/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { PartyKind } from "../src/lib/party/party.types";
import { ready } from "./support";

/**
 * One screenshot per party game, part way through, into public/art/games/ —
 * the picture on its front door, its rules page, its family's card and every
 * list that names it. Run on purpose with `pnpm screenshots:party`, which cuts
 * the thumbnail and writes the stamp after it; not part of the ordinary
 * suite, because it writes files into the repo.
 *
 * A fixed game rather than one played on the day: the same picture comes out
 * every time the board's drawing changes and the stamp says it must be
 * re-taken. The game is put where the table keeps one (this browser's
 * storage) and the table opened on it, as a player coming back to it would.
 */
const OUT = "public/art/games";

/** Where the table keeps its game: `DOTS_STORAGE_KEY`, which a spec cannot import from a client module. */
const DOTS_KEPT = "itsutsu.dotsAndBoxes";

const SCENES: { kind: PartyKind; stored: string; key: string }[] = [
  {
    // Three players on 4×4, twenty-seven of forty lines in: seven boxes closed, in all three colours, and the last line in its drawer's.
    kind: "dotsAndBoxes",
    key: DOTS_KEPT,
    stored: encodeDots(replayDots(4, ["", "", ""], 0, [5, 36, 16, 31, 30, 14, 20, 15, 7, 6, 28, 19, 35, 26, 12, 10, 34, 4, 33, 29, 32, 23, 27, 0, 8, 11, 9])!),
  },
];

test.describe("party game screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");

  for (const scene of SCENES) {
    test(scene.kind, async ({ page }) => {
      mkdirSync(OUT, { recursive: true });
      await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [scene.key, scene.stored]);
      await page.goto(`/games/${PARTY_SLUGS[scene.kind]}/pass-and-play`);
      await ready(page, "dots-game");
      await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "playing");
      // The board a member who never chose one sees: the picture is of the site's own wood, never an evening's choice.
      const surface = page.getByTestId("board-surface").first();
      await expect(surface).toHaveAttribute("data-surface", "Kaya");
      await page.mouse.move(0, 0);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      // The board in its wood and nothing round it, as a game's picture is taken (game-screenshots.spec.ts).
      await surface.screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
    });
  }
});
