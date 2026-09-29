import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PARTY_MARBLES } from "@/components/party/party.constants";
import { GAME_ADDED } from "@/lib/catalogue/gameAdded.data";
import { EVERY_GAME_KEY, RECORDED_GAME_KEYS, gameCopyFor, isPartyKind } from "@/lib/catalogue/gameKeys";
import { gameArtPath, gameThumbPath } from "@/lib/gomoku/artwork";
import { RECORDED_FAMILIES, familyKeepsRecords, familyOf, familyPagePath } from "@/lib/gomoku/families";
import { PARTY_SLUGS, gameKeyFor, slugFor } from "@/lib/gomoku/slugs";
import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";

import { PARTY_ART_FINGERPRINT } from "./partyArt.data";
import { PARTY_ART_FILES, readPartyArtFingerprint } from "./partyArtFingerprint";
import { PARTY_DISPLAY, PARTY_KIND_LIST, PARTY_SPECS } from "./party.constants";
import type { PartyKind, PartyRules } from "./party.types";
import { partyRulesPage } from "./partyRulesPage";
import { PARTY_RULES } from "./partyRules";

/**
 * The New Game Gate, for a party game.
 *
 * `variants.coverage.test.ts` holds every rule variant to what makes it a game
 * a person can find, understand and trust, and `puzzles.coverage.test.ts` asks
 * the same of a puzzle in its own terms. A party game — a table of people
 * round one device, never rated, never recorded (docs/plans/party-games) — is
 * neither, and neither gate sees it, so this one asks every question of the
 * New Game Gate that applies to it, in a party game's terms:
 *
 *  - it is tested, and its rules play out: at every board and every number of
 *    players it offers, played at random, it ENDS, every seat can WIN, every
 *    move offered is one the rules take, and a kept game reads back exactly —
 *    what the simulator asks of a variant;
 *  - it has a picture and a thumbnail, taken of the board as it is drawn now;
 *  - it has full copy, and a rules page with every section filled;
 *  - it belongs to a family, and that family is one no award counts, since
 *    nothing of it is ever recorded;
 *  - it has an address, a front door, a rules page and a table under it, and
 *    waits on My games while a game is going;
 *  - it is driven by a browser spec, it says the day it arrived, and no kept
 *    record from another site names it without a decision.
 *
 * Every question is asked of `PARTY_KIND_LIST`, so the day Superghost is
 * listed it is held to all of this before it ships.
 */

const read = (path: string) => readFileSync(path, "utf8");

function sourcesUnder(dir: string, suffix: string): string {
  const found: string[] = [];
  const walk = (at: string) => {
    for (const entry of readdirSync(at)) {
      const path = join(at, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(suffix) && !entry.startsWith("party.coverage")) found.push(read(path));
    }
  };
  walk(dir);
  return found.join("\n");
}

