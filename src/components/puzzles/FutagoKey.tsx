/*
 * The split key's look, kept here rather than in `puzzles.constants.ts`: that
 * file is stamped for the puzzles' pictures (`puzzleArtFingerprint.ts`), and a
 * key of the keyboard is in none of them — the same reason `KeyFace` keeps its
 * own.
 */

/** A split key: plain until a half says something, its colour carried by the halves under the letter. */
export const FUTAGO_KEY = "overflow-hidden bg-ivory/80 text-ink";

/** A half of a split key nothing is known of yet: the plain key's own paper. */
const HALF_PLAIN = "bg-ivory/80";

/**
 * The letter over two colours: on a small pale chip of its own, so it reads
 * in ink over any pair — green beside grey, orange beside plain paper — where
 * neither the key's ivory nor its ink would read on both halves at once.
 */
export const FUTAGO_KEY_LETTER = "relative z-10 rounded bg-ivory/85 px-1 leading-tight text-ink";

/**
 * A FUTAGO'S KEY, SPLIT DOWN THE MIDDLE (`futago.ts`): its left half coloured
 * with what the first board's guesses have said of the letter, its right half
 * with the second board's, as Dordle splits its keys. John's ticket,
 * 2026-09-26: "each keyboard key is split into two halves showing each
 * board's colour." Drawn under the letter, filling the key, and taking no
 * room, so a split keyboard is exactly as big as a plain one.
 */
export function FutagoKeyHalves<Mark extends string>({ marks, marked }: { marks: readonly [Mark | undefined, Mark | undefined]; marked: Record<Mark, string> }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex" aria-hidden="true" data-testid="futago-key-halves">
      {marks.map((mark, board) => (
        <span key={board} className={`h-full w-1/2 ${mark === undefined ? HALF_PLAIN : marked[mark]}`} data-board={board} data-mark={mark ?? ""} />
      ))}
    </span>
  );
}

/** What a screen reader hears of a split key's two halves: "first word: in its place; second word: not in it". */
export function futagoKeyWords<Mark extends string>(marks: readonly [Mark | undefined, Mark | undefined], words: Record<Mark, string>): string {
  const said = (mark: Mark | undefined) => (mark === undefined ? "not tried" : words[mark]);
  return `first word: ${said(marks[0])}; second word: ${said(marks[1])}`;
}
