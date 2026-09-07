import { expect, request as playwrightRequest, test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

import { ADMIN_STATE, EMBED_TOKEN_FILE, PLAYER_STATE } from "./support";

/**
 * Signs in once and saves the cookies for every other spec.
 *
 * The suite authenticates for real rather than switching the gate off, because
 * a gate that is never exercised by the tests is a gate nobody would notice
 * breaking. `e2e/gate.spec.ts` is the exception: it deliberately runs with no
 * stored session.
 */
const EMAIL = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "john@spxis.com";
const TOKEN = process.env.ADMIN_TOKEN ?? "local-operator-token";

setup("sign in as the operator, and mint a player invite", async ({ request, baseURL }) => {
  mkdirSync(".auth", { recursive: true });

  const signIn = await request.post("/api/session", {
    data: { kind: "admin", email: EMAIL, token: TOKEN },
  });
  expect(
    signIn.ok(),
    "operator sign-in failed — is ADMIN_EMAILS/ADMIN_TOKEN set in .env?",
  ).toBe(true);
  await request.storageState({ path: ADMIN_STATE });

  // A separate browser identity that holds an invite but no operator rights.
  const minted = await request.post("/api/invites", {
    data: { note: "playwright" },
  });
  expect(minted.status()).toBe(201);
  const { code } = (await minted.json()) as { code: string };

  const player = await playwrightRequest.newContext({ baseURL });
  /*
   * The redeem limiter counts per address, and every spec here shares one —
   * including gate.spec.ts, which exhausts the bucket on purpose. So a 429
   * during setup means "wait for the window", not "the code is wrong".
   */
  let redeemed = await player.post("/api/session", {
    data: { kind: "invite", code },
  });
  if (redeemed.status() === 429) {
    await new Promise((resolve) => setTimeout(resolve, 61_000));
    redeemed = await player.post("/api/session", { data: { kind: "invite", code } });
  }
  expect(
    redeemed.ok(),
    `invite redemption failed with ${redeemed.status()}`,
  ).toBe(true);
  await player.storageState({ path: PLAYER_STATE });
  await player.dispose();

  // An embed token for the embed specs, which run with no session at all.
  const embed = await request.post("/api/embed-tokens", {
    data: { label: "playwright", days: 1 },
  });
  expect(embed.status()).toBe(201);
  const { token: embedToken } = (await embed.json()) as { token: string };
  writeFileSync(EMBED_TOKEN_FILE, JSON.stringify({ token: embedToken }));
});
