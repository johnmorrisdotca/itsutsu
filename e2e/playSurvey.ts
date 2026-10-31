import { expect, type Page } from "@playwright/test";

import { CASUAL_SLUGS, HOUSEKI_SLUGS } from "../src/lib/gomoku/slugs";
import { freshPuzzleSeed, ready } from "./support";

/**
 * EVERY PLAY THE SITE HAS, AND HOW TO REACH IT THE WAY A READER DOES.
 *
 * Every board game's kind of play (the practice board, a live game), every
 * puzzle with an address of its own, and every party and card table. Two
 * surveys walk it: `bare-board.spec.ts` (just the board fits the window) and
 * `language-steady.spec.ts` (nothing moves when the language does).
 * `bareSurvey.coverage.test.ts` holds the list to the catalogue, so a new game
 * that joins it joins both.
 */
export type Survey = {
  name: string;
  open: (page: Page) => Promise<void>;
  /** A move made inside the modal that brings up what a play shows under its board mid-move, measured again after it. */
  then?: (page: Page) => Promise<void>;
  /** A game already on the list, again at a board that tests the modal's fit: its words are the ones the first entry showed. */
  again?: true;
};

/** A pass-and-play table, started from its set-up by the start button it names. */
function table(slug: string, start: string): Survey {
  return {
    name: `/games/${slug}/pass-and-play`,
    open: async (page) => {
      await page.goto(`/games/${slug}/pass-and-play`);
      await ready(page, "board-scaling");
      await page.getByTestId(start).click();
      await expect(page.locator("[data-bare-board]").first()).toBeVisible();
    },
  };
}

/** Gunjin's table started from its set-up, then taken through the hand-overs to the screen named: arranging a side, or moving. */
function gunjinThen(name: string, steps: (page: Page) => Promise<void>): Survey {
  return {
    name: `/games/gunjin/pass-and-play, ${name}`,
    open: async (page) => {
      await page.goto("/games/gunjin/pass-and-play");
      await ready(page, "board-scaling");
      await page.getByTestId("gunjin-start").click();
      await steps(page);
    },
  };
}

/** A puzzle's solve, at the size and level its address asks for or its own. */
function puzzle(slug: string, query = ""): Survey {
  return {
    name: `/games/${slug}/play${query === "" ? "" : `?${query}`}`,
    open: async (page) => {
      await page.goto(`/games/${slug}/play?${query === "" ? "" : `${query}&`}seed=${freshPuzzleSeed()}`);
      await ready(page, "puzzle-play");
    },
  };
}

/** A casual game, opened at its third level: the board in the page's own column, with its result and presses below it. */
function casual(slug: string): Survey {
  return {
    name: `/games/${slug}/play`,
    open: async (page) => {
      await page.goto(`/games/${slug}/play?level=3`);
      await ready(page, "casual-game");
      await expect(page.locator('[data-testid="casual-board"][data-ready="true"] canvas')).toBeVisible();
    },
  };
}

/** A Houseki game, opened at its fourth level: the board in the page's own column, with its controls and its result below it. */
function houseki(slug: string): Survey {
  return {
    name: `/games/${slug}/play`,
    open: async (page) => {
      await page.goto(`/games/${slug}/play?level=4`);
      await ready(page, "houseki-game");
      await expect(page.locator('[data-testid="houseki-well"]')).toBeVisible();
    },
  };
}

const SURVEYED_PUZZLES = [
  "number-place",
  "hidden-stones",
  "more-or-less",
  "jigsaw",
  "diagonal",
  "sum-cages",
  "towers",
  "black-and-white",
  "gomoji",
  "kumimoji",
  "koushi",
  "bridges",
  "picture-logic",
  "solitaire",
  "freecell",
  "spider",
  "mahjong",
  "cube",
  "suido",
  "shikaku",
  "akari",
  "loop",
  "hitori",
  "cross-sums",
  "regions",
  "jirai",
  "hitofude",
  "kuniate",
  "hachinosu",
] as const;

/** The same game again, at a board that tests the modal's fit. */
const again = (survey: Survey): Survey => ({ ...survey, again: true });

