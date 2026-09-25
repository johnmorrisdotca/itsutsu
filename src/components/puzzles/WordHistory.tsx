import Link from "next/link";

import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import type { OwnWord } from "@/lib/puzzles/server/puzzleSolves";
import { decodeGuesses, decodeHidden, markGuess } from "@/lib/puzzles/wordDrop/code";

import { WORD_STONE_LOOK } from "./puzzles.constants";

/**
 * EVERY WORDDROP WORD A MEMBER HAS PLAYED, newest first: the word, whether it
 * was found and on which guess, what it scored, and the guesses themselves as
 * small stones in their colours. John, 2026-09-25: "shouldn't we show the
 * history of guesses/words that the user has ever played? with score?"
 *
 * A word not found is here too, with what it scored for the letters it found.
 * A word found before its guesses were kept shows the word and its score, and
 * says its guesses were not kept rather than drawing nothing.
 */
export function WordHistory({ words, total }: { words: readonly OwnWord[]; total: number }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="word-history">
      <h2 className={SECTION_TITLE}>
        Your words <span className="font-mincho normal-case tracking-normal">言葉</span>
        {total > 0 ? <span className="ml-2 normal-case tracking-normal text-muted">{total}</span> : null}
      </h2>
      {words.length === 0 ? (
        <p className="text-sm text-muted">
          None yet.{" "}
          <Link href={setUpPath("wordDrop")} className="font-semibold text-ink underline-offset-2 hover:underline">
            Play one →
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-rule">
          {words.map((word) => (
            <WordRow key={word.id} word={word} />
          ))}
        </ul>
      )}
      {total > words.length ? <p className="text-xs text-muted">Your newest {words.length} of {total}.</p> : null}
    </section>
  );
}

function WordRow({ word }: { word: OwnWord }) {
  const hidden = decodeHidden(word.givens, word.size) ?? "";
  const guesses = word.answer === null ? null : decodeGuesses(word.answer, word.size);
  const outcome = word.solved ? `Found in ${guesses?.length ?? "?"}` : "Not found";
  return (
    <li className="flex flex-col gap-2 py-2" data-testid="word-history-row" data-solved={word.solved ? "true" : "false"}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-semibold tracking-wide uppercase" data-testid="word-history-word">
          {hidden}
        </span>
        <span className={`text-xs ${word.solved ? "text-moss" : "text-muted"}`}>{outcome}</span>
        <span className="text-xs text-muted">
          {PUZZLE_LEVEL_DISPLAY[word.level as PuzzleLevel]?.label ?? word.level} · {clockText(word.elapsedMs)} · {word.finishedAt.toISOString().slice(0, 10)}
        </span>
        <span className="ml-auto text-right leading-none" data-testid="word-history-points">
          <span className="font-semibold tabular-nums">{word.points}</span> <span className="text-[0.65rem] tracking-wide text-muted uppercase">points</span>
        </span>
      </div>
      {guesses === null ? (
        <p className="text-xs text-muted">Its guesses were not kept: it was played before they were.</p>
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5" aria-label={`Guesses: ${guesses.map((guess) => guess.toUpperCase()).join(", ")}`}>
          {guesses.map((guess, row) => {
            const marks = markGuess(guess, hidden);
            return (
              <span key={row} className="flex gap-0.5" aria-hidden="true">
                {[...guess].map((letter, at) => (
                  <span
                    key={at}
                    className="flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold uppercase shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
                    style={WORD_STONE_LOOK[marks[at]!]}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            );
          })}
        </div>
      )}
    </li>
  );
}
