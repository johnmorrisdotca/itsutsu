import { GAME_COPY } from "@/components/game/game.constants";

/**
 * What running out of time costs, said two ways.
 *
 * A control and a sentence want different words for the same rule. An option
 * in a select is a name — the reader is choosing between three things and
 * needs to tell them apart — and a select is as wide as its longest option,
 * so a sentence in there pushes the control out of its panel. Under the
 * control, and in the statement of a game already being played, there is room
 * to say what it actually means.
 */
export function penaltyName(penalty: string): string {
  if (penalty === "game") return GAME_COPY.penaltyGameShort;
  if (penalty === "game-strict") return GAME_COPY.penaltyStrictShort;
  return GAME_COPY.penaltyTurnShort;
}

/** The same rule as a sentence, for a hint or a statement. */
export function penaltyMeans(penalty: string): string {
  if (penalty === "game") return GAME_COPY.penaltyGame;
  if (penalty === "game-strict") return GAME_COPY.penaltyStrict;
  return GAME_COPY.penaltyTurn;
}
