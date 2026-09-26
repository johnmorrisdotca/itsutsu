/*
 * The count's look, kept here rather than in `puzzles.constants.ts`: that file
 * is stamped for the puzzles' pictures (`puzzleArtFingerprint.ts`), and a key
 * of the keyboard is in none of them.
 *
 * A pill in the key's own ink (`currentColor`), so it reads on every colour a
 * key takes — ivory on green, orange, grey and black, ink on a plain key or a
 * kana's yellow — and absolutely placed, so it takes no room: the key keeps
 * its size and the keyboard never shifts when a count appears.
 */
const KNOWN_COUNT =
  "pointer-events-none absolute -top-0.5 left-full ml-0.5 flex h-3 min-w-3 items-center justify-center rounded-full border border-current px-0.5 text-[0.55rem] leading-none font-bold normal-case";

/**
 * WHAT A LETTER KEY SAYS: its letter, and — when the guesses so far prove the
 * word holds it twice or more (`knownCounts`) — how many, as a small
 * superscript on the letter's top right. John, 2026-09-26, on a solved PRIOR:
 * "A Keyboard where a Letter was used twice should show the (2) count
 * superscript badge on the Letter R."
 *
 * On the letter rather than the key's corner, because the corner is where the
 * row being typed puts its own count (`WORD_KEY_COUNT`): the two say different
 * things and both can be true of one key at once.
 */
export function KeyFace({ letter, known }: { letter: string; known: number }) {
  return (
    <span className="relative">
      {letter}
      {known >= 2 ? (
        <span className={KNOWN_COUNT} aria-hidden="true" data-testid="key-known-count">
          {known}
        </span>
      ) : null}
    </span>
  );
}
