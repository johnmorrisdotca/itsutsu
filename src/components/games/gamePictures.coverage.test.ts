import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PICK_ICON, SEAT_MARK_LOOK } from "@/components/live/picker.constants";

import { PICTURE_PX } from "./games.constants";
import { code, insideControl, namesPrinted } from "./sourceScan";

/**
 * A game named in a list shows its picture, and every picture is one of two sizes.
 *
 * John, 2026-09-14, on /games and a player's page: "Looks like we aren't showing
 * the icons for all the variant games in a family! Why is this when we do it in
 * the other page. The size for the Top Level Family size is better to be larger
 * too, and should be consistent between some pages. Strange how we don't see
 * icons in the Player pages, etc... that's a BUG too."
 *
 * It is the dead-end rule's shape again. 0.137.0 put a board beside every game
 * in the lists that existed that night — /play, the record, the open seats, the
 * champions — and every list written after it named its games in plain words,
 * because nothing knew that "a list naming games" was a thing with a rule. The
 * families view, the Cards view, the plain list, a player's By game table and
 * Recent games, the imported records: all of them since.
 *
 * So this reads the source, like `gameLinks.coverage.test.ts` beside it, and
 * fails when:
 *
 *  - a game's name — through `GameName`, or printed by hand as a game's label —
 *    has no `<GameThumb` near it, and is not named below as a heading or a
 *    sentence;
 *  - any picture — a game's, a family's, a board's, an opening's, an
 *    opponent's stone, a rated tile's icon — is drawn at a size that is not
 *    "regular" or "large", or large stops being exactly twice regular. John,
 *    2026-09-15: from multiple icon sizes to exactly two, with the large one
 *    "exactly DOUBLE the regular size, for symmetry".
 *
 * "Near" is a window of source, which is crude on purpose: a row draws its
 * picture a few lines from its name, and a gate that needed the component
 * rendered would be a browser test. `e2e/game-pictures.spec.ts` is that test.
 */

const ROOTS = ["src/components", "src/app"];

/** The component that draws the picture, which names no game of its own. */
const OWNERS = new Set(["GameThumb.tsx"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx") && !OWNERS.has(entry.name)) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => {
  const raw = readFileSync(path, "utf8");
  return { path, raw, source: code(raw) };
});

/**
 * How far from a name its picture may be drawn: the row or card it sits in.
 *
 * Counted in characters that are not whitespace, because comments are blanked
 * to spaces and this codebase writes long ones — /play's row draws its board
 * thirteen lines above the name, eleven of them an argument about why.
 *
 * MEASURED, NOT GUESSED. Across the rows that have drawn a board since 0.137.0,
 * the farthest name from its picture is the record's, at 905: the board sits in
 * the first cell of the row and the game's name in the second, with both
 * players' names between them. A thousand clears that and nothing more — the
 * lists this gate was written against had no `<GameThumb` in the file at all.
 */
const PICTURE_REACH = 1000;

/**
 * Names that are not in a list, card or table, by file, each identified by the
 * words of its own line and with the reason it has no picture.
 *
 * By LINE rather than by file, because a file can hold both: the family page
 * names the game you came from in a sentence and lists the family's games as
 * cards, and a file-wide exception for the sentence would have excused the
 * cards too. Three kinds, and no fourth:
 *
 *  - a PAGE'S OWN TITLE, on a page about that one game: its board is the page;
 *  - a SENTENCE — prose that names a game in passing, at text size;
 *  - a HEADING over something that is itself about that one game.
 */