/** A random number from a seed, the same every run: a gate must never pass or fail by luck. */
function seeded(start: number): () => number {
  let seed = start;
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

/** Plays one game out at random, moving only as the rules offer; the game at its end, and how many moves it took. */
function playOut<S, M>(rules: PartyRules<S, M>, size: number, count: number, seed: number, most: number): { end: S; moves: number; mid: S | null } {
  const random = seeded(seed);
  let game = rules.start(size, new Array<string>(count).fill(""));
  if (game === null) throw new Error(`no table of ${count} at size ${size}`);
  let mid: S | null = null;
  let moves = 0;
  while (!rules.over(game) && moves < most) {
    const offered = rules.moves(game);
    if (offered.length === 0) throw new Error("a game not over offers no move");
    const next = rules.play(game, offered[Math.floor(random() * offered.length)]);
    if (next === null) throw new Error("the rules refused a move they offered");
    game = next;
    moves += 1;
    if (moves === 5) mid = game;
  }
  return { end: game, moves, mid };
}

/** The names a kept record from another site uses for a game, as the alias gate reads them. */
function recordedGameNames(): Set<string> {
  const names = new Set<string>();
  for (const player of LEGACY_PLAYERS) {
    for (const source of player.sources) {
      for (const row of source.summary) for (const game of row.detail ?? []) names.add(game.game.trim().toLowerCase());
      for (const pairing of source.headToHead ?? []) for (const game of pairing.games) names.add(game.game.trim().toLowerCase());
    }
  }
  return names;
}

describe("every party game is finished, not just declared", () => {
  const unitTests = sourcesUnder(join(process.cwd(), "src", "lib", "party"), ".test.ts");
  const browserSpecs = readdirSync("e2e")
    .filter((name) => name.endsWith(".ts") && name !== "party-screenshots.spec.ts")
    .map((name) => read(join("e2e", name)));

  it("lists at least one party game, so the gate below is checking something", () => {
    expect(PARTY_KIND_LIST.length).toBeGreaterThan(0);
  });

  it.each(PARTY_KIND_LIST)("%s is named by at least one unit test beside its rules", (kind) => {
    expect(unitTests, `no unit test under src/lib/party names ${kind}: test the rule that makes it a game`).toContain(kind);
  });

  it.each(PARTY_KIND_LIST)("%s ends, at every board and table it offers, and every seat can win", (kind) => {
    const rules = PARTY_RULES[kind] as PartyRules<unknown, unknown>;
    const spec = PARTY_SPECS[kind];
    for (const size of spec.sizes) {
      for (let count = spec.fewestPlayers; count <= spec.mostPlayers; count += 1) {
        const won = new Set<number>();
        for (let game = 0; game < 60; game += 1) {
          const { end, moves } = playOut(rules, size, count, 1000 * size + 100 * count + game, 10_000);
          expect(rules.over(end), `${kind} ${size} for ${count}: still going after ${moves} moves`).toBe(true);
          expect(rules.moves(end), "a game over offers no move").toEqual([]);
          const winners = rules.winners(end);
          expect(winners.length, "a game over names somebody").toBeGreaterThan(0);
          for (const seat of winners) {
            expect(seat).toBeGreaterThanOrEqual(0);
            expect(seat).toBeLessThan(count);
            won.add(seat);
          }
        }
        expect(won.size, `${kind} ${size} for ${count}: some seat never won in 60 games`).toBe(count);
      }
    }
  });

  it.each(PARTY_KIND_LIST)("%s is kept and read back exactly, and refuses what it cannot play out", (kind) => {
    const rules = PARTY_RULES[kind] as PartyRules<unknown, unknown>;
    const spec = PARTY_SPECS[kind];
    const { mid, end } = playOut(rules, spec.defaultSize, spec.defaultPlayers, 7, 10_000);
    expect(mid).not.toBeNull();
    expect(rules.decode(rules.encode(mid))).toEqual(mid);
    expect(rules.decode(rules.encode(end))).toEqual(end);
    expect(rules.decode(null)).toBeNull();
    expect(rules.decode("not a game")).toBeNull();
    expect(rules.start(spec.defaultSize, [""]), "a table of one is not a party").toBeNull();
  });

  it.each(PARTY_KIND_LIST)("%s offers tables the site can seat: at most six colours, at most four boards", (kind) => {
    const spec = PARTY_SPECS[kind];
    expect(spec.fewestPlayers).toBeGreaterThanOrEqual(2);
    expect(spec.mostPlayers).toBeLessThanOrEqual(PARTY_MARBLES.length);
    expect(spec.defaultPlayers).toBeGreaterThanOrEqual(spec.fewestPlayers);
    expect(spec.defaultPlayers).toBeLessThanOrEqual(spec.mostPlayers);
    expect(spec.sizes.length).toBeGreaterThan(0);
    expect(spec.sizes.length).toBeLessThanOrEqual(4);
    expect(new Set(spec.sizes).size).toBe(spec.sizes.length);
    expect(spec.sizes).toContain(spec.defaultSize);
  });

  it.each(PARTY_KIND_LIST)("%s has a picture and a thumbnail in public/art/games", (kind) => {
    expect(existsSync(join(process.cwd(), "public", gameArtPath(kind))), `${kind}: run pnpm screenshots:party`).toBe(true);
    expect(existsSync(join(process.cwd(), "public", gameThumbPath(kind))), `${kind}: run pnpm screenshots:party`).toBe(true);
  });

  it("has pictures of the boards as they are drawn now", () => {
    expect(PARTY_ART_FINGERPRINT).toMatch(/^[0-9a-f]{16}$/);
    expect(
      readPartyArtFingerprint(),
      "A party game's board is drawn differently from when its picture was taken. Re-take them:\n\n" +
        "    pnpm screenshots:party\n\n" +
        `(The files watched are ${PARTY_ART_FILES.join(", ")} — see partyArtFingerprint.ts if one of them should not be.)`,
    ).toBe(PARTY_ART_FINGERPRINT);
  });

  it.each(PARTY_KIND_LIST)("%s tells a table what it is", (kind) => {
    const copy = PARTY_DISPLAY[kind];
    expect(copy.label.length).toBeGreaterThan(0);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(copy.tagline.length).toBeGreaterThan(0);
    expect(copy.origin.length).toBeGreaterThan(0);
    expect(copy.board.length).toBeGreaterThan(0);
    expect(copy.rules.length).toBeGreaterThanOrEqual(3);
    expect(gameCopyFor(kind)).toBe(copy);
  });

  it.each(PARTY_KIND_LIST)("%s builds a rules page with every section filled", (kind) => {
    const page = partyRulesPage(kind);
    for (const section of [page.object, page.board, page.play, page.house]) expect(section.length).toBeGreaterThan(0);
    expect(page.image).toBe(gameArtPath(kind));
  });

  it.each(PARTY_KIND_LIST)("%s belongs to a family no award counts, so its shelf shows it and nothing pays for it", (kind) => {
    const family = familyOf(kind);
    expect(family, `${kind} is in no family, so no index page shows it`).not.toBeNull();
    // Nothing of a party game is recorded: a family some recorded game calls home would count it towards a prize.
    expect(familyKeepsRecords(family!)).toBe(false);
    expect(RECORDED_FAMILIES).not.toContain(family);
    expect(familyPagePath(family!)).toBe(`/games/${family!.key}`);
    expect(EVERY_GAME_KEY).toContain(kind);
    expect(RECORDED_GAME_KEYS).not.toContain(kind);
    expect(isPartyKind(kind)).toBe(true);
  });

  it.each(PARTY_KIND_LIST)("%s has an address of its own, with a front door, rules and a table under it", (kind) => {
    expect(slugFor(kind)).toBe(PARTY_SLUGS[kind]);
    expect(slugFor(kind)).toMatch(/^[a-z0-9-]+$/);
    expect(gameKeyFor(PARTY_SLUGS[kind])).toBe(kind);
    expect(read("src/app/games/[slug]/page.tsx"), "the front door answers a party game").toContain("<PartyFrontDoor");
    expect(read("src/app/games/[slug]/rules/page.tsx"), "the rules page answers a party game").toContain("partyRulesPage(");
    expect(read("src/app/games/[slug]/pass-and-play/page.tsx"), "the table answers a party game").toContain("PARTY_KIND_TABLES[");
    // And a game going waits on My games' Pass and play tab, through the card its table names.
    expect(read("src/app/play/page.tsx"), "My games lists every party game's card").toContain("PARTY_KIND_TABLES[kind]");
  });

  it.each(PARTY_KIND_LIST)("%s is driven by at least one browser spec", (kind: PartyKind) => {
    const named = browserSpecs.some((source) => source.includes(`"${kind}"`) || source.includes(`/${PARTY_SLUGS[kind]}`));
    expect(named, `no spec under e2e/ names ${kind} (${PARTY_SLUGS[kind]}) — write the case that plays one`).toBe(true);
  });

  it.each(PARTY_KIND_LIST)("%s says the day it arrived", (kind) => {
    expect(GAME_ADDED[kind], "run `pnpm games:added`").toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(PARTY_KIND_LIST)("%s is named by no kept record from another site, or the alias gate must decide it", (kind) => {
    /*
     * A kept record prints the source site's own name for a game, and
     * `GAME_ALIASES` turns it into a link — to a rule variant, since a record
     * is games that were rated. No record names a party game today; the day
     * one does, it needs a decision there (an alias, or `NO_GAME_HERE` with the
     * reason), not silence here.
     */
    const copy = PARTY_DISPLAY[kind];
    const names = [copy.label, ...(copy.alsoKnownAs ?? [])].map((name) => name.trim().toLowerCase());
    const recorded = recordedGameNames();
    expect(names.filter((name) => recorded.has(name))).toEqual([]);
  });
});
