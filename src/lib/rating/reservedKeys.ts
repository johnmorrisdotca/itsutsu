import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import { playerKey } from "./playerKey";

/**
 * Names no live game may ever rate. Every legacy player's slug is reserved
 * automatically — remembered here, never up for a stranger to claim. Whoever
 * types a reserved name still plays their casual game; recordResult and
 * recordVariantResult simply decline to touch the ladder for it, the same
 * way a blank name declines. See legacyPlayers.data.ts.
 */
export const RESERVED_PLAYER_KEYS: ReadonlySet<string> = new Set(
  LEGACY_PLAYERS.map((player) => playerKey(player.slug)),
);

export function isReservedKey(key: string): boolean {
  return RESERVED_PLAYER_KEYS.has(key);
}
