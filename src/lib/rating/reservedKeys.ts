import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import { playerKey } from "./playerKey";

/**
 * Names no live game may ever rate. "remembered" and "honorary" legacy
 * players are both reserved — neither has a live account here, so neither
 * name is up for a stranger to claim. An "elsewhere" record belongs to a
 * live member playing under their own name, so it reserves nothing; blocking
 * it would lock them out of their own ladder. Whoever types a reserved name
 * still plays their casual game; `recordResult` simply declines to touch
 * either ladder for it, the same way a blank name declines.
 * See legacyPlayers.data.ts.
 */
export const RESERVED_PLAYER_KEYS: ReadonlySet<string> = new Set(
  LEGACY_PLAYERS.filter((player) => player.kind !== "elsewhere").map((player) => playerKey(player.slug)),
);

export function isReservedKey(key: string): boolean {
  return RESERVED_PLAYER_KEYS.has(key);
}
