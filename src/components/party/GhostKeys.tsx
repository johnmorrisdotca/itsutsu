"use client";

import { useEffect, useState } from "react";

import { KanaKeyboard } from "@/components/puzzles/KanaKeyboard";
import { WordKeyboard } from "@/components/puzzles/WordKeyboard";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, BUTTON_TAP } from "@/components/ui/ui.constants";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { cycleMark, toggleSize } from "@/lib/puzzles/gomojiKana/kanaMarks";
import type { PartyLanguage } from "@/lib/party/party.types";
import { partyPlayerName } from "@/lib/party/partyNames";
import { GHOST_END, GHOST_PHASE, answerProblem, foldGhostLetter, foldGhostWord } from "@/lib/party/superghost/superghost";
import type { GhostAnswerProblem, GhostEnd } from "@/lib/party/superghost/superghost.types";

import { GHOST_COPY, ghostShown } from "./party.constants";
import type { GhostKeysProps } from "./party.types";

const NOTHING: ReadonlyMap<string, never> = new Map<string, never>();

/**
 * WHAT THE PLAYER TO MOVE PRESSES, and nothing they may not.
 *
 * On a turn: the keyboard for a letter — the Gomoji's own keys, QWERTY for
 * English and the gojūon for Japanese — then Add before or Add after (or a tap
 * on either end of the fragment), or, instead, Challenge, naming who is being
 * challenged. When challenged: the same keyboard with Enter, to type the word
 * they had in mind; the game checks it and says why one is not taken, and "I
 * can't name one" gives the round up.
 *
 * A computer's keyboard works too: a letter, then ← or → for its end; Enter
 * and Backspace as they read.
 */
export function GhostKeys({ game, pending, onPending, onMove, judge }: GhostKeysProps) {
  const [typed, setTyped] = useState("");
  const [problem, setProblem] = useState<{ kind: GhostAnswerProblem; word: string } | null>(null);
  const language = game.language;
  const answering = game.phase === GHOST_PHASE.answering;
  const waiting = judge === null;

  const letter = (key: string) => {
    if (answering) {
      setTyped((was) => was + key);
      setProblem(null);
      return;
    }
    const folded = foldGhostLetter(language, key);
    if (folded !== null) onPending(folded);
  };
  const back = () => {
    if (!answering) return onPending(null);
    setTyped((was) => [...was].slice(0, -1).join(""));
    setProblem(null);
  };
  const place = (end: GhostEnd) => {
    if (pending !== null) onMove({ kind: "letter", letter: pending, end });
  };
  const enter = () => {
    if (judge === null || typed.trim() === "") return;
    const word = foldGhostWord(language, typed);
    const found = word === null ? "letters" : answerProblem(game, word, judge);
    if (found === null && word !== null) return onMove({ kind: "answer", word });
    setProblem({ kind: found ?? "letters", word: typed });
  };

  // A computer's keys, as the Gomoji takes them: nothing typed into a box elsewhere on the page is taken.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || waiting) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select") !== null) return;
      if (event.key.length === 1 && foldGhostLetter(language, event.key) !== null) {
        event.preventDefault();
        letter(event.key.toLowerCase());
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        back();
      } else if (event.key === "Enter" && answering) {
        event.preventDefault();
        enter();
      } else if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !answering) {
        event.preventDefault();
        place(event.key === "ArrowLeft" ? GHOST_END.before : GHOST_END.after);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const keyboard =
    language === "english" ? (
      <WordKeyboard known={NOTHING} style={WORD_STYLES.tiles} disabled={waiting} onLetter={letter} onEnter={answering ? enter : undefined} onBack={back} />
    ) : (
      <KanaKeyboard
        known={NOTHING}
        typed={NOTHING}
        last={answering && typed !== "" ? [...typed].at(-1)! : null}
        style={WORD_STYLES.tiles}
        disabled={waiting}
        onKana={letter}
        onSmall={() => setTyped((was) => changeLast(was, toggleSize))}
        onMark={() => setTyped((was) => changeLast(was, cycleMark))}
        onEnter={answering ? enter : undefined}
        onBack={back}
      />
    );

  if (answering && game.challenger !== null) {
    const name = partyPlayerName(game, game.toPlay);
    const fragment = ghostShown(game.fragment, language);
    return (
      <div className="flex flex-col gap-3" data-testid="ghost-answer">
        <p className="text-sm font-medium">{GHOST_COPY.answer(name, partyPlayerName(game, game.challenger))}</p>
        <div
          className="flex min-h-12 items-center rounded-lg border border-rule-strong bg-paper px-3 text-2xl font-bold tracking-wide"
          data-testid="ghost-typed"
          aria-label={GHOST_COPY.typed}
        >
          {ghostShown(typed, language)}
          <span className="ml-0.5 inline-block h-7 w-0.5 animate-pulse bg-ink/60" aria-hidden="true" />
        </div>
        {keyboard}
        {/* Always in its place, so the keyboard never moves under a finger when a word is refused. */}
        <p className={`min-h-10 text-sm font-semibold ${problem === null ? "invisible" : ""}`} data-testid="ghost-problem" data-problem={problem?.kind} role="status">
          {problem === null ? "\u00a0" : problemWords(problem, fragment, game.shortest, language)}
        </p>
        <button type="button" onClick={() => onMove({ kind: "concede" })} className={`${BUTTON_TAP} ${BUTTON_QUIET}`} data-testid="ghost-concede">
          {GHOST_COPY.cannot}
        </button>
      </div>
    );
  }

  const shown = pending === null ? null : ghostShown(pending, language);
  const last = game.lastBy === null ? null : partyPlayerName(game, game.lastBy);
  return (
    <div className="flex flex-col gap-3" data-testid="ghost-turn-keys" data-pending={pending ?? ""}>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => place(GHOST_END.before)} disabled={pending === null} className={`${BUTTON_TAP} ${BUTTON_STRONG}`} data-testid="ghost-add-before">
          ← {GHOST_COPY.addBefore(shown)}
        </button>
        <button type="button" onClick={() => place(GHOST_END.after)} disabled={pending === null} className={`${BUTTON_TAP} ${BUTTON_STRONG}`} data-testid="ghost-add-after">
          {GHOST_COPY.addAfter(shown)} →
        </button>
      </div>
      {keyboard}
      <button
        type="button"
        onClick={() => onMove({ kind: "challenge" })}
        disabled={last === null || waiting}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} min-h-12`}
        data-testid="ghost-challenge"
        title={last === null ? GHOST_COPY.noChallenge : undefined}
      >
        {GHOST_COPY.challenge(last)}
      </button>
      <p className="text-xs text-muted">{language === "english" ? GHOST_COPY.pick : GHOST_COPY.pickJapanese}</p>
    </div>
  );
}

/** The last kana typed, made small or large, or given its mark, as the kana Gomoji's keys do. */
function changeLast(typed: string, change: (kana: string) => string): string {
  const kana = [...typed];
  const last = kana.pop();
  return last === undefined ? typed : [...kana, change(last)].join("");
}

/** Why a word is not taken, in words. */
function problemWords(problem: { kind: GhostAnswerProblem; word: string }, fragment: string, shortest: number, language: PartyLanguage): string {
  switch (problem.kind) {
    case "letters":
      return GHOST_COPY.problems.letters;
    case "short":
      return GHOST_COPY.problems.short(shortest);
    case "missing":
      return GHOST_COPY.problems.missing(fragment);
    case "unknown":
      return GHOST_COPY.problems.unknown(ghostShown(problem.word, language));
  }
}
