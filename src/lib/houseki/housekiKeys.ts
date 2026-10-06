import type { HousekiCampaign, HousekiKind } from "./houseki.types";

/**
 * EVERY PHRASE A HOUSEKI PAGE NAMES BY A KIND OR A CAMPAIGN, spelled out once as a
 * literal, because a phrase is held to be said by a page only where its key is
 * written whole (`i18n.coverage.test.ts`): `houseki.${kind}.tagline` built at run
 * time would be a phrase on no page as far as the gate can tell, and a dead one
 * would be indistinguishable from a live one. The table is `satisfies` the shape
 * every game must have, so a sixth game without a phrase does not compile.
 */
export const COPY_KEYS = {
  fallingTriplets: {
    tagline: "houseki.fallingTriplets.tagline",
    origin: "houseki.fallingTriplets.origin",
    board: "houseki.fallingTriplets.board",
    rules: ["houseki.fallingTriplets.ruleOne", "houseki.fallingTriplets.ruleTwo", "houseki.fallingTriplets.ruleThree", "houseki.fallingTriplets.ruleFour", "houseki.fallingTriplets.ruleFive", "houseki.fallingTriplets.ruleSix"],
    boardLabel: "houseki.fallingTriplets.boardLabel",
    keys: "houseki.fallingTriplets.keys",
  },
  colourChains: {
    tagline: "houseki.colourChains.tagline",
    origin: "houseki.colourChains.origin",
    board: "houseki.colourChains.board",
    rules: ["houseki.colourChains.ruleOne", "houseki.colourChains.ruleTwo", "houseki.colourChains.ruleThree", "houseki.colourChains.ruleFour", "houseki.colourChains.ruleFive", "houseki.colourChains.ruleSix"],
    boardLabel: "houseki.colourChains.boardLabel",
    keys: "houseki.colourChains.keys",
  },
  stoneCollapse: {
    tagline: "houseki.stoneCollapse.tagline",
    origin: "houseki.stoneCollapse.origin",
    board: "houseki.stoneCollapse.board",
    rules: ["houseki.stoneCollapse.ruleOne", "houseki.stoneCollapse.ruleTwo", "houseki.stoneCollapse.ruleThree", "houseki.stoneCollapse.ruleFour", "houseki.stoneCollapse.ruleFive", "houseki.stoneCollapse.ruleSix"],
    boardLabel: "houseki.stoneCollapse.boardLabel",
    keys: "houseki.stoneCollapse.keys",
  },
  gemSwap: {
    tagline: "houseki.gemSwap.tagline",
    origin: "houseki.gemSwap.origin",
    board: "houseki.gemSwap.board",
    rules: ["houseki.gemSwap.ruleOne", "houseki.gemSwap.ruleTwo", "houseki.gemSwap.ruleThree", "houseki.gemSwap.ruleFour", "houseki.gemSwap.ruleFive", "houseki.gemSwap.ruleSix"],
    boardLabel: "houseki.gemSwap.boardLabel",
    keys: "houseki.gemSwap.keys",
  },
  magneticBlocks: {
    tagline: "houseki.magneticBlocks.tagline",
    origin: "houseki.magneticBlocks.origin",
    board: "houseki.magneticBlocks.board",
    rules: ["houseki.magneticBlocks.ruleOne", "houseki.magneticBlocks.ruleTwo", "houseki.magneticBlocks.ruleThree", "houseki.magneticBlocks.ruleFour", "houseki.magneticBlocks.ruleFive", "houseki.magneticBlocks.ruleSix"],
    boardLabel: "houseki.magneticBlocks.boardLabel",
    keys: "houseki.magneticBlocks.keys",
  },
} as const satisfies Record<HousekiKind, { tagline: string; origin: string; board: string; rules: readonly string[]; boardLabel: string; keys: string }>;

/** A campaign's name, as the phrase that says it. */
export const CAMPAIGN_KEYS = {
  classic: "houseki.campaign.classic",
  shizen: "houseki.campaign.shizen",
  arashi: "houseki.campaign.arashi",
} as const satisfies Record<HousekiCampaign, string>;

/** The four ways to play, as the phrases that name them on the set-up. */
export const WAY_KEYS = {
  levels: "houseki.setup.levels",
  lessons: "houseki.setup.lessons",
  daily: "houseki.setup.daily",
  free: "houseki.setup.free",
} as const;
