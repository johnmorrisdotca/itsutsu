import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { IDLE_STOP_MS } from "../src/components/live/live.constants";
import { memberContext, removeMember } from "./members";
import { playAt, ready } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * HOW OFTEN AN OPEN BOARD ASKS THE SERVER, COUNTED RATHER THAN BELIEVED.
 *
 * John, 2026-09-15: "we have to stop doing things like that that will eat up
 * CPU time." A live board polled every two and a half seconds while it was
 * looked at, and every thirty while it was not, for an hour after the last
 * move. The cadence is held by a unit test (`pollCadence.test.ts`); this holds
 * what a real browser actually sends, which is the number the bill is made of.
 *
 * Time is the browser's own clock, installed and driven by the spec, so an
 * hour is an hour to the page and well under a minute to the runner.
 *
 * COUNTED IN THE PAGE, NOT FROM PLAYWRIGHT'S REQUEST EVENTS. The first version
 * counted events, and they arrive at the runner after `runFor` has already
 * returned — so the spec moved the clock on while an ask was still in flight,
 * the board scheduled its next ask from the later time, and a 2.5-second board
 * measured one ask in twelve seconds. So a wrapper around the page's `fetch`
 * counts an ask the instant it is made and holds it open until its answer has
 * been read, and the clock does not move again until the page has taken that
 * answer in. The network's own count is compared with it at the end.
 *
 * Each step of the clock can still run past the moment a poll fired by up to a
 * step, and the next poll is scheduled from where the step ended — so the
 * lower bounds below allow a step of drift per poll. `CADENCE_STEP_MS` makes
 * the steps finer for a measurement run; the default keeps the file quick.
 *
 * The page says what cadence it is on (`data-poll-every`), and the counts are
 * judged against that, because the suite's dev server runs with the relief
 * that keeps the two-seat specs quick (see `pollEvery`). The production number
 * itself is the unit test's to hold.
 *
 * A hidden tab is made hidden the way the page and SWR read it —
 * `visibilityState` and a `visibilitychange` — because a headless browser has
 * no second tab to put in front of this one. Everything else is done as a
 * reader does it: the button is pressed, the key is pressed, the stone is
 * clicked.
 *
 * IT BRINGS ITS OWN WORLD: two members nobody else has met and one game
 * between them, taken away after.
 */

const mine = gamesMade();
const under = namesPlayedUnder();
const SIZE = 9;
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const STEP = Number(process.env.CADENCE_STEP_MS ?? SECOND);

type Polls = { asked: number; inFlight: number };
type PollWindow = Window & { __polls: Polls };

type Board = {
  black: BrowserContext;
  white: BrowserContext;
  page: Page;
  game: { id: string; blackToken: string; whiteToken: string };
  emails: string[];
  /** The asks the network saw, as the runner heard of them. */
  network: () => number;
};

/** Counts every GET to the board's own address, from inside the page, before anything loads. */
async function countPolls(page: Page, path: string) {
  await page.addInitScript((ours) => {
    const polls: Polls = { asked: 0, inFlight: 0 };
    (window as unknown as PollWindow).__polls = polls;
    const real = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (method !== "GET" || url.pathname !== ours) return real(input, init);
      polls.asked += 1;
      polls.inFlight += 1;
      let open = true;
      const close = () => {
        if (!open) return;
        open = false;
        polls.inFlight -= 1;
      };
      return real(input, init).then(
        (response) => {
          if (!response.ok) {
            close();
            return response;
          }
          const read = response.json.bind(response);
          response.json = () => read().finally(close);
          return response;
        },
        (error: unknown) => {
          close();
          throw error;
        },
      );
    };
  }, path);
}

/**
 * Waits until no ask is open and the page has run what its answer started —
 * rendering it, and scheduling the next ask. Message-channel hops rather than a
 * timer, because every timer on this page is the fake clock's.
 */
async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const polls = (window as unknown as PollWindow).__polls;
        let hops = 4;
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          if (polls.inFlight > 0) hops = 4;
          else hops -= 1;
          if (hops === 0) resolve();
          else channel.port2.postMessage(0);
        };
        channel.port2.postMessage(0);
      }),
  );
}

async function asked(page: Page): Promise<number> {
  await settle(page);
  return page.evaluate(() => (window as unknown as PollWindow).__polls.asked);
}

