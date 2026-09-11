import type { RuleVariant } from "./gomoku.types";

/** A piece of artwork for a game: where it is, what it shows, and who made it. */
export type GameBackground = {
  /** A path under public/, so it is served as a file rather than optimised. */
  src: string;
  alt: string;
  credit: string;
};

/**
 * Background art, by game. EMPTY, AND HONESTLY SO.
 *
 * The address /games/<slug>/background is part of the scheme — every game has
 * one place its artwork lives — and it was laid out before any art existed.
 * This table is what makes that truthful rather than a promise: it holds a row
 * for each picture that has actually been made, and today it holds none, so
 * every game's background page says there is nothing there yet.
 *
 * It is a TABLE rather than a look at the filesystem on purpose. Asking
 * `public/` whether a file is present while serving a page makes the answer
 * depend on how a deployment lays its static files out — and it answers one
 * way on a build machine and another on a running site, which is how the
 * screenshot check on the old rules page came to be removed. A row here is a
 * fact in the repository, checked by the compiler and visible in a diff.
 *
 * Adding one: put the file in `public/art/backgrounds/`, add its row, and the
 * page picks it up. Nothing else needs changing.
 */
export const GAME_BACKGROUNDS: Partial<Record<RuleVariant, GameBackground>> = {};

/**
 * The artwork for a game, or null when none has been made.
 *
 * Null rather than a stand-in. A plausible-looking picture returned for "there
 * is nothing here" is the shape of mistake this codebase keeps finding: a
 * value in range that also means "I do not know", read later as the first.
 */
export function backgroundFor(variant: RuleVariant): GameBackground | null {
  return GAME_BACKGROUNDS[variant] ?? null;
}
