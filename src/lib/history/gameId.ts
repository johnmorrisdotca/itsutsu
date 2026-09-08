import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * A game's name in an address.
 *
 * A generated database id — cmtsrhw3g0000l404jrkan5v3 — is unreadable, and
 * every address on this site is meant to be read and said aloud. So a game
 * gets eight characters of its own, in two blocks of four: k3m9-p2qx.
 *
 * The alphabet is Crockford's base32 without the characters that argue with
 * each other on a screen or over a telephone — no 0 or O, no 1, I or L. That
 * leaves 32 letters and about a million million ids, which is far more than
 * this site will ever need and far too many to guess at, which matters once a
 * finished game is something anybody may look at.
 */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/** The shape, for anything that wants to recognise one: four, a dash, four. */
export const GAME_ID_PATTERN = /^[2-9a-hjkmnp-z]{4}-[2-9a-hjkmnp-z]{4}$/;

/** One id, drawn at random. The dash is part of it, so the address and the row agree. */
export function makeGameId(random: () => number = Math.random): string {
  const draw = (count: number) =>
    Array.from({ length: count }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join("");
  return `${draw(4)}-${draw(4)}`;
}

/**
 * An id no game has yet.
 *
 * A collision is vanishingly unlikely, and a game started every second for a
 * lifetime would not make it likely; but "unlikely" is not "impossible", and
 * the cost of being sure is one indexed read.
 */
export async function freeGameId(tries = 5): Promise<string> {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const id = makeGameId();
    const taken = await prisma.game.findUnique({ where: { id }, select: { id: true } });
    if (taken === null) return id;
  }
  throw new Error("Could not find a free game id.");
}