/** Spends `ms` of the page's time in steps, letting every ask it makes be answered first. */
async function spend(page: Page, ms: number, step = STEP) {
  for (let spent = 0; spent < ms; spent += step) {
    await page.clock.runFor(step);
    await settle(page);
  }
}

/** Hidden or shown, as the page and SWR both read it. */
async function lookAway(page: Page, state: "hidden" | "visible") {
  await page.evaluate((to) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => to });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => to === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

/**
 * Black's board on a game where black has played E5 from somewhere else, so it
 * is waiting on white: the board a player leaves open while the other side
 * thinks. The clock is installed before the page loads and paused once the
 * board is listening.
 */
async function openWaitingBoard(browser: Browser, baseURL: string, label: string, opened = true): Promise<Board> {
  const stamp = `${Date.now().toString(36)}${label}`;
  const kuro = { email: `cadence-black-${stamp}@example.test`, name: under(`Kuro${stamp} Cadence`) };
  const shiro = { email: `cadence-white-${stamp}@example.test`, name: under(`Shiro${stamp} Cadence`) };
  const black = await memberContext(browser, baseURL, kuro);
  const white = await memberContext(browser, baseURL, shiro);
  const made = await black.request.post("/api/games/live", {
    data: { variant: "freestyle", size: SIZE, moveTimeMs: null, rated: false, blackName: kuro.name, whiteName: shiro.name },
  });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as Board["game"];
  mine(game.id);
  if (opened) {
    const first = await black.request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
    expect(first.status(), await first.text()).toBe(201);
  }

  const page = await black.newPage();
  const path = `/api/games/${game.id}`;
  await countPolls(page, path);
  let network = 0;
  page.on("request", (request) => {
    if (request.method() === "GET" && new URL(request.url()).pathname === path) network += 1;
  });
  await page.clock.install();
  await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
  await ready(page, "shared-game");
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + SECOND));
  return { black, white, page, game, emails: [kuro.email, shiro.email], network: () => network };
}

async function closeBoard(board: Board) {
  await board.black.close();
  await board.white.close();
  for (const email of board.emails) await removeMember(email);
}

/** The cadence the page says it is on, in milliseconds. */
async function pollEveryOn(page: Page): Promise<number> {
  return Number(await page.getByTestId("shared-game").getAttribute("data-poll-every"));
}

