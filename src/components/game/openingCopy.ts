import {
  OPENING_RULES,
  OPENING_STAGES,
} from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import { seatName } from "@/lib/gomoku/seatWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { gameCopy } from "./game.constants";
import type { SeatNames } from "./game.types";

/**
 * What the opening asks of the players right now, in a sentence, or null once
 * it asks nothing. This reads the opening state the engine keeps and never
 * decides anything itself.
 */
export function openingPrompt(state: GameState, names: SeatNames, say: Speaker): string | null {
  const GAME_COPY = gameCopy(say);
  const { settings, opening, moves } = state;
  const who = (seat: NonNullable<typeof opening.actor>) =>
    names[seat].trim() || seatName(say, seat);

  if (opening.stage === OPENING_STAGES.choosing && opening.actor !== null) {
    const extend =
      settings.opening === OPENING_RULES.swap2 && moves.length === 3;
    return (extend ? GAME_COPY.chooseColourOrExtend : GAME_COPY.chooseColour)(who(opening.actor));
  }
  if (opening.stage === OPENING_STAGES.placing && opening.actor !== null) {
    return GAME_COPY.laysThree(who(opening.actor));
  }
  if (opening.stage === OPENING_STAGES.extending && opening.actor !== null) {
    return GAME_COPY.laysTwo(who(opening.actor));
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
    case OPENING_RULES.sakata:
      if (moves.length === 0) return GAME_COPY.opensAtTengen;
      if (moves.length === 1) return GAME_COPY.rifWhite;
      if (moves.length === 2) return GAME_COPY.rifBlack;
      if (moves.length === 4) return GAME_COPY.sakataFifth;
      return null;
    case OPENING_RULES.tarannikov:
      if (moves.length === 0) return GAME_COPY.opensAtTengen;
      if (moves.length < 5) return GAME_COPY.nestedStone(moves.length);
      return null;
    default:
      return null;
  }
}
