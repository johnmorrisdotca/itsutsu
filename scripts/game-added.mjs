/**
 * Writes `src/lib/catalogue/gameAdded.data.ts`: the day each game arrived here.
 *
 * John, 2026-09-26: "Everyone feed should post a message when a new game is
 * introduced to the site. We can make it so that one message per day for
 * games... so sometimes we announce multi games per day in one message."
 *
 * A game arrives with its picture — the New Game Gate refuses one without
 * `public/art/games/<key>.jpg` — so the day git first added that picture is
 * the day the game joined the catalogue. That is read from history rather than
 * kept by hand, because a date typed from memory is a guess and git's is a
 * record. A picture not committed yet is a game arriving now, so it is dated
 * today; run this again after the commit and nothing changes.
 *
 * The keys come from the pictures, not from the catalogue's source, because a
 * plain node script cannot import the catalogue (its modules import each other
 * without extensions). `gameAdded.coverage.test.ts` is what holds the two
 * together: it fails the build for any game with no date here.
 *
 *   pnpm games:added
 */
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";

const ART = "public/art/games";
const OUT = "src/lib/catalogue/gameAdded.data.ts";

/** Today, in the machine's own zone, as the data file writes a day. */
function today() {
  const now = new Date();
  const two = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

/** The day git first added one picture, or null when it has never been committed. */
function firstAdded(file) {
  const out = execFileSync("git", ["log", "--diff-filter=A", "--follow", "--format=%ad", "--date=short", "--", file], {
    encoding: "utf8",
  });
  const days = out.split("\n").map((line) => line.trim()).filter((line) => line !== "");
  return days.at(-1) ?? null;
}

const keys = readdirSync(ART)
  .filter((name) => name.endsWith(".jpg"))
  .map((name) => name.slice(0, -".jpg".length))
  .sort((a, b) => a.localeCompare(b));

const fallback = today();
const rows = keys.map((key) => {
  const day = firstAdded(`${ART}/${key}.jpg`);
  return { key, day: day ?? fallback, committed: day !== null };
});

writeFileSync(
  OUT,
  [
    'import type { GameKey } from "./gameKeys";',
    "",
    "/**",
    " * The day each game arrived on the site, as `YYYY-MM-DD`: the day git first",
    " * added its picture. The Everyone feed announces a day's new games in one",
    " * line (`feedAdded.ts`).",
    " *",
    " * WRITTEN BY `pnpm games:added`, NEVER BY HAND — see `scripts/game-added.mjs`.",
    " * A new game fails `gameAdded.coverage.test.ts` until it is dated here.",
    " */",
    "export const GAME_ADDED: Record<GameKey, string> = {",
    ...rows.map((row) => `  ${row.key}: "${row.day}",`),
    "};",
    "",
  ].join("\n"),
);

const uncommitted = rows.filter((row) => !row.committed).map((row) => row.key);
console.log(`${OUT}: ${rows.length} games dated.`);
if (uncommitted.length > 0) console.log(`Dated today, their pictures not committed yet: ${uncommitted.join(", ")}.`);
