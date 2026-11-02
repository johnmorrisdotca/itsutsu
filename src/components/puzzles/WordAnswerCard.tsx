"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { ResultMark } from "@/components/game/ResultMark";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { SELECTABLE } from "@/components/ui/ui.constants";

import { WORD_TILE_MARK } from "./puzzles.constants";

/** The widest a letter's tile is drawn: a word of five fills a phone's width and no tile outgrows this on a desk. */
const BIG_TILE = "4.25rem";
/** The same where the page hides several words, so four of them stack without the card growing past a screen. */
const SMALL_TILE = "3rem";

/** What the card says over the answer, and how the answer is laid out; the page decides it from the way the game ended. */
export type WordAnswerProps = {
  /** The line that names how it ended: "Out of 6 guesses", "Out of time", "Caught on row 2". */
  headline: string;
  /** The line over the word: "The word was", "The words were", or the dodger's "still hiding among 3 words, one of them". */
  label: string;
  /** The hidden word, or a Futago's two or a Yotsugo's four, as typed: kana as they are, letters in lower case (the card draws them in capitals). */
  words: readonly string[];
  /** Whether the clock ended it, which its line is found by (`puzzle-out-of-time`). */
  outOfTime?: boolean;
  /** Whether the words are kana, which are not put in capitals. */
  kana?: boolean;
};

/**
 * THE ANSWER, when a word is not found: the biggest thing in that part of the
 * screen. John, 2026-11-02: "when you finish… and get to the last guess and
 * lose… the text at the bottom showing you the actual word is too small and
 * does not look good. it should be obvious what the word was."
 *
 * The word is drawn as a row of green tiles, the colour the game gives a
 * letter that is right, each as large as the card's width allows, with the
 * word still written in letters for a screen reader and for copying. Under it
 * a kind line, because losing a word is not a failing: the way on is below.
 * Beside the board's replay, where the eye already is, in the place the old
 * line of small print stood, never moving what the replay draws.
 */
export function WordAnswerCard({ headline, label, words, outOfTime = false, kana = false }: WordAnswerProps) {
  const say = useSpeaker();
  const many = words.length > 1;
  const card = useRef<HTMLElement>(null);
  // On a short window the board fills the screen and the answer would be under it: bring it into view, by the least scroll, and gently unless the device asks for none.
  useEffect(() => {
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.current?.scrollIntoView({ block: "nearest", behavior: quiet ? "auto" : "smooth" });
  }, []);
  return (
    <section
      ref={card}
      className={`${SELECTABLE} flex flex-col items-center gap-2.5 rounded-2xl border border-rule bg-ivory/60 px-3 py-4 text-center sm:px-6`}
      data-testid="word-out-card"
      role="status"
    >
      <p className="text-base font-semibold" data-testid={outOfTime ? "puzzle-out-of-time" : "word-out-headline"}>
        <ResultMark kind="failure" className="mr-1.5" />
        {headline}
      </p>
      <p className="text-sm text-muted" data-testid="word-out-label">
        {label}
      </p>
      <div className={`flex w-full flex-col items-center ${many ? "gap-2" : ""}`} data-testid="word-was" role="group" aria-label={say.list(words.map((word) => (kana ? word : word.toUpperCase())))}>
        {words.map((word, at) => (
          <WordTiles key={`${at}-${word}`} word={word} kana={kana} limit={many ? SMALL_TILE : BIG_TILE} />
        ))}
      </div>
      <p className="text-sm text-muted" data-testid="word-out-kind">
        {say.say("pword.out.kind")}
      </p>
    </section>
  );
}

/** One word as tiles: as wide as the card lets them be, to a limit, and the letter sized from the tile (`cqw`), so a six-letter word shrinks together. */
function WordTiles({ word, kana, limit }: { word: string; kana: boolean; limit: string }) {
  const letters = [...word];
  return (
    <div
      className="w-full max-w-full"
      // The tile is the card's width over the letters, up to the limit; its letter is just over half of it.
      style={{ containerType: "inline-size", "--count": letters.length, "--limit": limit } as CSSProperties}
      data-testid="word-was-word"
    >
      <div className="mx-auto grid justify-center gap-1.5" style={{ gridTemplateColumns: "repeat(var(--count), minmax(0, var(--limit)))" }}>
        {letters.map((letter, at) => (
          <span
            key={`${at}-${letter}`}
            className={`flex aspect-square items-center justify-center rounded-lg border-2 font-bold leading-none ${WORD_TILE_MARK.hit} ${kana ? "" : "uppercase"}`}
            style={{ fontSize: "min(calc((100cqw / var(--count)) * 0.58), calc(var(--limit) * 0.58))" }}
            aria-hidden="true"
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
