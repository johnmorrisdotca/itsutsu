/**
 * Mints an embed token from the command line.
 *
 * Prints the whole iframe snippet, since that is what gets pasted into the
 * host page. No database: an embed token carries its own proof so that
 * `proxy.ts` can check it on the Edge runtime, where Prisma cannot run.
 *
 *   pnpm embed-token umakuma
 *   pnpm embed-token umakuma 90 https://itsutsu.com data
 */
import { signEmbedToken } from "../src/lib/auth/embedToken.ts";

const label = process.argv[2];
const days = Number(process.argv[3] ?? 365);
const site = process.argv[4] ?? "https://itsutsu.com";
// "data" also lets the embed read the summary endpoint; "board" is the board alone.
const scope = process.argv[5] === "data" ? "data" : "board";

if (!label) {
  console.error("Usage: pnpm embed-token <label> [days] [site-url]");
  process.exit(1);
}

const token = await signEmbedToken(
  label,
  Number.isFinite(days) ? days : 365,
  scope,
);
if (token === null) {
  console.error("No AUTH_SECRET set, so no token can be signed.");
  process.exit(1);
}

const url = new URL("/embed", site);
url.searchParams.set("token", token);
if (scope === "data") url.searchParams.set("stats", "1");

console.log(`\n  <iframe src="${url.toString()}"`);
console.log(`          style="border:0;width:100%;height:640px"`);
console.log(`          title="Itsutsu"></iframe>\n`);
console.log(`  label   ${label}`);
console.log(`  scope   ${scope}`);
console.log(`  expires in ${days} days`);
console.log(`  the host origin must also be listed in EMBED_ALLOWED_ORIGINS\n`);
