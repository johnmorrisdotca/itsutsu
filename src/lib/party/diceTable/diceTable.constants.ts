import type { PartySpec } from "../party.types";

/**
 * THE PLAIN DICE TABLES' SPECS, free of their rules so a page that only names a
 * game does not carry them. Held to the rules' own lists by `diceTables.test.ts`.
 */
export const DICE_TABLE_SPECS = {
  pig: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 2, sizes: [50, 100], defaultSize: 100 },
  tenThousand: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 2, sizes: [2000, 5000, 10000], defaultSize: 10000 },
  liarsDice: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 3, sizes: [3, 5], defaultSize: 5 },
  sayu: { fewestPlayers: 2, mostPlayers: 8, defaultPlayers: 4, sizes: [2, 3, 5], defaultSize: 3 },
} as const satisfies Record<string, PartySpec>;

/** The plain dice games, in the order their shelf shows them. */
export const DICE_TABLE_KINDS = ["pig", "tenThousand", "liarsDice", "sayu"] as const;

export type DiceTableKind = (typeof DICE_TABLE_KINDS)[number];
