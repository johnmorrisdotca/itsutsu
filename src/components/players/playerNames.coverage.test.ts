import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { code } from "@/components/games/sourceScan";

/**
 * ONE WAY TO DRAW A PERSON'S NAME: `PlayerName`.
 *
 * John, 2026-09-25, at an XP board that named programs with no BOT mark while
 * the players page marked them, and Meijin unmarked on My games: "if it's a
 * bot, it NEEDS the bot tag after the name. seems like you're not using
 * Components to display a name. All names should be code reuse… the name
 * shows the name, flag, role, etc… we can't be inconsistent in pages."
 *
 * `PlayerName` draws the name, its link, the flag and the kind badge. So the
 * three pieces it is made of — the shortened name, the flag and the badge — are
 * not drawn anywhere else, except in the places named below, each with its
 * reason. A new list that draws a name its own way fails here.
 */
const SRC = join(process.cwd(), "src");

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path));
    else if (path.endsWith(".tsx") && !path.endsWith(".test.tsx")) found.push(path);
  }
  return found;
}

const PIECES = {
  shownName: /\bshownName\(/g,
  CountryMark: /<CountryMark\b/g,
  MemberKindBadge: /<MemberKindBadge\b/g,
} as const;
type Piece = keyof typeof PIECES;

/** Where a piece may be drawn outside `PlayerName`, with how many times and why. */
const ALLOWED: Record<string, Partial<Record<Piece, { times: number; why: string }>>> = {
  "src/components/players/PlayerName.tsx": {
    shownName: { times: 1, why: "the one component that draws a name" },
    CountryMark: { times: 1, why: "the one component that draws a name" },
    MemberKindBadge: { times: 1, why: "the one component that draws a name" },
  },
  "src/app/players/[slug]/page.tsx": {
    shownName: { times: 1, why: "the member's own page heading: the name is the title, not a link to itself" },
    CountryMark: { times: 1, why: "beside that heading, with the country in words" },
    MemberKindBadge: { times: 1, why: "beside that heading" },
  },
  "src/app/games/[slug]/match/[id]/MatchPage.tsx": {
    shownName: { times: 1, why: "a name inside a sentence, where a badge would read as a typo" },
  },
  "src/components/live/SharedGameFooter.tsx": {
    shownName: { times: 1, why: "inside a sentence: 'You are playing black against X from Y.'" },
  },
  "src/components/players/directoryActions.tsx": {
    shownName: { times: 1, why: "the name handed to a menu's words, not drawn as a name" },
  },
  "src/components/players/PlayerActions.tsx": {
    shownName: { times: 1, why: "the name handed to a menu's words, not drawn as a name" },
  },
  "src/components/live/OpponentChoice.tsx": {
    shownName: { times: 2, why: "a set-up tile's label, inside the tile that is the choice; the tile marks a program itself" },
  },
  "src/components/mine/OpenGamesBoard.tsx": {
    CountryMark: { times: 1, why: "the Location column, beside a name column drawn by PlayerName" },
  },
};

const FILES = filesUnder(SRC).map((path) => ({ path: path.slice(process.cwd().length + 1), source: code(readFileSync(path, "utf8")) }));

describe("a person's name is drawn by PlayerName and nothing else", () => {
  it("has files to read, so a pass means something", () => {
    expect(FILES.length).toBeGreaterThan(200);
  });

  for (const piece of Object.keys(PIECES) as Piece[]) {
    it(`draws ${piece} only inside PlayerName, or where it is named with its reason`, () => {
      const wrong = FILES.flatMap(({ path, source }) => {
        const times = source.match(PIECES[piece])?.length ?? 0;
        const allowed = ALLOWED[path]?.[piece]?.times ?? 0;
        return times > allowed ? [`${path}: ${piece} ×${times}, allowed ${allowed}`] : [];
      });
      expect(wrong, "draw the name with <PlayerName>, which adds the flag and the BOT or kind badge").toEqual([]);
    });
  }

  it("names no exception that no longer draws the piece", () => {
    const stale = Object.entries(ALLOWED).flatMap(([path, pieces]) => {
      const source = FILES.find((file) => file.path === path)?.source ?? "";
      return (Object.entries(pieces) as [Piece, { times: number }][])
        .filter(([piece, { times }]) => (source.match(PIECES[piece])?.length ?? 0) !== times)
        .map(([piece]) => `${path}: ${piece}`);
    });
    expect(stale).toEqual([]);
  });
});
