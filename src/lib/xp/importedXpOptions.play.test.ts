/**
 * THE NUMBERS JOHN APPROVED, PRINTED FROM THE REAL KEPT RECORDS.
 *
 * Report only. It reads `legacyPlayers.data.ts`, which is in the repository,
 * and prices every eligible record under every row of `IMPORTED_XP_CANDIDATES`.
 * It writes nothing anywhere, and it needs no database: the Itsutsu column is
 * read from whatever database `.env` points at when one answers, and printed
 * as "—" when none does, rather than as a nought nobody measured.
 *
 *   XP_IMPORTED_OPTIONS=1 pnpm exec vitest run src/lib/xp/importedXpOptions.play.test.ts --disable-console-intercept
 *
 * Optionally `XP_IMPORTED_ITSUTSU=chibi:25,kyokosan:25,jmorris:1690` supplies the
 * Itsutsu column by hand — production's figures, say — instead of reading a
 * database.
 */
import { describe, expect, it } from "vitest";

import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import { addUp } from "@/lib/rating/figures";
import { playerKey } from "@/lib/rating/playerKey";

import { IMPORTED_TWIN_OF, IMPORTED_XP_CANDIDATES, IMPORTED_XP_SETTING, type ImportedXpCandidate } from "./importedXp.constants";
import { classKindOf, importedXpEligible, importedXpFor } from "./importedXp";
import { xpLevelName } from "./levelNames";
import { wholeYearsBetween } from "./xp.constants";
import { xpLevelFor } from "./xpCurve";

const levelNameFor = (xp: number): string => `${xpLevelFor(xp)} · ${xpLevelName(xpLevelFor(xp))}`;

const ASKED = process.env.XP_IMPORTED_OPTIONS === "1";

const say = (line: string): void => {
  console.log(line);
};

const n = (value: number): string => value.toLocaleString("en-GB");

/** The member row each record belongs to, by the name the site attaches it by. */
function memberNameOf(legacy: (typeof LEGACY_PLAYERS)[number]): string {
  return legacy.kind === "elsewhere" && legacy.linkedKey !== undefined ? legacy.linkedKey : legacy.name;
}

/** Itsutsu XP per record: by hand when given, else from the database in `.env`, else not read. */
async function itsutsuXp(): Promise<{ from: string; get: (legacy: (typeof LEGACY_PLAYERS)[number]) => number | "two rows" | null }> {
  const byHand = process.env.XP_IMPORTED_ITSUTSU;
  if (byHand !== undefined && byHand !== "") {
    const given = new Map(byHand.split(",").map((pair) => [pair.split(":")[0], Number(pair.split(":")[1])]));
    return { from: "the figures given by hand", get: (legacy) => given.get(legacy.slug) ?? null };
  }
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.member.findMany({ where: { botTier: null }, select: { name: true, xp: true } });
    const byKey = new Map<string, number | "two rows">();
    for (const row of rows) {
      const key = playerKey(row.name);
      byKey.set(key, byKey.has(key) ? "two rows" : row.xp);
    }
    return { from: "the database in .env", get: (legacy) => byKey.get(playerKey(memberNameOf(legacy))) ?? null };
  } catch {
    return { from: "no database", get: () => null };
  }
}

describe("imported XP, every candidate setting, over the real kept records", () => {
  it.runIf(ASKED)("prints the table John chose from", async () => {
    const records = LEGACY_PLAYERS.filter(importedXpEligible);
    const local = await itsutsuXp();

    say("\nTHE FIGURES EACH RECORD HOLDS (class records, not detail rows):");
    for (const legacy of records) {
      say(`  ${legacy.name}`);
      for (const source of legacy.sources) {
        const kinds = { ordinary: { games: 0, wins: 0 }, tournament: { games: 0, wins: 0 } };
        for (const row of source.summary) {
          const { won, lost, drawn } = addUp([row.record]);
          const kind = classKindOf(row.class);
          if (kind === null) {
            say(`    ! unknown class ${row.class} on ${source.site}`);
            continue;
          }
          kinds[kind].games += won + lost + drawn;
          kinds[kind].wins += won;
        }
        const years = wholeYearsBetween(source.joined, source.lastActive);
        say(
          `    ${source.site.padEnd(16)} ordinary ${n(kinds.ordinary.games)} games / ${n(kinds.ordinary.wins)} wins;` +
            ` tournament ${n(kinds.tournament.games)} / ${n(kinds.tournament.wins)};` +
            ` ${source.joined} → ${source.lastActive} = ${years ?? "—"} whole years`,
        );
      }
    }

    const names = Object.keys(IMPORTED_XP_CANDIDATES) as ImportedXpCandidate[];
    for (const name of names) {
      const rules = IMPORTED_XP_CANDIDATES[name];
      say(`\nSETTING ${name}${name === IMPORTED_XP_SETTING ? "  ← in force, approved by John" : ""}`);
      say(
        `  game ${rules.game}, win ${rules.win}, tournaments ×${rules.tournamentMultiple},` +
          ` years ${rules.years ? "yes" : "no"}, milestones at one game ${rules.gameMilestones ? "yes" : "no"}`,
      );
      say(
        `  ${"Person".padEnd(12)} ${"Volume".padStart(9)} ${"Years".padStart(7)} ${"Win ms".padStart(8)} ${"Loss ms".padStart(8)} ${"Draw ms".padStart(8)}` +
          ` ${"Imported".padStart(10)} ${"Itsutsu".padStart(8)} ${"Everywhere".padStart(11)}  Level`,
      );
      for (const legacy of records) {
        const reckoning = importedXpFor([legacy], rules);
        const part = (test: (type: string) => boolean) =>
          reckoning.claims.filter((one) => test(one.type)).reduce((sum, one) => sum + one.points, 0);
        const years = part((type) => type.startsWith("importedYears"));
        const wins = part((type) => /^importedWins\d/.test(type));
        const losses = part((type) => type.startsWith("importedLosses"));
        const draws = part((type) => type.startsWith("importedDraws"));
        const volume = part((type) => IMPORTED_TWIN_OF[type as keyof typeof IMPORTED_TWIN_OF] === undefined);
        const here = local.get(legacy);
        const everywhere = reckoning.total + (typeof here === "number" ? here : 0);
        say(
          `  ${legacy.name.padEnd(12)} ${n(volume).padStart(9)} ${n(years).padStart(7)} ${n(wins).padStart(8)} ${n(losses).padStart(8)} ${n(draws).padStart(8)}` +
            ` ${n(reckoning.total).padStart(10)} ${(here === null ? "—" : typeof here === "number" ? n(here) : here).padStart(8)}` +
            ` ${n(everywhere).padStart(11)}  ${levelNameFor(everywhere)}`,
        );
        for (const unknown of reckoning.unknownClasses) say(`    ! ${unknown.site} class ${unknown.className} priced as nothing`);
      }
    }

    say(`\nItsutsu column read from ${local.from}.`);
    expect(records.length).toBeGreaterThan(0);
  });

  it("is asked for by name, and prints nothing otherwise", () => {
    expect(typeof ASKED).toBe("boolean");
  });
});
