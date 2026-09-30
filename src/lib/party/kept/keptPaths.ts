// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { gamePath, passAndPlayPath } from "../../gomoku/slugs";

/**
 * A game played on one device and filed in its player's history, as an
 * address: `/games/<slug>/kept/<id>`, a facet of its game like a match or a
 * table. Opening it offers the game back to the device it is opened on, to be
 * carried on with or looked at (`KeptOpen`). Members only, as every table is.
 */
export function keptGamePath(game: string, id: string): string {
  return `${gamePath(game)}/kept/${id}`;
}

/** Where a game on one device is played: its table on this device. */
export function keptTablePath(game: string): string {
  return passAndPlayPath(game);
}
