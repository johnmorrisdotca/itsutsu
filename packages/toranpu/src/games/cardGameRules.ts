import type { BigTwoGame } from "./bigTwo/bigTwo.types.ts";
import { BIG_TWO_RULES } from "./bigTwo/bigTwoRules.ts";
import type { CardGameKind } from "./cardGames.constants.ts";
import type { CardGameRules } from "./cardGames.types.ts";
import type { ClimbMove } from "./climbing/climbing.types.ts";
import type { CrazyEightsGame, CrazyEightsMove } from "./crazyEights/crazyEights.types.ts";
import { CRAZY_EIGHTS_RULES } from "./crazyEights/crazyEightsRules.ts";
import type { CribbageGame, CribbageMove } from "./cribbage/cribbage.types.ts";
import { CRIBBAGE_RULES } from "./cribbage/cribbageRules.ts";
import type { EuchreGame, EuchreMove } from "./euchre/euchre.types.ts";
import { EUCHRE_RULES } from "./euchre/euchreRules.ts";
import type { GinGame, GinMove } from "./ginRummy/ginRummy.types.ts";
import { GIN_RUMMY_RULES } from "./ginRummy/ginRummyRules.ts";
import type { GoFishGame, GoFishMove } from "./goFish/goFish.types.ts";
import { GO_FISH_RULES } from "./goFish/goFishRules.ts";
import type { HeartsGame, HeartsMove } from "./hearts/hearts.types.ts";
import { HEARTS_RULES } from "./hearts/heartsRules.ts";
import type { PresidentGame, PresidentMove } from "./president/president.types.ts";
import { PRESIDENT_RULES } from "./president/presidentRules.ts";
import type { SpadesGame, SpadesMove } from "./spades/spades.types.ts";
import { SPADES_RULES } from "./spades/spadesRules.ts";

/** Each card game's game and move, so its rules can be named with their own types. */
export type CardGamePlays = {
  hearts: { game: HeartsGame; move: HeartsMove };
  bigTwo: { game: BigTwoGame; move: ClimbMove };
  president: { game: PresidentGame; move: PresidentMove };
  goFish: { game: GoFishGame; move: GoFishMove };
  crazyEights: { game: CrazyEightsGame; move: CrazyEightsMove };
  spades: { game: SpadesGame; move: SpadesMove };
  ginRummy: { game: GinGame; move: GinMove };
  euchre: { game: EuchreGame; move: EuchreMove };
  cribbage: { game: CribbageGame; move: CribbageMove };
};

/**
 * EVERY CARD GAME'S RULES, by kind: what a table plays and what the
 * simulation plays out. A mapped type, so a new card game
 * does not compile until its rules are here.
 */
export const CARD_GAME_RULES: { [K in CardGameKind]: CardGameRules<CardGamePlays[K]["game"], CardGamePlays[K]["move"]> } = {
  hearts: HEARTS_RULES,
  bigTwo: BIG_TWO_RULES,
  president: PRESIDENT_RULES,
  goFish: GO_FISH_RULES,
  crazyEights: CRAZY_EIGHTS_RULES,
  spades: SPADES_RULES,
  ginRummy: GIN_RUMMY_RULES,
  euchre: EUCHRE_RULES,
  cribbage: CRIBBAGE_RULES,
};
