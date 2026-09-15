import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { turnPassedBy } from "@/lib/gomoku/rules/forcedPass";
import { headStartTurnTaken } from "@/lib/gomoku/rules/headStart";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";
import { GAME_COPY } from "./game.constants";

/**
 * The sentence saying a turn passed because its player had no move, for the
 * reader of this board — or null when nobody's did.
 *
 * Read from the record through `turnPassedBy`, never kept, so both boards of a
 * live game say the same thing about the same move, and a page opened
 * afterwards says it too. The passed player is told it was theirs; the other
 * side is told it came back to them; somebody watching, or two people at one
 * screen, are told whose it was.
 */
export function passedTurnWords(state: GameState, viewer: Stone | null): string | null {
  // A turn a head start took is a pass too, and says why: it was given, not missing.
  const given = headStartTurnTaken(state);
  if (given !== null) {
    if (viewer === given.stone) return GAME_COPY.headStartYours(given.turn, given.of);
    const who = STONE_DISPLAY[given.stone].label;
    return viewer !== null
      ? GAME_COPY.headStartToYou(who, given.turn, given.of)
      : GAME_COPY.headStartWatched(who, given.turn, given.of);
  }
  const passed = turnPassedBy(state);
  if (passed === null) return null;
  if (viewer === passed) return GAME_COPY.youHadNoMove;
  if (viewer !== null) return GAME_COPY.hadNoMoveToYou(STONE_DISPLAY[passed].label);
  return GAME_COPY.hadNoMove(STONE_DISPLAY[passed].label);
}
