/**
 * How alike two pieces of this site's prose are.
 *
 * One job, kept apart from the rules that use it: a board row's title and a
 * changelog note are two sentences written months apart about the same
 * request, and the question is whether they are about the same request. That
 * is a measurement, and it is the only part of the backfill with any judgement
 * in it, so it is testable on its own.
 *
 * What makes it harder than it looks is that this changelog is 200 entries
 * about one small site, so the obvious words carry no information at all.
 * "A champions page with a ladder for every game" and "Every game and variant
 * on one plain page" share `page`, `every` and `game` and are two different
 * requests. `champions` and `ladder` are what tell them apart, and `大リバーシ`
 * tells one apart from everything.
 */

/**
 * Words too common in this changelog to be evidence of anything.
 *
 * Not a general stopword list. `game`, `board`, `page`, `player` and `move`
 * are the subject of the whole site, so they carry no more information here
 * than `the` does — which is exactly why they are in the same list.
 */
const COMMON: ReadonlySet<string> = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "from", "by", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "that", "this", "as", "not", "no",
  "but", "so", "than", "then", "when", "where", "which", "who", "what", "how", "why",
  "has", "have", "had", "do", "does", "did", "can", "cannot", "may", "will", "would",
  "one", "two", "every", "each", "any", "all", "own", "same", "other", "more", "most",
  "you", "your", "yours", "my", "mine", "me", "they", "them", "their", "there", "here",
  "game", "board", "page", "site", "player", "move", "variant",
  "up", "out", "over", "into", "about", "before", "after", "now", "between", "under",
  "new", "old", "first", "last", "still", "already", "nothing", "somebody", "anybody",
  "rather", "instead", "just", "only", "even", "also", "way", "thing", "per", "set",
  "say", "says", "said", "make", "makes", "made", "get", "gets", "take", "takes",
  "show", "shows", "see", "seen", "read", "reads", "give", "gives", "keep", "keeps",
]);

/** A run of CJK — kana, kanji — is one token, and a very distinctive one. */
const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿]+/gu;
const LATIN = /[a-z0-9]+(?:[-'][a-z0-9]+)*/g;

/**
 * A word reduced to its commonest form, so a row's `ladders` and a note's
 * `ladder` are one word rather than two that miss each other.
 *
 * Deliberately crude — a trailing `s`, `es` or `ies`, and nothing else. A
 * real stemmer would fold `rating` into `rate` and `flipping` into `flip`,
 * which sounds like an improvement and is not: it also folds words that are
 * genuinely different, and every fold makes two unlike rows look more alike.
 * The plural was the fold actually costing matches here, measured on the real
 * board; the rest is left alone.
 */
export function singular(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("sses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("es") && !word.endsWith("ees")) return word.slice(0, -1);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1);
  return word;
}

/**
 * The words of a line that could identify a row: lowercased Latin runs of
 * three characters or more that are not the site's own vocabulary, singularised,
 * plus every CJK run whole.
 *
 * A key tokenises the same way as a title once its hyphens are spaces, so
 * `grand-reversi-on-a-bigger-board` and `Grand Reversi 大リバーシ, the flipping
 * game on ten by ten` reinforce each other rather than needing two rules.
 */
export function words(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(CJK)) found.push(match[0]);
  const latin = text.toLowerCase().replace(CJK, " ");
  for (const match of latin.matchAll(LATIN)) {
    const word = match[0];
    if (word.length < 3) continue;
    if (COMMON.has(word)) continue;
    const stem = singular(word);
    if (COMMON.has(stem)) continue;
    found.push(stem);
  }
  return found;
}

/** The distinct distinctive words of a row: its title and its key together. */
export function rowWords(row: { title: string; key: string }): string[] {
  return [...new Set([...words(row.title), ...words(row.key.replace(/-/g, " "))])];
}

/**
 * How rare each word is across the releases: a word in one release's notes is
 * evidence, a word in ninety is not.
 *
 * The weight is `1 / (1 + releases containing it)`, so a word seen once
 * weighs half and a word seen in thirty releases weighs a thirty-first. No
 * logarithm: the shape wanted is "rare words decide", and this is the
 * simplest function with that shape and nothing to tune in it.
 */
export function wordWeights(releases: readonly { notes: readonly string[] }[]): Map<string, number> {
  const seenIn = new Map<string, number>();
  for (const release of releases) {
    for (const word of new Set(words(release.notes.join(" ")))) {
      seenIn.set(word, (seenIn.get(word) ?? 0) + 1);
    }
  }
  const weights = new Map<string, number>();
  for (const [word, count] of seenIn) weights.set(word, 1 / (1 + count));
  return weights;
}

/** A word the changelog has never used weighs what a word used once weighs. */
const UNSEEN_WEIGHT = 1 / 2;

export type Match = {
  /** How much of the row's distinctive wording this release accounted for, 0–1. */
  score: number;
  /** Which of the row's words the release actually used. */
  matched: string[];
};

/**
 * How much of a row's distinctive wording one release accounts for.
 *
 * A word the changelog has never used anywhere gets the weight of a word seen
 * once. It cannot help a match, and it must not be allowed to make a real
 * match look thin by sitting in the denominator with a large weight of its own.
 */
export function matchAgainst(
  rowTerms: readonly string[],
  notes: readonly string[],
  weights: ReadonlyMap<string, number>,
): Match {
  const inRelease = new Set(words(notes.join(" ")));
  const matched: string[] = [];
  let hit = 0;
  let total = 0;
  for (const term of rowTerms) {
    const weight = weights.get(term) ?? UNSEEN_WEIGHT;
    total += weight;
    if (inRelease.has(term)) {
      hit += weight;
      matched.push(term);
    }
  }
  return { score: total === 0 ? 0 : hit / total, matched };
}

/** A title, flattened for comparing one against another: no case, no punctuation. */
function flatten(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** The words of a title, for counting how much of one a note has quoted. */
export function titleLength(title: string): number {
  return flatten(title).split(" ").filter((word) => word.length > 0).length;
}

/**
 * The longest run of words a row's title and a release note share, as a share
 * of the title.
 *
 * A note repeating six of a title's eight words IN ORDER is quoting it. Six of
 * the same words scattered is a coincidence two sentences about the same small
 * site can easily have, which is why this measures the run and not the overlap.
 */
export function sharedRun(title: string, note: string): number {
  const left = flatten(title).split(" ").filter((word) => word.length > 0);
  const right = ` ${flatten(note)} `;
  if (left.length === 0) return 0;
  let best = 0;
  for (let start = 0; start < left.length; start += 1) {
    for (let end = start + best + 1; end <= left.length; end += 1) {
      if (right.includes(` ${left.slice(start, end).join(" ")} `)) best = end - start;
      else break;
    }
  }
  return best / left.length;
}

/** The longest run any one of a release's notes quotes from this title. */
export function bestSharedRun(title: string, notes: readonly string[]): number {
  let best = 0;
  for (const note of notes) best = Math.max(best, sharedRun(title, note));
  return best;
}
