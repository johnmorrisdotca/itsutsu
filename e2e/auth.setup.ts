import { expect, request as playwrightRequest, test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

import { ADMIN_STATE, EMBED_TOKEN_FILE, PLAYER_STATE } from "./support";
import { ensureMember } from "./members";
import { suiteOperator } from "./operator";
import {
  clearAbandonedSeats,
  clearAnonymousGames,
  clearSeededMembers,
  clearSeededRatings,
  clearSuiteGames,
} from "./tidy";

/**
 * Signs in once and saves the cookies for every other spec.
 *
 * The suite authenticates for real rather than switching the gate off, because
 * a gate that is never exercised by the tests is a gate nobody would notice
 * breaking. `e2e/gate.spec.ts` is the exception: it deliberately runs with no
 * stored session.
 */

/*
 * Who the suite signs in as: a test identity, never a real person's account.
 * Asked first, at load, so a misconfigured run stops with the fix in its
 * message before the sweep below or anything else has touched the database —
 * see e2e/operator.ts. It also loads .env, which the token below needs.
 */
const OPERATOR = suiteOperator();
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
   * Ratings before members for the same reason: a rating row is found by the
   * member it is anchored to.
   */
  const games = await clearSuiteGames();
  if (games > 0) console.log(`Cleared ${games} game${games === 1 ? "" : "s"} a previous run left unfinished.`);
  const loose = await clearAnonymousGames();
  if (loose > 0) console.log(`Cleared ${loose} game${loose === 1 ? "" : "s"} with nobody on either seat.`);
  const gone = await clearAbandonedSeats();
  if (gone > 0) console.log(`Cleared ${gone} abandoned open seat${gone === 1 ? "" : "s"}.`);
  const ratings = await clearSeededRatings();
  if (ratings > 0) console.log(`Cleared ${ratings} rating record${ratings === 1 ? "" : "s"} a previous run's members earned.`);
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
   * database held a real row for the address the suite used to sign in as —
   * the owner's own. The first run on a fresh database cost twenty-odd
   * failures across files testing something else entirely, and the honest
   * reading is that the suite was asserting things about a row no fixture had
   * made.
   *
   * The row is the suite's own now, stamped as such, so the sweep above took
   * last run's away and this makes a fresh one: no profile, zone, preferences
   * or record carried over from anything an earlier run did as the operator.
   */
  await ensureMember(OPERATOR);

  const signIn = await request.post("/api/session", {
    data: { kind: "admin", email: OPERATOR.email, token: TOKEN },
  });
  expect(
    signIn.ok(),
    `operator sign-in as ${OPERATOR.email} answered ${signIn.status()} — the dev server must list it in ` +
      "ADMIN_EMAILS and share this .env's ADMIN_TOKEN; restart it after editing .env",
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
