import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { PARTY_SLUGS } from "../src/lib/gomoku/slugs";
import { encodeDots, replayDots } from "../src/lib/party/dotsAndBoxes/dotsAndBoxes";
import { encodeGhost, replayGhost } from "../src/lib/party/superghost/superghost";
import { encodeMancala, replayMancala } from "../src/lib/party/mancala/mancala";
import type { PartyKind } from "../src/lib/party/party.types";
import { TENKA_PHASES } from "../src/lib/party/tenka/tenka.constants";
import { playTenka } from "../src/lib/party/tenka/tenka";
import type { TenkaGame } from "../src/lib/party/tenka/tenka.types";
import { encodeTenka } from "../src/lib/party/tenka/tenkaKeep";
import { sensibleTenkaMove } from "../src/lib/party/tenka/tenkaPolicy";
import { startTenka } from "../src/lib/party/tenka/tenkaStart";
import { playTrain, startTrain } from "../src/lib/party/mexicanTrain/mexicanTrain";
import { encodeTrain } from "../src/lib/party/mexicanTrain/trainCodec";
import { computerMove } from "../src/lib/party/mexicanTrain/trainComputer";
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

/** Where each table keeps its game: `DOTS_STORAGE_KEY`, `GHOST_STORAGE_KEY` and `MANCALA_STORAGE_KEY`, which a spec cannot import from a client module. */
const DOTS_KEPT = "itsutsu.dotsAndBoxes";
const GHOST_KEPT = "itsutsu.superghost";
const MANCALA_KEPT = "itsutsu.mancala";
/** And Tenka's: `TENKA_STORAGE_KEY`. */
const TENKA_KEPT = "itsutsu.tenka";
/** And Mexican Train's: `TRAIN_STORAGE_KEY`. */
const TRAIN_KEPT = "itsutsu.mexicanTrain";

/**
 * Four people on a double-twelve set, thirty moves into the first round, each
 * move the computer player's choice from a fixed seed: every train started,
 * some past the tiles a row shows, and the Mexican Train begun. Four people
 * rather than computers, so the table waits on the picture rather than
 * playing on while it is taken.
 */
function trainScene(): string {
  let game = startTrain(12, ["Ann", "Ben", "Cy", "Dee"], 20260929, undefined, [false, false, false, false])!;
  for (let move = 0; move < 30; move += 1) game = playTrain(game, computerMove(game))!;
  return encodeTrain(game);
}

/**
 * Four players, five rounds into a game of the whole world, played by the
 * gate's sensible player from a fixed seed and a fixed random: every colour on
 * the map, armies piled on the fronts, stopped at the start of a turn.
 */
function tenkaScene(): string {
  let seed = 11;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  let game: TenkaGame = startTenka(60, ["", "", "", ""], 20260928)!;
  while (game.round < 6 || game.phase !== TENKA_PHASES.reinforce) game = playTenka(game, sensibleTenkaMove(game, random))!;
  return encodeTenka(game);
}

/** A scene: the game kept, the table's test id, and what is photographed — the board in its wood, or the letters the table watches. */
const SCENES: { kind: PartyKind; stored: string; key: string; table: string; shot: string; width?: number; scale?: number }[] = [
  {
    // Three players on 4×4, twenty-seven of forty lines in: seven boxes closed, in all three colours, and the last line in its drawer's.
    kind: "dotsAndBoxes",
    key: DOTS_KEPT,
    table: "dots-game",
    shot: "board-surface",
    stored: encodeDots(replayDots(4, ["", "", ""], 0, [5, 36, 16, 31, 30, 14, 20, 15, 7, 6, 28, 19, 35, 26, 12, 10, 34, 4, 33, 29, 32, 23, 27, 0, 8, 11, 9])!),
  },
  {
    // Four players in English, three rounds lost — CATS spelled, a bluff caught, PLATE named — and RCHESTRATIO on the
    // table, built out from S at both ends, with one word left that it can still become.
    // At a phone's width, where the letters take two lines and the picture comes out nearly square, as a thumbnail wants.
    kind: "superghost",
    key: GHOST_KEPT,
    table: "ghost-game",
    shot: "ghost-stage",
    width: 360,
    // Drawn at twice the pixels, so the picture is as sharp as a board's, which is photographed wider.
    scale: 2,
    stored: encodeGhost(replayGhost(4, ["Ann", "Ben", "Cy", "Dee"], "english", 0, [">c>a>t>s!", ">x>q?#", ">p>l>a?=plate."], ">s<e<h<c<r>t>r>a>t>i>o")!),
  },
  {
    // Kalah, sixteen sowings in, Ann to sow: seeds in every store and most pits, a pit of ten, and Ben's capture just made.
    kind: "mancala",
    key: MANCALA_KEPT,
    table: "mancala-game",
    shot: "board-surface",
    stored: encodeMancala(replayMancala(14, ["Ann", "Ben"], 0, [5, 12, 3, 8, 10, 2, 12, 5, 9, 4, 10, 5, 1, 7, 1, 11])!),
  },
  {
    // Four players five rounds into the whole world, every colour on the map, at the start of a turn.
    kind: "tenka",
    key: TENKA_KEPT,
    table: "tenka-game",
    shot: "board-surface",
    stored: tenkaScene(),
  },
  {
    // Four at a double-twelve table, thirty moves into the first round: the hub, every train under way, the Mexican Train begun.
    kind: "mexicanTrain",
    key: TRAIN_KEPT,
    table: "train-game",
    shot: "board-surface",
    stored: trainScene(),
  },
];

test.describe("party game screenshots", () => {
  test.skip(process.env.GAME_SCREENSHOTS !== "1", "Set GAME_SCREENSHOTS=1 to write them.");

  for (const scene of SCENES) {
    test.describe(scene.kind, () => {
      test.use({ deviceScaleFactor: scene.scale ?? 1 });
      test("its picture", async ({ page }) => {
        mkdirSync(OUT, { recursive: true });
        if (scene.width !== undefined) await page.setViewportSize({ width: scene.width, height: 800 });
        await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [scene.key, scene.stored]);
        await page.goto(`/games/${PARTY_SLUGS[scene.kind]}/pass-and-play`);
        await ready(page, scene.table);
        await expect(page.getByTestId(scene.table)).not.toHaveAttribute("data-state", "finished");
        const surface = page.getByTestId(scene.shot).first();
        // The board a member who never chose one sees: the picture is of the site's own wood, never an evening's choice.
        if (scene.shot === "board-surface") await expect(surface).toHaveAttribute("data-surface", "Kaya");
        // The ways of looking round a big board (Fit, the arrows) are for the player, not the picture.
        await page.addStyleTag({ content: '[data-testid$="-fit"], [data-testid$="-arrows"] { visibility: hidden !important; }' });
        await page.mouse.move(0, 0);
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        // The board in its wood, or the letters the table watches, and nothing round it, as a game's picture is taken (game-screenshots.spec.ts).
        await surface.screenshot({ path: `${OUT}/${scene.kind}.jpg`, type: "jpeg", quality: 82 });
      });
    });
  }
});