const NOT_A_LIST: Record<string, { line: string; why: string }[]> = {
  "src/components/history/RecordPage.tsx": [
    { line: "<GameName variant={variant} kanji />", why: "the title of one game's record" },
  ],
  "src/app/games/[slug]/begin/page.tsx": [
    {
      line: '<GameName variant={variant} kanji className="no-underline hover:underline" />',
      why: "the heading of one game's first page, which draws the chosen board itself",
    },
  ],
  "src/app/games/[slug]/standings/page.tsx": [
    { line: "<Paired en={copy.label}", why: "the title of one game's standings" },
    {
      line: "{RULE_VARIANT_DISPLAY[game].label}",
      why: 'a caption-size sentence under the ladder: "Also in Captures: Ninuki-renju, Sannuki-renju"',
    },
  ],
  "src/app/games/[slug]/play/page.tsx": [
    { line: "{RULE_VARIANT_DISPLAY[game].label}", why: 'the footer sentence "Also in Captures: …" under a board' },
  ],
  "src/app/games/[slug]/match/[id]/FiledMatchPage.tsx": [
    {
      line: "<GameName variant={game.variant} />",
      why: "a sentence of facts about one match, on the page that replays its board",
    },
  ],
  "src/app/games/[slug]/match/[id]/RefusedOfferPage.tsx": [
    { line: "A game of <GameName variant={game.variant} />", why: "a sentence saying what was offered" },
  ],
  "src/app/games/[slug]/family/page.tsx": [
    { line: "<GameName variant={variant} />.", why: 'a sentence: "7 games in this family, including Gomoku."' },
  ],
  "src/app/champions/page.tsx": [
    { line: 'so being good at <GameName variant="notakto" />', why: "a sentence of explanation above the table" },
    { line: '<GameName variant="renju" />; the ladder', why: "the same sentence" },
  ],
  "src/components/game/GameBrowser.tsx": [
    {
      line: "{GAME_COPY.browserOpenings.label} · <GameName variant={shown} />",
      why: "the heading over one game's openings, beside that game's card with its picture",
    },
  ],
  "src/components/history/RivalryBoard.tsx": [
    { line: "<GameName variant={variant} />", why: "the title of a rivalry at one game" },
  ],
};

type Named = { path: string; at: number; line: string };

function lineAt(raw: string, at: number): string {
  const start = raw.lastIndexOf("\n", at - 1) + 1;
  const end = raw.indexOf("\n", at);
  return raw.slice(start, end === -1 ? raw.length : end);
}

/** Every game named in a file, through `GameName` or by hand, that is not a choice in a control. */
function gamesNamed(file: (typeof FILES)[number]): Named[] {
  const at = [
    ...[...file.source.matchAll(/<GameName\b/g)].map((match) => match.index),
    ...namesPrinted(file.source),
  ];
  return at
    .filter((position) => !insideControl(file.source, position))
    .map((position) => ({ path: file.path, at: position, line: lineAt(file.raw, position) }));
}

function pictured(source: string, at: number): boolean {
  return [...source.matchAll(/<GameThumb\b/g)].some((thumb) => {
    const between = source.slice(Math.min(at, thumb.index), Math.max(at, thumb.index));
    return between.replace(/\s+/g, "").length <= PICTURE_REACH;
  });
}

function excused(named: Named): boolean {
  return (NOT_A_LIST[named.path] ?? []).some((entry) => named.line.includes(entry.line));
}

const NAMED = FILES.flatMap(gamesNamed);

describe("a game named in a list shows its picture", () => {
  it("finds the names at all, so a passing run means something", () => {
    expect(NAMED.length, "the matchers still see games being named").toBeGreaterThan(20);
    expect(FILES.filter((file) => /<GameThumb\b/.test(file.source)).length).toBeGreaterThan(5);
  });

  it("draws a picture beside every game named in a list, card or table", () => {
    const bare = NAMED.filter(
      (named) => !pictured(FILES.find((file) => file.path === named.path)?.source ?? "", named.at) && !excused(named),
    ).map((named) => `${named.path}: ${named.line.trim()}`);
    expect(bare, "draw <GameThumb> beside it — or name the line in NOT_A_LIST with why it is not a list").toEqual([]);
  });

  it("names no exception that no longer names a game", () => {
    const stale = Object.entries(NOT_A_LIST).flatMap(([path, entries]) =>
      entries
        .filter((entry) => !NAMED.some((named) => named.path === path && named.line.includes(entry.line)))
        .map((entry) => `${path}: ${entry.line}`),
    );
    expect(stale, "an exception left behind is a hole nobody knows is open").toEqual([]);
  });
});

