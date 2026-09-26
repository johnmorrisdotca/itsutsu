/**
 * THE WORD THAT DODGES YOU: Gomoji Nige 逃げ文字, our version of the Absurdle
 * idea. Nothing is hidden when the puzzle opens. Every guess is answered with
 * the colours that leave the MOST words still possible, and the word is found
 * only when one word is left and it is the one guessed.
 *
 * It never cheats. Every answer is the colours some real word of the list
 * would give, and every later answer keeps to all the colours already shown,
 * so at every moment the words still standing are exactly the words that
 * would have coloured every row the way it was coloured. Whichever of them
 * the player pins down, the board was true of it from the first row.
 *
 * Deterministic in the seed, like every puzzle here: when two ways to answer
 * leave the same number of words, the seed breaks the tie (`tieBreak`), so a
 * seed is one dodger in every browser, today's seed one for everybody, and the
 * server can replay a solve to check it without being told anything more than
 * the guesses. Generic over the marking, so the lettered Gomojis and kana both
 * dodge with their own colours (`DodgeMarker`).
 */

/** How one guess is coloured against one word, written as a string so two colourings can be compared and counted. */
export type DodgeMarker = (guess: string, word: string) => string;

/** How many places of a colouring are plain green, for the tie-break: fewer greens is the dodge. */
export type GreenCounter = (pattern: string) => number;

/** 32-bit FNV-1a of a seed and a colouring: the seed's own order among colourings that leave as many words. */
function tieBreak(seed: number, pattern: string): number {
  let value = 0x811c9dc5;
  for (const char of `${seed}#${pattern}`) {
    value ^= char.codePointAt(0)!;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

export type DodgeStep = { pattern: string; left: readonly string[] };

/**
 * One guess answered: the words still standing grouped by the colours the
 * guess would get from each, and the biggest group kept. Ties go to the group
 * with fewer greens (so the word is found only when nothing else is left),
 * then to the seed's order. Never the all-green group while another group
 * stands: a found word is one the dodger had no other way out of.
 */
export function dodge(standing: readonly string[], guess: string, seed: number, mark: DodgeMarker, greens: GreenCounter): DodgeStep {
  const groups = new Map<string, string[]>();
  for (const word of standing) {
    const pattern = mark(guess, word);
    const group = groups.get(pattern);
    if (group === undefined) groups.set(pattern, [word]);
    else group.push(word);
  }
  let best: string | null = null;
  for (const pattern of groups.keys()) {
    if (best === null) {
      best = pattern;
      continue;
    }
    const size = groups.get(pattern)!.length;
    const bestSize = groups.get(best)!.length;
    if (size !== bestSize) {
      if (size > bestSize) best = pattern;
      continue;
    }
    const green = greens(pattern);
    const bestGreen = greens(best);
    if (green !== bestGreen) {
      if (green < bestGreen) best = pattern;
      continue;
    }
    if (tieBreak(seed, pattern) < tieBreak(seed, best)) best = pattern;
  }
  if (best === null) return { pattern: "", left: [] };
  return { pattern: best, left: groups.get(best)! };
}

/**
 * Every guess answered in order, from the whole list: the colouring each got
 * and the words still standing after the last. Replayed from the guesses
 * alone, which is how a solve page, a replay and the server all agree on
 * what each row said.
 */
export function replayDodge(pool: readonly string[], guesses: readonly string[], seed: number, mark: DodgeMarker, greens: GreenCounter): { patterns: string[]; left: readonly string[] } {
  let left = pool;
  const patterns: string[] = [];
  for (const guess of guesses) {
    const step = dodge(left, guess, seed, mark, greens);
    patterns.push(step.pattern);
    left = step.left;
  }
  return { patterns, left };
}

/**
 * The word the board stands for now: the first of the words still standing,
 * in the list's order. Any of them would colour every row as it was coloured,
 * so marking the rows against this one draws the board truly, and it is the
 * word shown when the rows run out. Empty only for guesses no word fits,
 * which a replay of real guesses never reaches.
 */
export function dodgeWord(left: readonly string[]): string {
  return left[0] ?? "";
}

/** Whether the guesses end on the word: the last left nothing standing but itself. */
export function dodgeFound(guesses: readonly string[], left: readonly string[]): boolean {
  const last = guesses[guesses.length - 1];
  return last !== undefined && left.length === 1 && left[0] === last;
}

/**
 * A way to pin a dodger down, for the generator's solution and the tests:
 * each guess the one of a sample of the words still standing, and of the
 * whole list, whose answer leaves the fewest, the sample drawn in the seed's order so it is the
 * same in every browser. Returns the guesses, ending on the word, or null when
 * `most` guesses were not enough.
 */
export function pinDown(pool: readonly string[], seed: number, mark: DodgeMarker, greens: GreenCounter, most: number, sample = 60): string[] | null {
  let left = pool;
  const guesses: string[] = [];
  while (guesses.length < most) {
    // Words still standing, and as many from the whole list: a word already ruled out often splits the rest better.
    const tries = [...(left.length <= sample ? left : spread(left, sample, seed + guesses.length)), ...(left.length <= 2 ? [] : spread(pool, sample, seed - guesses.length))];
    let pick = tries[0]!;
    let pickLeft = Infinity;
    for (const guess of tries) {
      const leaves = dodge(left, guess, seed, mark, greens).left.length;
      // A guess that is itself the last word standing wins outright.
      const score = leaves === 1 && left.length === 1 ? 0 : leaves;
      if (score < pickLeft) {
        pick = guess;
        pickLeft = score;
      }
    }
    guesses.push(pick);
    left = dodge(left, pick, seed, mark, greens).left;
    if (dodgeFound(guesses, left)) return guesses;
  }
  return null;
}

/** `count` words spread through a list, starting at a place the seed chooses: a sample that is the same in every browser. */
function spread(words: readonly string[], count: number, seed: number): string[] {
  const step = words.length / count;
  const offset = (Math.abs(seed) % 997) / 997;
  return Array.from({ length: count }, (_, at) => words[Math.floor((at + offset) * step) % words.length]!);
}
