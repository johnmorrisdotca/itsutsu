import { expect, request as playwrightRequest, test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

import { ADMIN_STATE, EMBED_TOKEN_FILE, PLAYER_STATE } from "./support";
import { ensureMember } from "./members";
import { clearAbandonedSeats, clearAnonymousGames, clearSeededMembers, clearSuiteGames } from "./tidy";

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

/*
 * Before anything else, take down the seats an earlier run left standing.
 * They are why the lobby specs fail on each other: a seat already waiting
 * means "Post the seat" is never offered, and two of them under one name make
 * a row match twice. It only ever runs against a database on this machine —
 * see e2e/tidy.ts, where that is the whole point of the file.
 */
setup("clear what the last run left behind", async () => {
  /*
   * Games before members: a seat is a plain id with no foreign key behind it,
   * so clearing the members first would leave their games unattributable and
   * therefore unclearable — which is how eight thousand of them accumulated.
   */
  const games = await clearSuiteGames();
  if (games > 0) console.log(`Cleared ${games} game${games === 1 ? "" : "s"} a previous run left unfinished.`);
  const loose = await clearAnonymousGames();
  if (loose > 0) console.log(`Cleared ${loose} game${loose === 1 ? "" : "s"} with nobody on either seat.`);
  const gone = await clearAbandonedSeats();
  if (gone > 0) console.log(`Cleared ${gone} abandoned open seat${gone === 1 ? "" : "s"}.`);
  const members = await clearSeededMembers();
  if (members > 0) console.log(`Cleared ${members} member${members === 1 ? "" : "s"} a previous run invented.`);
});

setup("sign in as the operator, and mint a player invite", async ({ request, baseURL }) => {
  mkdirSync(".auth", { recursive: true });

  /*
   * The operator has to BE a member, not merely hold an operator session.
   *
   * Signing in below mints a session and nothing else — a member is something
   * Google makes, and `touchMember` will not invent one. So on a database
   * where this address has never signed in with Google, every route that asks
   * `currentMemberId()` answers 401 to the operator: challenging somebody,
   * taking a seat, reading your own record, being badged on your own row.
   *
   * It has always been true and never showed, because the shared development
   * database has held a real row for the operator's address for months. The
   * first run on a fresh database cost twenty-odd failures across files
   * testing something else entirely, and the honest reading is that the suite
   * was asserting things about a row no fixture had made.
   *
   * Create-only — see `ensureMember`. The operator's address on a developer's
   * machine is a real account with a real name on it.
   */
  await ensureMember({ email: EMAIL, name: "Operator" });

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
