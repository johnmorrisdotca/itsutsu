import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a real dev server and a real database, because
 * the things worth testing here — a game being recorded, then read back and
 * replayed — cross both. `reuseExistingServer` keeps a dev server you already
 * have running rather than fighting it for the port.
 */
const PORT = Number(process.env.WEB_PORT ?? 6600);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  /*
   * TRUE FOR THE SHARDS' SAKE, NOT FOR PARALLEL WORKERS — there is still one
   * worker, so nothing here ever runs at the same time as anything else.
   *
   * What it changes is how `--shard` divides the suite. With it off, Playwright
   * hands out whole FILES, evened by count, and files differ in length: the
   * first eight-shard run took 4.5 minutes on its shortest shard and 8.6 on its
   * longest, and the longest is what a deploy waits for (AGENTS.md, "Deploys
   * Are Fast By Design"). With it on, tests are handed out one by one, so the
   * shards come out even. A file that must stay together says so with
   * `test.describe.configure({ mode: "serial" })`, which Playwright honours
   * whatever this says; a file with a `beforeAll` runs it on each shard its
   * tests land on, against that shard's own fresh database.
   */
  fullyParallel: true,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : [["list"]],
  // Generous: auth setup may wait out a rate-limit window.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    /*
     * The zone a test browser reports is a declared fact, not the machine's.
     * Left to the laptop, a page opened as a member whose zone is only a
     * country's guess had `DeviceTimeZone` write wherever the developer
     * happened to be onto that account — which is how a test Chromium moved a
     * real row from Asia/Tokyo to America/Vancouver. UTC is what CI's runner
     * reports anyway. A spec about what a device says sets its own on the
     * context it opens (`xp-earning`, `game-pages-hydration`), which wins.
     */
    timezoneId: "UTC",
  },
  projects: [
    // Signs in once; every other project reuses the cookies it saves.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: ".auth/admin.json" },
      dependencies: ["setup"],
      testIgnore: /(gate|embed)\.spec\.ts/,
    },
    {
      // The gate is only meaningful without a session, so this one has none.
      name: "gate",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(gate|embed)\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `WEB_PORT=${PORT} pnpm dev`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