/** The list. `track` is told every game on the server a play makes, for a spec to take away (`gamesMade`). */
export function surveyOfPlays(track: (id: string) => string): Survey[] {
  return [
    {
      name: "the practice board",
      open: async (page) => {
        await page.goto("/games/gomoku/play");
        await ready(page, "game-view");
      },
    },
    {
      name: "a 19×19 practice board",
      again: true,
      open: async (page) => {
        await page.goto("/games/go/play");
        await ready(page, "game-view");
      },
    },
    {
      name: "a live game",
      open: async (page) => {
        const made = await page.request.post("/api/games/live", { data: { size: 15 } });
        expect(made.status(), await made.text()).toBe(201);
        const game = (await made.json()) as { id: string; blackToken: string };
        track(game.id);
        await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
        await ready(page, "shared-game");
      },
      // A stone placed: the row that confirms or takes it back comes up under the board.
      then: async (page) => {
        await page.getByRole("button", { name: /^H8, empty$/ }).click();
      },
    },
    ...SURVEYED_PUZZLES.map((slug) => puzzle(slug)),
    again(puzzle("number-place", "size=16&level=easy")),
    // The Colossus, 25×25 (2026-10-05), and Jirai's Huge field, 32×32: 625 and 1,024 squares a desk's window has to hold in the modal with nothing to scroll. On a desk they open whole.
    again(puzzle("number-place", "size=25&level=easy")),
    again(puzzle("jirai", "size=32&level=easy")),
    // Bridges' biggest, 25×25 (2026-10-05): opens at twice the box, so the empty-column measure is taken after Fit, with the whole board in view.
    {
      ...again(puzzle("bridges", "size=25&level=medium")),
      then: async (page) => {
        await page.getByTestId("bridges-fit").click();
        await expect(page.getByTestId("bridges-viewport")).toHaveAttribute("data-zoom", "1.00");
      },
    },
    // Picture logic's biggest, 50×50 (2026-10-05): a hundred lines of clues, which the modal has to hold with nothing to scroll. It opens zoomed, three times the width of its box, so the empty-column measure is taken after Fit, with the whole board in view.
    {
      ...again(puzzle("picture-logic", "size=50&level=medium")),
      then: async (page) => {
        await page.getByTestId("picture-fit").click();
        await expect(page.getByTestId("picture-viewport")).toHaveAttribute("data-zoom", "1.00");
      },
    },
    // The Cube's biggest, the 7×7 (2026-10-05): 294 stickers a cube's face-on drawing has to hold with nothing to scroll and no empty column.
    again(puzzle("cube", "size=7&level=medium")),
    // Mahjong's mega layouts (Jarajara 1.6.0, 2026-10-05): the Wall's 288 tiles and the Palace's 576, wider than tall and looked at through the zoom, so the modal has to hold them with nothing to scroll and no empty column.
    again(puzzle("mahjong", "size=20&level=medium")),
    again(puzzle("mahjong", "size=26&level=medium")),
    // Tsunagi's levels are fixed boards: its first, as a new player meets it.
    { name: "/games/tsunagi/play", open: async (page) => {
      await page.goto("/games/tsunagi/play?size=4&level=easy&seed=6");
      await ready(page, "puzzle-play");
    } },
    // And its biggest, 15×15 (Tsunagi 1.2.0): sixteen lines on a board a desk's window has to hold with nothing to scroll.
    { name: "/games/tsunagi/play at 15×15", again: true, open: async (page) => {
      await page.goto("/games/tsunagi/play?size=15&seed=1");
      await ready(page, "puzzle-play");
    } },
    // And the three boards of Tsunagi 1.5.0: 30×30, whose forty or more lines must fit the modal at both desk sizes, and a board with portals, whose rings and link are drawn inside it.
    { name: "/games/tsunagi/play at 30×30", again: true, open: async (page) => {
      await page.goto("/games/tsunagi/play?size=30&seed=1");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/tsunagi/play with portals", again: true, open: async (page) => {
      await page.goto("/games/tsunagi/play?size=8&seed=1001");
      await ready(page, "puzzle-play");
    } },
    // Meikyuu's levels are fixed mazes: a small one, as a new player meets it, and a huge one, the biggest it comes in, which the modal has to hold with nothing to scroll.
    { name: "/games/meikyuu/play", open: async (page) => {
      await page.goto("/games/meikyuu/play?size=1&level=easy&seed=6");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/meikyuu/play at huge", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=4&level=hard&seed=256");
      await ready(page, "puzzle-play");
    } },
    // A tall maze (Meikyuu's second list, two columns to three rows), stood upright and then on its side, the biggest it comes in: the modal is as wide as the wood and nothing in it scrolls or is empty.
    { name: "/games/meikyuu/play tall", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=20x30&level=hard&seed=256");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/meikyuu/play tall lying down", again: true, open: async (page) => {
      await page.addInitScript(() => window.localStorage.setItem("itsutsu.meikyuu.wayup", "landscape"));
      await page.goto("/games/meikyuu/play?size=6x9&level=easy&seed=3");
      await ready(page, "puzzle-play");
    } },
    // Meikyuu's colossal mazes (about ten thousand cells, 2.1), the square box and the tall one, with the Stone press and its count among the presses: the modal still holds them with nothing to scroll or empty.
    { name: "/games/meikyuu/play colossal", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=5&level=hard&seed=128");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/meikyuu/play colossal tall", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=64x96&level=hard&seed=128");
      await ready(page, "puzzle-play");
    } },
    // A maze over a solid (Meikyuu 2.2): the smallest, a cube, and the biggest, an icosahedron of 720 cells, with the turn pad and Face me among the presses: the modal holds them with nothing to scroll or empty.
    { name: "/games/meikyuu/play over a cube", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=cube-small&level=easy&seed=6");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/meikyuu/play over an icosahedron", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=icosahedron-large&level=hard&seed=64");
      await ready(page, "puzzle-play");
    } },
    // And the biggest of the eighteen (package 3.1): a colossal heart of about 3,900 cells, a solid whose parts can hide parts, painted from the back.
    { name: "/games/meikyuu/play over a colossal heart", again: true, open: async (page) => {
      await page.goto("/games/meikyuu/play?size=heart-colossal&level=hard&seed=64");
      await ready(page, "puzzle-play");
    } },
    // Tobiishi's levels are fixed boards: its first, as a new player meets it, and the tall board at its longest, which is the one that has to be laid out by its height (a wide one is laid out by its width).
    { name: "/games/tobiishi/play", open: async (page) => {
      await page.goto("/games/tobiishi/play?size=3&level=easy&seed=1");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/tobiishi/play at the tall board", again: true, open: async (page) => {
      await page.goto("/games/tobiishi/play?size=9&level=hard&seed=25");
      await ready(page, "puzzle-play");
    } },
    // Suido's huge levels (the 28×28 and the long 20×50) are zoomed and moved about: the modal holds the board and its three buttons with nothing to scroll.
    { name: "/games/suido/play at 28×28", again: true, open: async (page) => {
      await page.goto("/games/suido/play?size=28&number=1");
      await ready(page, "puzzle-play");
    } },
    { name: "/games/suido/play at 20×50", again: true, open: async (page) => {
      await page.goto("/games/suido/play?size=20x50&number=1");
      await ready(page, "puzzle-play");
    } },
    table("dots-and-boxes", "dots-start"),
    table("superghost", "ghost-start"),
    table("mancala", "mancala-start"),
    table("tenka", "tenka-start"),
    table("mexican-train", "train-start"),
    table("yacht", "yacht-start"),
    table("pachisi", "pachisi-start"),
    table("dice-war", "dicewar-start"),
    table("hearts", "cards-start"),
    table("spades", "cards-start"),
    table("euchre", "cards-start"),
    table("cribbage", "cards-start"),
    table("oh-hell", "cards-start"),
    table("war", "cards-start"),
    table("big-two", "cards-start"),
    table("president", "cards-start"),
    table("go-fish", "cards-start"),
    table("crazy-eights", "cards-start"),
    table("hitotsu", "hitotsu-start"),
    // The cover first (a hand-over is a play too), then each side arranging, then the game moving.
    table("gunjin", "gunjin-start"),
    gunjinThen("arranging", async (page) => {
      await page.getByTestId("gunjin-pass-ready").click();
      await expect(page.getByTestId("gunjin-arrange")).toBeVisible();
    }),
    gunjinThen("moving", async (page) => {
      await page.getByTestId("gunjin-pass-ready").click();
      await page.getByTestId("gunjin-finish").click();
      await page.getByTestId("gunjin-pass-ready").click();
      await page.getByTestId("gunjin-finish").click();
      await page.getByTestId("gunjin-pass-ready").click();
      await expect(page.getByTestId("gunjin-moving")).toBeVisible();
    }),
    table("backgammon", "sugoroku-start"),
    table("nackgammon", "sugoroku-start"),
    table("long-gammon", "sugoroku-start"),
    table("hypergammon", "sugoroku-start"),
    table("backgammon-race", "sugoroku-start"),
    table("anti-backgammon", "sugoroku-start"),
    table("tabula", "sugoroku-start"),
    table("gin-rummy", "cards-start"),
    table("chinese-checkers", "party-start"),
    table("halma", "party-start"),
    table("block-five", "blocks-start"),
    table("go", "pairgo-start"),
    ...Object.values(CASUAL_SLUGS).map(casual),
    ...Object.values(HOUSEKI_SLUGS).map(houseki),
  ];
}
