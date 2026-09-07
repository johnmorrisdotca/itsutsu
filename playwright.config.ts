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
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `WEB_PORT=${PORT} pnpm dev`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
