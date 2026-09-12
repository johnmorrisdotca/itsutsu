import { PHRASE_LENGTH } from "@/lib/phrase/phrase";

/**
 * Where the four words sit on the screen, which is the person's business and
 * nobody else's.
 *
 * THE ORDER NEVER REACHES THE SERVER, AND THAT IS THE DESIGN. A phrase is a
 * SET of four words: `canonicalPhrase` sorts them before anything is hashed,
 * so "acid mango yo-yo zebra" and "zebra acid yo-yo mango" are one credential.
 * Nothing in the ticket changes when a word is moved, and nothing here asks
 * the ticket to.
 *
 * What moving is FOR is the person. Four words arranged into an order you
 * find memorable is most of how you remember them — "yo-yo zebra" is a
 * picture, "zebra yo-yo" is two words — and sliding a word into place is
 * simply satisfying, which matters on a screen a child uses. John asked for
 * it twice. Do not remove the feature as pointless on the grounds that the
 * order does not matter: it does not matter to the hash, and it matters to
 * her.
 *
 * So there are two lists. The ticket's `slots` say WHICH words are kept and
 * are the only authority on that. The arrangement says WHERE each is shown,
 * and is reconciled to the ticket after every draw: a word still kept stays
 * in the box the person put it in, a word taken out leaves its box empty, and
 * a word newly kept goes into the first empty box, which is where a person
 * expects the next word to land.
 *
 * Pure, the way the engine is: every function returns a new arrangement and
 * leaves its input untouched, and `swapBoxes` hands back the very same list
 * when asked for a move that means nothing, so a caller can tell a no-op from
 * a change by identity alone.
 */

/** The boxes as they are shown: a kept word, or nothing yet. */
export type Arrangement = (string | null)[];

export function emptyArrangement(length: number = PHRASE_LENGTH): Arrangement {
  return Array.from({ length }, () => null);
}

/**
 * The boxes after the ticket changed.
 *
 * Counted as a multiset rather than a set, so a repeated word — which the
 * picker never offers, but which `canonicalPhrase` deliberately accepts — is
 * two boxes and not one. See phrase.ts on why nothing may collapse a repeat.
 * A word on screen that the ticket does not hold is dropped rather than
 * trusted: the ticket is signed and this is not.
 */
export function reconcileArrangement(
  shown: readonly (string | null)[],
  kept: readonly (string | null)[],
): Arrangement {
  const pool = kept.filter((word): word is string => word !== null);
  const boxes = emptyArrangement(kept.length);
  for (let index = 0; index < kept.length; index += 1) {
    const word = shown[index] ?? null;
    if (word === null) continue;
    const at = pool.indexOf(word);
    if (at === -1) continue;
    pool.splice(at, 1);
    boxes[index] = word;
  }
  for (const word of pool) {
    const empty = boxes.indexOf(null);
    if (empty === -1) break;
    boxes[empty] = word;
  }
  return boxes;
}

/**
 * The word in one box changes places with whatever is in another — a word, or
 * nothing, in which case it has simply moved.
 *
 * An empty box is not carried anywhere, a box is not moved onto itself, and
 * nothing is moved out of range: each of those hands back the same list.
 */
export function swapBoxes(shown: Arrangement, from: number, to: number): Arrangement {
  const inRange = (index: number) => Number.isInteger(index) && index >= 0 && index < shown.length;
  if (!inRange(from) || !inRange(to) || from === to) return shown;
  if (shown[from] === null) return shown;
  const boxes = [...shown];
  boxes[to] = shown[from];
  boxes[from] = shown[to];
  return boxes;
}
