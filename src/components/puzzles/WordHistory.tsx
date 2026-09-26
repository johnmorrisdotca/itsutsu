import Link from "@/components/ui/Link";

import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { mySolvePath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import type { OwnWord } from "@/lib/puzzles/server/puzzleSolves";
import { markGuess } from "@/lib/puzzles/gomoji/code";
import { boardGuesses, guessesOf, hiddenWordsOf, wordsShown } from "@/lib/puzzles/gomoji/futago";
import { wordModeDisplay } from "@/lib/puzzles/gomoji/yotsugo";
import { markKanaGuess } from "@/lib/puzzles/gomojiKana/kanaMarks";

import { WORD_STONE_LOOK } from "./puzzles.constants";
import { SolveTime } from "./SolveTime";
import { guessesTaken, guessesText } from "@/lib/puzzles/gomoji/guessesTaken";

/**
 * EVERY GOMOJI WORD A MEMBER HAS PLAYED, newest first: the word, whether it
 * was found and on which guess, what it scored, and the guesses themselves as
 * small stones in their colours. John, 2026-09-25: "shouldn't we show the
 * history of guesses/words that the user has ever played? with score?"
 *
 * A word not found is here too, with what it scored for the letters it found.
 * A word found before its guesses were kept shows the word and its score, and
 * says its guesses were not kept rather than drawing nothing.
 */
type WordKind = "gomoji" | "gomojiKana" | "gomojiMot" | "gomojiWort";

/**
 * The words and the guesses of a kept row, and each guess's colours, for any
 * Gomoji: one board, or a Futago's two (`futago.ts`), each with the guesses it
 * was shown.
 */
function readWord(kind: WordKind, word: OwnWord): { hidden: string; boards: { guesses: readonly string[]; marks: (guess: string) => ("hit" | "near" | "kin" | "miss")[] }[] | null } {
  const words = hiddenWordsOf(kind, word.size, word.givens)?.words ?? [""];
  const guesses = word.answer === null ? null : guessesOf(kind, word.size, word.answer);
  const marksAgainst = (hidden: string) => (guess: string) =>
    kind === "gomojiKana" ? markKanaGuess([...guess], [...hidden]).map((each) => each.mark) : markGuess(guess, hidden);
  return {
    hidden: words.length > 1 ? `${wordsShown(kind, words)} ${wordModeDisplay(words.length)?.kanji ?? ""}` : words[0]!,
    boards: guesses === null ? null : words.map((hidden) => ({ guesses: boardGuesses(guesses, hidden), marks: marksAgainst(hidden) })),
  };
}

export function WordHistory({ words, total, kind = "gomoji" }: { words: readonly OwnWord[]; total: number; kind?: WordKind }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="word-history">
      <h2 className={SECTION_TITLE}>
        Your words <span className="font-mincho normal-case tracking-normal">言葉</span>
        {total > 0 ? <span className="ml-2 normal-case tracking-normal text-muted">{total}</span> : null}
      </h2>
      {words.length === 0 ? (
        <p className="text-sm text-muted">
          None yet.{" "}
          <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
            Play one →
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule">
          {words.map((word) => (
            <WordRow key={word.id} word={word} kind={kind} />
          ))}
        </ul>
      )}
      {total > words.length ? <p className="text-xs text-muted">Your newest {words.length} of {total}.</p> : null}
    </section>
  );
}

function WordRow({ word, kind }: { word: OwnWord; kind: WordKind }) {
  const { hidden, boards } = readWord(kind, word);
  // Found in 3 of the 6 guesses the level gave (`guessesTaken`), as the boards say it.
  const taken = guessesTaken(kind, word.size, word.level, word.givens, word.answer);
  const outcome = word.solved ? (taken === null ? `Found in ${boards?.[0] === undefined ? "?" : Math.max(...boards.map((board) => board.guesses.length))}` : `Found in ${guessesText(taken)}`) : "Not found";
  return (
    <li className="flex flex-col gap-2 py-2" data-testid="word-history-row" data-solved={word.solved ? "true" : "false"}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link href={mySolvePath(kind, word.id)} className="font-semibold tracking-wide uppercase underline-offset-2 hover:underline" data-testid="word-history-word">
          {hidden}
        </Link>
        <span className={`text-xs ${word.solved ? "text-moss" : "text-muted"}`} data-testid="word-history-outcome">
          {outcome}
        </span>
        <span className="text-xs text-muted">
          {PUZZLE_LEVEL_DISPLAY[word.level as PuzzleLevel]?.label ?? word.level} · <SolveTime kind={kind} solveId={word.id} elapsedMs={word.elapsedMs} mine testId="word-history-time" /> · {word.finishedAt.toISOString().slice(0, 10)}
        </span>
        {/* This one word's points, and so the way into it, like its time and the word itself. */}
        <Link href={mySolvePath(kind, word.id)} className="ml-auto text-right leading-none underline-offset-2 hover:underline" data-testid="word-history-points">
          <span className="font-semibold tabular-nums">{word.points}</span> <span className="text-[0.65rem] tracking-wide text-muted uppercase">points</span>
        </Link>
      </div>
      {boards === null ? (
        <p className="text-xs text-muted">Its guesses were not kept: it was played before they were.</p>
      ) : (
        boards.map((board, at) => (
          <div key={at} className="flex flex-wrap gap-x-3 gap-y-1.5" aria-label={`Guesses: ${board.guesses.map((guess) => guess.toUpperCase()).join(", ")}`} data-testid="word-history-board">
            {board.guesses.map((guess, row) => {
              const marks = board.marks(guess);
              return (
                <span key={row} className="flex gap-0.5" aria-hidden="true">
                  {[...guess].map((letter, place) => (
                    <span
                      key={place}
                      className="flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold uppercase shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
                      style={WORD_STONE_LOOK[marks[place]!]}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              );
            })}
          </div>
        ))
      )}
    </li>
  );
}