test.describe("how often an open board asks the server", () => {
  test.setTimeout(30 * MINUTE);

  test("a board being looked at asks at its cadence, stops once nothing has happened, and a press catches it up", async ({
    browser,
    baseURL,
  }) => {
    const board = await openWaitingBoard(browser, baseURL!, "v");
    try {
      const { page, game, white } = board;
      await spend(page, 3 * SECOND);
      const start = await asked(page);

      await spend(page, 60 * MINUTE);
      const hour = (await asked(page)) - start;
      console.log(`[cadence] one visible board, 60 minutes with nothing happening, ${STEP} ms steps: ${hour} requests`);

      // Stopped, and saying so: the presence the absences below are read after.
      await expect(page.getByTestId("live-paused")).toBeVisible();
      const every = await pollEveryOn(page);
      expect(every, "the board did not say what cadence it is on").toBeGreaterThan(0);
      expect.soft(hour, `asked more than an idle window of ${IDLE_STOP_MS} ms at ${every} ms allows`).toBeLessThanOrEqual(
        Math.ceil(IDLE_STOP_MS / every) + 1,
      );
      expect.soft(hour, "stopped before the idle window was up").toBeGreaterThanOrEqual(
        Math.floor(IDLE_STOP_MS / (every + STEP)) - 1,
      );

      // White moves while the board is asleep: it asks nothing, so it does not know.
      const asleep = await asked(page);
      const moved = await white.request.post(`/api/games/${game.id}/moves`, { data: { token: game.whiteToken, row: 3, col: 3 } });
      expect(moved.status(), await moved.text()).toBe(201);
      await spend(page, 10 * MINUTE, 5 * SECOND);
      expect(await asked(page), "a sleeping board went on asking").toBe(asleep);
      await expect(page.getByRole("button", { name: "D6, White stone" })).toHaveCount(0);

      // The reader presses the button the paused line offers: one ask, at once, with no clock moved.
      await page.getByTestId("live-paused").getByRole("button").click();
      await expect(page.getByRole("button", { name: "D6, White stone" })).toBeVisible();
      await expect(page.getByTestId("live-paused")).toHaveCount(0);
      const after = await asked(page);
      expect(after).toBe(asleep + 1);
      await expect.poll(board.network, "the page's count and the network's disagree").toBe(after);
    } finally {
      await closeBoard(board);
    }
  });

  test("a hidden tab asks nothing, and catches up the moment it is looked at again", async ({ browser, baseURL }) => {
    const board = await openWaitingBoard(browser, baseURL!, "h");
    try {
      const { page, game, white } = board;
      await spend(page, 3 * SECOND);

      /*
       * A SHORT LOOK AWAY, under the idle window, so nothing has gone to sleep
       * and the only thing that can bring the move in when the tab comes back is
       * SWR's `revalidateOnFocus`. The clock moves one millisecond, which fires
       * SWR's deferred focus handler and no poll: a board that caught up by
       * waiting for its interval would not show the stone.
       */
      await lookAway(page, "hidden");
      const hidden = await asked(page);
      const moved = await white.request.post(`/api/games/${game.id}/moves`, { data: { token: game.whiteToken, row: 3, col: 3 } });
      expect(moved.status(), await moved.text()).toBe(201);
      await spend(page, 2 * MINUTE);
      const shortHide = (await asked(page)) - hidden;
      console.log(`[cadence] one hidden tab, 2 minutes, ${STEP} ms steps: ${shortHide} requests`);

      await lookAway(page, "visible");
      await page.clock.runFor(1);
      await expect(page.getByRole("button", { name: "D6, White stone" })).toBeVisible();
      // Soft, so one run reports the short look away and the long one together.
      expect.soft(shortHide, "a hidden tab asked the server").toBe(0);
      expect.soft(await asked(page), "coming back asked more than once").toBe(hidden + shortHide + 1);

      // A LONG ONE: an hour in the background, and a wave from white meanwhile.
      await lookAway(page, "hidden");
      const away = await asked(page);
      const waved = await white.request.post(`/api/games/${game.id}/reactions`, {
        data: { token: game.whiteToken, emoji: "👏", moveNumber: 2 },
      });
      expect(waved.status(), await waved.text()).toBe(201);
      await spend(page, 60 * MINUTE, Math.max(STEP, 5 * SECOND));
      const hour = (await asked(page)) - away;
      console.log(`[cadence] one hidden tab, 60 minutes: ${hour} requests`);

      await lookAway(page, "visible");
      await page.clock.runFor(1);
      await expect(page.getByTestId("reaction-log")).toContainText("👏");
      expect.soft(hour, "a hidden tab asked the server").toBe(0);
      expect.soft(await asked(page), "coming back asked more than once").toBe(away + hour + 1);
    } finally {
      await closeBoard(board);
    }
  });

  test("a key pressed on a board gone to sleep catches it up", async ({ browser, baseURL }) => {
    const board = await openWaitingBoard(browser, baseURL!, "k");
    try {
      const { page, game, white } = board;
      await spend(page, IDLE_STOP_MS + MINUTE, 5 * SECOND);
      await expect(page.getByTestId("live-paused")).toBeVisible();

      const asleep = await asked(page);
      const moved = await white.request.post(`/api/games/${game.id}/moves`, { data: { token: game.whiteToken, row: 3, col: 3 } });
      expect(moved.status(), await moved.text()).toBe(201);
      await page.keyboard.press("Shift");
      await expect(page.getByRole("button", { name: "D6, White stone" })).toBeVisible();
      await expect(page.getByTestId("live-paused")).toHaveCount(0);
      expect(await asked(page)).toBe(asleep + 1);
    } finally {
      await closeBoard(board);
    }
  });

  test("a move of your own is taken from its answer, with no poll after it", async ({ browser, baseURL }) => {
    const board = await openWaitingBoard(browser, baseURL!, "m", false);
    try {
      const { page } = board;
      await spend(page, 3 * SECOND);
      const before = await asked(page);

      await playAt(page, SIZE, 4, 4);
      await expect(page.getByRole("button", { name: "E5, Black stone" })).toBeVisible();
      // The move's advance has had its say, so the page has finished answering the move.
      await expect(page.getByTestId("nothing-waiting")).toBeVisible();
      expect(await asked(page), "the board asked the server again after its own move").toBe(before);
    } finally {
      await closeBoard(board);
    }
  });
});
