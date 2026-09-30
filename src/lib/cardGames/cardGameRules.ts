import { CARD_GAME_RULES as TORANPU_RULES } from "@johnmorrisdotca/toranpu";
import type { CardGamePlays } from "@johnmorrisdotca/toranpu";

import type { CardGameKind } from "./cardGames.constants";
import type { CardGameRules } from "./cardGames.types";

export type { CardGamePlays };

/**
 * EVERY FAMILY CARD GAME'S RULES, by kind: Toranpu's own rule objects, the
 * very same ones, typed as the party table takes them. A mapped type, so a new
 * card game does not compile until its rules are here.
 */
export const CARD_GAME_RULES: { [K in CardGameKind]: CardGameRules<CardGamePlays[K]["game"], CardGamePlays[K]["move"]> } = TORANPU_RULES;
