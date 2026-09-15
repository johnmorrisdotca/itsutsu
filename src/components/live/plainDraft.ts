import { NO_HANDICAP, NO_HEAD_START, OPENING_RULES, boardSizesFor, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

import type { RulesDraft } from "./rulesDraft";
import type { KeptDefaults } from "./setUp.types";

/**
 * THE SET-UP SCREEN'S PLAIN PRE-FILL: a game somebody has not changed anything
 * about yet, for a game, a board and a pace already settled.
 *
 * Its own module, and client-safe, because two things have to agree on it.
 * `setUpFrom` opens the set-up screen with it. The lobby sentence on /games
 * links to that screen naming a game, a board and a pace, and says "Sit down
 * with X" only where the screen it leads to will offer X's seat — which it
 * decides against exactly this draft (`seatsTheSentenceOffers`). A second copy
 * of these values in the lobby would be a promise that drifts from the screen
 * that has to keep it.
 *
 * The caller decides the board and the pace; everything else is the ordinary
 * game — Free, no blocked points, rated, a per-move clock that costs the turn,
 * resigning allowed, no handicap.
 */
export function plainDraft({
  variant,
  size,
  moveTimeMs,
}: {
  variant: string;
  size: number;
  moveTimeMs: number | null;
}): RulesDraft {
  return {
    variant,
    size,
    obstacles: "none",
    opening: OPENING_RULES.free,
    moveTimeMs,
    timeoutPenalty: "turn",
    clockMode: "move",
    rated: true,
    allowResign: true,
    open: true,
    handicap: NO_HANDICAP,
    headStart: NO_HEAD_START,
  };
}

/**
 * WHAT SILENCE OPENS A GAME AT, FOR THIS READER: the plain game, on their own
 * standing board where the game has it and the game's first board where it does
 * not, at their own usual clock.
 *
 * Stated once because two places have to agree on it exactly. `setUpFrom` opens
 * the screen with it, and the screen leaves out of its own address every choice
 * that equals it (`keptParams`) — a choice left out is a choice silence has to
 * give back, so the two cannot be allowed to differ by a board.
 */
export function silentDraft({ variant, defaults }: { variant: RuleVariant; defaults: KeptDefaults }): RulesDraft {
  const sizes = boardSizesFor(variant);
  return plainDraft({
    variant,
    size: sizeForVariant(variant, sizes.includes(defaults.size) ? defaults.size : sizes[0]),
    moveTimeMs: defaults.moveTimeMs,
  });
}
