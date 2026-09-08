import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import { playerKey } from "./playerKey";

/**
 * Names no live game may ever rate. Only "remembered" legacy players are
 * reserved — someone who never played here, never up for a stranger to
 * claim. An "elsewhere" record belongs to a live member playing under their
 * own name, so it reserves nothing; blocking it would lock them out of their
 * own ladder. Whoever types a reserved name still plays their casual game;
 * recordResult and recordVariantResult simply decline to touch the ladder
 * for it, the same way a blank name declines. See legacyPlayers.data.ts.
 */
export const RESERVED_PLAYER_KEYS: ReadonlySet<string> = new Set(
  LEGACY_PLAYERS.filter((player) => player.kind === "remembered").map((player) => playerKey(player.slug)),
);

export function isReservedKey(key: string): boolean {
  return RESERVED_PLAYER_KEYS.has(key);
}
