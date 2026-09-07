import {
  OPENING_RULES,
  OPENING_STAGES,
  SEAT_DISPLAY,
} from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import { GAME_COPY } from "./game.constants";
import type { SeatNames } from "./game.types";

/**
 * What the opening asks of the players right now, in a sentence, or null once
 * it asks nothing. This reads the opening state the engine keeps and never
 * decides anything itself.
 */
export function openingPrompt(state: GameState, names: SeatNames): string | null {
  const { settings, opening, moves } = state;
  const who = (seat: NonNullable<typeof opening.actor>) =>
    names[seat].trim() || SEAT_DISPLAY[seat].label;

  if (opening.stage === OPENING_STAGES.choosing && opening.actor !== null) {
    const extend =
      settings.opening === OPENING_RULES.swap2 && moves.length === 3;
    return `${who(opening.actor)}, ${extend ? GAME_COPY.chooseColourOrExtend : GAME_COPY.chooseColour}.`;
  }
  if (opening.stage === OPENING_STAGES.placing && opening.actor !== null) {
    return `${who(opening.actor)} ${GAME_COPY.laysThree}`;
  }
  if (opening.stage === OPENING_STAGES.extending && opening.actor !== null) {
    return `${who(opening.actor)} ${GAME_COPY.laysTwo}`;
  }

  switch (settings.opening) {
    case OPENING_RULES.pro:
      if (moves.length === 0) return GAME_COPY.opensAtTengen;
      if (moves.length === 2) return GAME_COPY.proBlack;
      return null;
    case OPENING_RULES.longPro:
      if (moves.length === 0) return GAME_COPY.opensAtTengen;
      if (moves.length === 2) return GAME_COPY.longProBlack;
      return null;
    case OPENING_RULES.rif:
      if (moves.length === 0) return GAME_COPY.opensAtTengen;
      if (moves.length === 1) return GAME_COPY.rifWhite;
      if (moves.length === 2) return GAME_COPY.rifBlack;
      return null;
    default:
      return null;
  }
}
