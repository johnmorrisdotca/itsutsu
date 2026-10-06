import type { HousekiCampaign, HousekiKind, HousekiSpec } from "./houseki.types";

/**
 * THE HOUSEKI GAMES, by key (`@johnmorrisdotca/houseki`, 2026-10-06): gem and
 * stone puzzles for one person, a level at a time, played by the package's
 * engines in the browser. See `docs/plans/houseki/README.md` for why they are a
 * kind of their own and what a won level is worth.
 */
export const HOUSEKI_KINDS = {
  fallingTriplets: "fallingTriplets",
  colourChains: "colourChains",
  stoneCollapse: "stoneCollapse",
  gemSwap: "gemSwap",
  magneticBlocks: "magneticBlocks",
} as const satisfies Record<HousekiKind, HousekiKind>;

/** The key of the family the five are at home in, and so its address: `/games/houseki`, answered by the game page's own route (`HousekiFamilyPage`). */
export const HOUSEKI_FAMILY_KEY = "houseki";

/** Every Houseki game, in the order its family shows them. */
export const HOUSEKI_KIND_LIST: readonly HousekiKind[] = [
  HOUSEKI_KINDS.fallingTriplets,
  HOUSEKI_KINDS.colourChains,
  HOUSEKI_KINDS.stoneCollapse,
  HOUSEKI_KINDS.gemSwap,
  HOUSEKI_KINDS.magneticBlocks,
];

/** The campaigns, in the order a game with several offers them. */
export const HOUSEKI_CAMPAIGN_LIST: readonly HousekiCampaign[] = ["classic", "shizen", "arashi"];

/**
 * What each is: its id in the package, how it moves, its levels, lessons and
 * Daily, and the four sizes a free game is offered in (a game offers at most
 * four boards on its set-up, `picker.test.ts`). The counts are held to the
 * package's own by `houseki.coverage.test.ts`.
 *
 * A size's `id` is the package's own name for it where the engine has one
 * (`preset`), and "WxH" for Magnetic Blocks, which is made from a width and a
 * height.
 */
export const HOUSEKI_SPECS: Record<HousekiKind, HousekiSpec> = {
  fallingTriplets: {
    id: "falling-triplets",
    motion: "falling",
    campaigns: { classic: 100 },
    lessons: 3,
    daily: true,
    sizes: [
      { id: "narrow", width: 6, height: 13 },
      { id: "standard", width: 8, height: 13 },
      { id: "wide", width: 10, height: 13 },
      { id: "tall", width: 8, height: 17 },
    ],
    colours: [5, 4, 6],
    arcade: true,
  },
  colourChains: {
    id: "colour-chains",
    motion: "falling",
    campaigns: { classic: 50, shizen: 50, arashi: 50 },
    lessons: 3,
    daily: true,
    sizes: [
      { id: "standard", width: 6, height: 12 },
      { id: "narrow", width: 5, height: 12 },
      { id: "wide", width: 8, height: 12 },
      { id: "tall", width: 6, height: 16 },
    ],
    colours: [4, 5, 6],
    arcade: true,
  },
  stoneCollapse: {
    id: "stone-collapse",
    motion: "turns",
    campaigns: { classic: 100 },
    lessons: 3,
    daily: true,
    sizes: [
      { id: "standard", width: 8, height: 10 },
      { id: "compact", width: 6, height: 8 },
      { id: "wide", width: 10, height: 8 },
      { id: "tall", width: 6, height: 12 },
    ],
    colours: [4, 5, 6],
    arcade: false,
  },
  gemSwap: {
    id: "gem-swap",
    motion: "turns",
    campaigns: { classic: 50 },
    lessons: 3,
    daily: true,
    sizes: [
      { id: "standard", width: 8, height: 8 },
      { id: "compact", width: 6, height: 6 },
      { id: "wide", width: 10, height: 6 },
      { id: "tall", width: 6, height: 10 },
    ],
    colours: [5, 4, 6],
    arcade: false,
  },
  magneticBlocks: {
    id: "magnetic-blocks",
    motion: "falling",
    campaigns: { classic: 50 },
    lessons: 3,
    daily: false,
    sizes: [
      { id: "8x16", width: 8, height: 16 },
      { id: "6x12", width: 6, height: 12 },
      { id: "10x16", width: 10, height: 16 },
      { id: "8x24", width: 8, height: 24 },
    ],
    colours: [5, 4, 6],
    arcade: true,
  },
};

/** The Houseki game a package id names, or null. */
export function housekiKindOfId(id: string): HousekiKind | null {
  return HOUSEKI_KIND_LIST.find((kind) => HOUSEKI_SPECS[kind].id === id) ?? null;
}

/** The campaigns a game has, in order. */
export function campaignsOf(kind: HousekiKind): HousekiCampaign[] {
  return HOUSEKI_CAMPAIGN_LIST.filter((campaign) => HOUSEKI_SPECS[kind].campaigns[campaign] !== undefined);
}

/** How many levels a campaign has: 0 for one the game does not have. */
export function levelsIn(kind: HousekiKind, campaign: HousekiCampaign): number {
  return HOUSEKI_SPECS[kind].campaigns[campaign] ?? 0;
}

/** Every level of a game, over all its campaigns. */
export function levelsOf(kind: HousekiKind): number {
  return campaignsOf(kind).reduce((total, campaign) => total + levelsIn(kind, campaign), 0);
}

/** The kanji each game is known by here: the names the package's own demo gives them in Japanese. */
export const HOUSEKI_KANJI: Record<HousekiKind, string> = {
  fallingTriplets: "三つの宝石",
  colourChains: "色の連鎖",
  stoneCollapse: "ストーンコラプス",
  gemSwap: "ジェムスワップ",
  magneticBlocks: "磁石ブロック",
};

/** The family's own name in its own script. */
export const HOUSEKI_FAMILY_KANJI = "宝石";

/** The colour each gem is drawn in, with the symbol it always carries so no colour is told by colour alone; the package's own six. */
export const HOUSEKI_GEMS = {
  red: { fill: "#b5452c", symbol: "●" },
  blue: { fill: "#366f91", symbol: "◆" },
  green: { fill: "#3e7957", symbol: "▲" },
  gold: { fill: "#9c7117", symbol: "■" },
  purple: { fill: "#765785", symbol: "+" },
  teal: { fill: "#287b7b", symbol: "☾" },
} as const;

/** The six gem colours the engines use, in the package's order. */
export type HousekiColour = keyof typeof HOUSEKI_GEMS;
