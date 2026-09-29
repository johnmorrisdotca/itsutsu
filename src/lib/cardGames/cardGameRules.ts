import type { BigTwoGame } from "./bigTwo/bigTwo.types";
import { BIG_TWO_RULES } from "./bigTwo/bigTwoRules";
import type { CardGameKind } from "./cardGames.constants";
import type { CardGameRules } from "./cardGames.types";
import type { ClimbMove } from "./climbing/climbing.types";
import type { CrazyEightsGame, CrazyEightsMove } from "./crazyEights/crazyEights.types";
import { CRAZY_EIGHTS_RULES } from "./crazyEights/crazyEightsRules";
import type { GoFishGame, GoFishMove } from "./goFish/goFish.types";
import { GO_FISH_RULES } from "./goFish/goFishRules";
import type { HeartsGame, HeartsMove } from "./hearts/hearts.types";
import { HEARTS_RULES } from "./hearts/heartsRules";
import type { PresidentGame, PresidentMove } from "./president/president.types";
import { PRESIDENT_RULES } from "./president/presidentRules";

/** Each card game's game and move, so its rules can be named with their own types. */
export type CardGamePlays = {
  hearts: { game: HeartsGame; move: HeartsMove };
  bigTwo: { game: BigTwoGame; move: ClimbMove };
  president: { game: PresidentGame; move: PresidentMove };
  goFish: { game: GoFishGame; move: GoFishMove };
  crazyEights: { game: CrazyEightsGame; move: CrazyEightsMove };
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
};
