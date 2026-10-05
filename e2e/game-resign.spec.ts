import { expect, test } from "@playwright/test";

import { CARD_GAME_RULES } from "../src/lib/cardGames/cardGameRules";
import { PARTY_SLUGS, GAME_SLUGS } from "../src/lib/gomoku/slugs";
import { encodeBlocksParty, startBlocksParty } from "../src/lib/gomoku/party/partyBlocks";
import { encodePartyGame, startPartyGame } from "../src/lib/gomoku/party/partyCheckers";
import { encodeHalmaParty, startHalmaParty } from "../src/lib/gomoku/party/partyHalma";
import { PARTY_RULES } from "../src/lib/party/partyRules";
import { PARTY_SPECS } from "../src/lib/party/party.constants";
import type { PartyKind } from "../src/lib/party/party.types";
import { ready } from "./support";

/**
 * RESIGN AT EVERY TABLE ROUND ONE DEVICE (`docs/plans/game-controls/README.md`):
 * the player to move resigns, after a question; at two seats the other wins, at
 * more the table ends where it stands with nobody the winner; the table opens
 * the same after a reload. Each table is put where it keeps its game (this
 * browser's storage) and opened, as a player coming back to it would.
 */
type Table = { name: string; slug: string; key: string; stored: string; table: string; prefix: string; seats: number };

const NAMES = ["Ann", "Ben", "Cy", "Dee"];

function ruled(kind: PartyKind, key: string, table: string, prefix: string, seats: number, size?: number): Table {
  const rules = PARTY_RULES[kind] as unknown as { start: (...args: unknown[]) => unknown; encode: (game: unknown) => string };
  const names = NAMES.slice(0, seats);
  const spec = PARTY_SPECS[kind];
  const game = rules.start(size ?? spec.defaultSize, names, "english", 20261002, names.map(() => false));
  return { name: `${kind} (${seats})`, slug: PARTY_SLUGS[kind], key, stored: rules.encode(game), table, prefix, seats };
}

function carded(kind: keyof typeof CARD_GAME_RULES, seats: number): Table {
  const rules = CARD_GAME_RULES[kind] as unknown as { start: (...args: unknown[]) => unknown; encode: (game: unknown) => string };
  const names = NAMES.slice(0, seats);
  const spec = PARTY_SPECS[kind];
  const game = rules.start(spec.defaultSize, names, undefined, 20261002, names.map(() => false));
  return { name: `${kind} (${seats})`, slug: PARTY_SLUGS[kind], key: `itsutsu.cards.${kind}`, stored: rules.encode(game), table: "cards-game", prefix: "cards", seats };
}

const TABLES: Table[] = [
  ruled("dotsAndBoxes", "itsutsu.dotsAndBoxes", "dots-game", "dots", 2),
  ruled("dotsAndBoxes", "itsutsu.dotsAndBoxes", "dots-game", "dots", 3),
  ruled("superghost", "itsutsu.superghost", "ghost-game", "ghost", 3),
  ruled("mancala", "itsutsu.mancala", "mancala-game", "mancala", 2),
  ruled("tenka", "itsutsu.tenka", "tenka-game", "tenka", 2),
  ruled("tenka", "itsutsu.tenka", "tenka-game", "tenka", 3),
  ruled("mexicanTrain", "itsutsu.mexicanTrain", "train-game", "train", 2),
  ruled("yacht", "itsutsu.yacht", "yacht-game", "yacht", 2),
  ruled("pachisi", "itsutsu.pachisi", "pachisi-game", "pachisi", 2),
  ruled("hitotsu", "itsutsu.hitotsu", "hitotsu-game", "hitotsu", 2),
  ruled("diceWar", "itsutsu.diceWar", "dicewar-game", "dicewar", 2),
  ruled("gunjin", "itsutsu.gunjin", "gunjin-game", "gunjin", 2),
  carded("war", 2),
  carded("hearts", 4),
  carded("crazyEights", 3),
  {
    name: "chineseCheckers (2)",
    slug: GAME_SLUGS.chineseCheckers,
    key: "itsutsu.partyCheckers",
    stored: encodePartyGame(startPartyGame(2, ["Ann", "Ben"])),
    table: "party-checkers",
    prefix: "party",
    seats: 2,
  },
  {
    name: "halma (4)",
    slug: GAME_SLUGS.halma,
    key: "itsutsu.partyHalma",
    stored: encodeHalmaParty(startHalmaParty(4, NAMES)),
    table: "party-halma",
    prefix: "party",
    seats: 4,
  },
  {
    name: "blockFive (4)",
    slug: GAME_SLUGS.blockFive,
    key: "itsutsu.partyBlocks",
    stored: encodeBlocksParty(startBlocksParty(NAMES)),
    table: "party-blocks",
    prefix: "blocks",
    seats: 4,
  },
];

for (const table of TABLES) {
  test(`${table.name}: Resign asks, ends the table, and is still there after a reload`, async ({ page }) => {
    await page.addInitScript(([key, value]) => {
      if (!window.sessionStorage.getItem("seeded")) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem("seeded", "1");
      }
    }, [table.key, table.stored]);
    await page.goto(`/games/${table.slug}/pass-and-play`);
    await ready(page, table.table);

    // The row under the board: Resign beside New game, and nothing said yet.
    await expect(page.getByTestId("game-resigned")).toHaveCount(0);
    await expect(page.getByTestId(`${table.prefix}-new`)).toBeVisible();
    // Asked first, in place; Keep playing takes it back.
    await page.getByTestId(`${table.prefix}-resign`).click();
    await expect(page.getByTestId(`${table.prefix}-resign-confirm`)).toContainText(table.seats === 2 ? "The other player wins" : "nobody the winner");
    await page.getByTestId(`${table.prefix}-resign-no`).click();
    await expect(page.getByTestId("game-resigned")).toHaveCount(0);

    await page.getByTestId(`${table.prefix}-resign`).click();
    await page.getByTestId(`${table.prefix}-resign-yes`).click();
    await expect(page.getByTestId("game-resigned")).toContainText("resigned.");
    await expect(page.getByTestId(`${table.prefix}-resign`)).toHaveCount(0);
    // The result is said where the game's own ending would be: the other seat wins at two, nobody at more.
    await expect(page.locator("main")).toContainText(table.seats === 2 ? /resigned\. \w+ wins\./ : "nobody the winner");
    const kept = await page.evaluate((key) => window.localStorage.getItem(key), table.key);
    expect(kept).toContain("~resigned:");

    // Kept as it ended.
    await page.reload();
    await ready(page, table.table);
    await expect(page.getByTestId("game-resigned")).toContainText("resigned.");
    await expect(page.getByTestId(`${table.prefix}-resign`)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  });
}
