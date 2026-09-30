import type { BigTwoGame } from "./bigTwo/bigTwo.types";
import { BIG_TWO_RULES } from "./bigTwo/bigTwoRules";
import type { CardGameKind } from "./cardGames.constants";
import type { CardGameRules } from "./cardGames.types";
import type { ClimbMove } from "./climbing/climbing.types";
import type { CrazyEightsGame, CrazyEightsMove } from "./crazyEights/crazyEights.types";
import { CRAZY_EIGHTS_RULES } from "./crazyEights/crazyEightsRules";
import type { EuchreGame, EuchreMove } from "./euchre/euchre.types";
import { EUCHRE_RULES } from "./euchre/euchreRules";
import type { GinGame, GinMove } from "./ginRummy/ginRummy.types";
import { GIN_RUMMY_RULES } from "./ginRummy/ginRummyRules";
import type { GoFishGame, GoFishMove } from "./goFish/goFish.types";
import { GO_FISH_RULES } from "./goFish/goFishRules";
import type { HeartsGame, HeartsMove } from "./hearts/hearts.types";
import { HEARTS_RULES } from "./hearts/heartsRules";
import type { PresidentGame, PresidentMove } from "./president/president.types";
import { PRESIDENT_RULES } from "./president/presidentRules";
import type { SpadesGame, SpadesMove } from "./spades/spades.types";
import { SPADES_RULES } from "./spades/spadesRules";

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
};

/**
 * EVERY FAMILY CARD GAME'S RULES, by kind: what a table plays and what the
 * simulation and the party gate play out. A mapped type, so a new card game
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
};
