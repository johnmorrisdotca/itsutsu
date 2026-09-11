/**
 * Four words, and the rules about them.
 *
 * A member's four-word phrase is a PASSWORD — it proves who somebody is on a
 * device where somebody else is signed in, and on a device where nobody is —
 * so everything here is the shape of a credential rather than of a nickname.
 * What is hashed and stored lives in `phraseHash.ts`; this module is pure and
 * knows nothing about a database.
 *
 * TWO PROPERTIES THAT ARE THE WHOLE DESIGN, and neither is an implementation
 * detail somebody may tidy away:
 *
 * 1. ORDER DOES NOT MATTER. The phrase is a SET of four words, not a
 *    sequence. `canonicalPhrase` sorts, and BOTH setting and checking go
 *    through it — one normaliser, called twice, because two implementations of
 *    "what counts as the same phrase" drift, and a drift here locks somebody
 *    out of their own account with nothing on screen explaining why.
 *
 *    It costs log2(4!), about 4.6 bits. It buys something real: remembering a
 *    set is easier than remembering a sequence, which matters for the
 *    twelve-year-old this feature exists for, and it matters more with a tap
 *    grid — enforcing order would mean tapping four tiles in one particular
 *    sequence for no benefit whatever.
 *
 * 2. THE PICKER DOES NOT OFFER A WORD ALREADY KEPT — and this is an INTERFACE
 *    decision, not a rule about what a phrase may be. The reason is only that a
 *    tile which has to be tapped twice is a fiddly control. Sorting handles a
 *    repeat perfectly well, and allowing repeats would make the space very
 *    slightly larger rather than smaller, so there is no correctness or
 *    strength argument here at all.
 *
 *    What follows from that matters more than the rule does: `canonicalPhrase`
 *    ACCEPTS a repeat, and nothing on the entry path may refuse one. If a
 *    phrase with a repeated word ever exists — an older build, a fixture, a
 *    later change of mind — it has to stay enterable, or somebody is locked out
 *    of their own account with nothing on screen to explain it. And nothing
 *    anywhere may compare phrases as SETS, which would silently read four words
 *    with a repeat as three.
 */
import { WORDLIST } from "./wordlist.constants";

/** Words in a phrase. Four. See the wordlist's note on why not five. */
export const PHRASE_LENGTH = 4;

/** Words offered each round, of which the player keeps one. */
export const CANDIDATES_PER_ROUND = 4;

/**
 * What the words are joined with before hashing.
 *
 * A SPACE, and never a hyphen: one entry on EFF's short list is "yo-yo", so a
 * hyphen-joined phrase could be read two ways. No list word contains a space.
 */
export const PHRASE_SEPARATOR = " ";

/** The list as a set, built once, for the membership question asked most. */
const KNOWN = new Set(WORDLIST);

/** A word as the list spells it: trimmed and folded. Not a validity check. */
function fold(value: string): string {
  return value.trim().toLowerCase();
}

/** Whether this is one of the list's words, however it was capitalised or padded. */
export function isListWord(value: unknown): value is string {
  return typeof value === "string" && KNOWN.has(fold(value));
}

/**
 * How much a phrase is worth, in bits, counting the order-freedom against it.
 *
 * Computed rather than written down, so the number cannot quietly stop being
 * true when somebody changes the list or the word count. `phrase.test.ts`
 * asserts it, which is what makes a change to either a decision somebody has
 * to state rather than one that happens.
 */
export function phraseBits(): number {
  let combinations = 1;
  // Four distinct words from the list, order not counted: C(n, 4).
  for (let taken = 0; taken < PHRASE_LENGTH; taken += 1) {
    combinations *= (WORDLIST.length - taken) / (taken + 1);
  }
  return Math.log2(combinations);
}

/**
 * The one form of a phrase that is ever hashed, or null when the words are not
 * a phrase at all.
 *
 * Called by the path that SETS a phrase and by the path that CHECKS one. That
 * is the point of it existing: sorting, folding and the no-repeats rule are
 * decided here once, so the two paths cannot disagree about what the same four
 * words mean.
 *
 * Null rather than a best effort. A phrase is a credential, and a normaliser
 * that quietly drops a fifth word or accepts a word off the list would be
 * hashing something the player did not choose.
 */
export function canonicalPhrase(words: unknown): string | null {
  if (!Array.isArray(words) || words.length !== PHRASE_LENGTH) return null;
  const folded: string[] = [];
  for (const word of words) {
    if (typeof word !== "string") return null;
    const clean = fold(word);
    if (!KNOWN.has(clean)) return null;
    folded.push(clean);
  }
  /*
   * Sorted and joined, and that is the whole of the normalising. Sorting is
   * what makes any order the same phrase; a repeat is kept as the fourth word
   * it is, never folded away — see the header on why refusing one here would
   * be a way to lock somebody out.
   */
  return [...folded].sort().join(PHRASE_SEPARATOR);
}

/**
 * What is wrong with these words, in terms somebody could act on. Empty means
 * nothing is.
 *
 * Separate from `canonicalPhrase` on purpose. The normaliser answers one
 * question — is this a phrase, yes or no — and a credential path wants exactly
 * that and no detail. This is for the setup screen, where the player is
 * choosing and a reason is a help rather than a hint to an attacker.
 */
export function phraseProblems(words: unknown): string[] {
  if (!Array.isArray(words)) return ["That is not a phrase."];
  const problems: string[] = [];
  if (words.length !== PHRASE_LENGTH) {
    // Spelled out, because this is read by somebody choosing rather than parsed.
    problems.push(`A phrase is four words; this one has ${words.length}.`);
  }
  for (const word of words) {
    if (typeof word !== "string") {
      problems.push("One of those is not a word.");
      continue;
    }
    // A repeat is not a fault. See canonicalPhrase.
    if (!KNOWN.has(fold(word))) problems.push(`"${word}" is not one of the words offered.`);
  }
  return problems;
}

/**
 * Four words to offer, none of them already kept.
 *
 * `random` is passed in so this stays pure and a test can reproduce a draw,
 * the same way the game ids and member ids do it.
 *
 * NOTHING HERE IS PERSISTED, and that is a rule about the callers as much as
 * about this function: the candidates a player was shown are generated per
 * request and never written down — not in a column, not in a log — so there is
 * no record of what was offered for anybody to read back. Rerolling is
 * therefore free, and the player may ask for four more as many times as they
 * like: an attacker learns nothing from a reroll they cannot see, so the
 * search space is the whole list however many times the player looked.
 */
export function drawCandidates(
  kept: readonly string[],
  random: () => number = Math.random,
): string[] {
  const withheld = new Set(kept.filter((word) => typeof word === "string").map(fold));
  const offered: string[] = [];
  const chosen = new Set<string>();

  /*
   * A bounded walk rather than a while(true). A generator that keeps naming
   * the same index — a test's, or one that has gone wrong — must not spin: the
   * step past a collision is deterministic, so the loop covers the list.
   */
  for (let attempt = 0; offered.length < CANDIDATES_PER_ROUND; attempt += 1) {
    if (attempt > WORDLIST.length * 2) break;
    const drawn = Math.floor(random() * WORDLIST.length);
    const index = ((drawn % WORDLIST.length) + WORDLIST.length + attempt) % WORDLIST.length;
    const word = WORDLIST[index];
    if (withheld.has(word) || chosen.has(word)) continue;
    chosen.add(word);
    offered.push(word);
  }
  return offered;
}