/** Every call of a component in a file, as the text of its opening tag. */
function tagsOf(name: string): { path: string; tag: string }[] {
  return FILES.flatMap((file) =>
    [...file.source.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map((match) => ({ path: file.path, tag: match[0] })),
  );
}

/**
 * Every component that draws a picture, each taking `size: "regular" | "large"`.
 * A new picture component belongs here the day it is written, or it is a third
 * size waiting to happen.
 */
const PICTURES = ["GameThumb", "FamilyMark", "BoardSizeMark", "OpeningMark", "SeatMark", "MovesIcon", "LevelIcon"] as const;

/** The files those components live in, each of which reads its side through `pictureBox`. */
const PICTURE_SOURCES = [
  "src/components/games/GameThumb.tsx",
  "src/components/games/FamilyMark.tsx",
  "src/components/board/BoardSizeMark.tsx",
  "src/components/live/OpeningMark.tsx",
  "src/components/live/SeatMark.tsx",
  "src/components/live/RatedPicker.tsx",
];

/**
 * The per-surface sizes the two replaced: a game's picture by where it sat, a
 * family's icon, the board block, the doorstep's board, an opening's tile. None
 * may come back under its old name.
 */
const RETIRED = ["GAME_PICTURE_SIZE", "GamePictureSize", "FAMILY_ICON_SIZE", "BOARD_MARK_PX", "DOORSTEP_MARK_PX", "OPENING_MARK_PX"];

/** Every source file under `src`, tests aside, with its comments blanked. */
function sourcesUnder(dir: string): { path: string; source: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourcesUnder(path);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [{ path, source: code(readFileSync(path, "utf8")) }];
  });
}

describe("two picture sizes: regular, and large at exactly twice it", () => {
  it("draws every picture at one of the two sizes and no other", () => {
    for (const name of PICTURES) expect(tagsOf(name).length, `<${name}> is still drawn somewhere`).toBeGreaterThan(0);
    expect(tagsOf("FamilyMark").length, "every page that shows a family is still found").toBeGreaterThanOrEqual(4);
    const loose = PICTURES.flatMap(tagsOf)
      .filter(({ tag }) => !/\bsize="(regular|large)"/.test(tag) || /\bpx=|\bsize-\d/.test(tag))
      .map(({ path, tag }) => `${path}: ${tag}`);
    expect(loose, 'pass size="regular" or size="large", and no px or size- class of its own').toEqual([]);
  });

  it("keeps the two in one place: regular is the board tile, large is written as twice it", () => {
    expect(Object.keys(PICTURE_PX).sort()).toEqual(["large", "regular"]);
    expect(PICTURE_PX.regular, "the set-up page's board tile, the size John chose").toBe(70);
    expect(PICTURE_PX.large, "exactly double, for symmetry").toBe(PICTURE_PX.regular * 2);
    const constants = code(readFileSync("src/components/games/games.constants.ts", "utf8"));
    expect(constants, "large derived from regular, not a second number").toMatch(/large:\s*REGULAR_PICTURE_PX\s*\*\s*2\b/);
  });

  it("sizes every picture component from that one place, and by no class of its own", () => {
    for (const path of PICTURE_SOURCES) {
      const source = code(readFileSync(path, "utf8"));
      expect(source, `${path} reads its side through pictureBox`).toContain("pictureBox(");
      // The rated picker also draws a tick and a glyph inside its square, which are not pictures.
      if (!path.endsWith("RatedPicker.tsx")) expect(source, `${path} carries a size class`).not.toMatch(/\bsize-\d/);
    }
    for (const [name, look] of Object.entries({ PICK_ICON, ...SEAT_MARK_LOOK })) {
      expect(look, `${name} carries a size class, which is a picture size of its own`).not.toMatch(/\bsize-\d/);
    }
  });

  it("leaves no per-surface size behind under its old name", () => {
    const sources = sourcesUnder("src");
    const using = RETIRED.flatMap((name) =>
      sources.filter((file) => new RegExp(`\\b${name}\\b`).test(file.source)).map((file) => `${file.path}: ${name}`),
    );
    expect(using).toEqual([]);
  });
});
