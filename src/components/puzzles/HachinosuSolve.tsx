"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_SURFACE, ROOM_FOR_A_WORD, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { isWord } from "@/lib/puzzles/gomoji/code";
import { checkHachinosu } from "@/lib/puzzles/hachinosu/check";
import { encodeFound, HIVE_LANGUAGES, HIVE_LONGEST, lettersProblem, readFound, readHive, wordPoints } from "@/lib/puzzles/hachinosu/code";
import { commonWordsOf } from "@/lib/puzzles/hachinosu/generate";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { ENTER_KEY } from "@/lib/ui/keyNames.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HachinosuWords } from "./hachinosu/HachinosuFound";
import { HachinosuHive } from "./hachinosu/HachinosuHive";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";

const SAID: Record<string, PhraseKey> = {
  short: "pword.hachinosu.tooShort",
  centre: "pword.hachinosu.needsCentre",
  letters: "pword.hachinosu.notInHive",
  listed: "pword.hachinosu.notListed",
  found: "pword.hachinosu.already",
};

/**
 * Solving a Hachinosu: words from seven letters, the centre in every one, until they are worth the goal.
 *
 * The words found are one string (`hachinosu/code.ts`), what is kept half way and handed in at the end. A letter is
 * pressed on the hive or typed, and Enter sends the word: nothing a player types is refused until they send it, and then
 * it says why, and the word stays to be mended. The list is a word's only judge, loaded before this page
 * is drawn (`PuzzlePlay`, `preparePuzzle`), and the check the server runs is the same list.
 */
export function HachinosuSolve({ puzzle, hasAccount, race = null, resumed = null }: { puzzle: Puzzle; hasAccount: boolean; race?: SolveRace | null; resumed?: ResumedRun | null }) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const { kind, size, seed, givens } = puzzle;
  const hive = useMemo(() => readHive(givens), [givens]);
  const language = HIVE_LANGUAGES[size]!;
  const [found, setFound] = useState<readonly string[]>(() => (resumed === null ? [] : (readFound(resumed.progress) ?? [])));
  const [typed, setTyped] = useState("");
  const [said, setSaid] = useState<string | null>(null);
  const [round, setRound] = useState(hive?.letters ?? "");
  const code = encodeFound(found);
  const { elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: code, resumed }, false, true);
  const live = done === null && !pausing.paused;
  const points = found.reduce((sum, word) => sum + wordPoints(word), 0);
  const goal = hive?.goal ?? 0;

  const press = useCallback(
    (letter: string) => {
      if (!live) return;
      begin();
      setSaid(null);
      setTyped((so) => (so.length >= HIVE_LONGEST ? so : so + letter));
    },
    [live, begin],
  );
  const rub = useCallback(() => {
    if (!live) return;
    setSaid(null);
    setTyped((so) => so.slice(0, -1));
  }, [live]);
  const send = useCallback(() => {
    if (!live || hive === null || typed === "") return;
    const problem = lettersProblem(hive, typed);
    const listed = problem === null && isWord(typed, typed.length, language);
    const said2 = problem ?? (!listed ? "listed" : found.includes(typed) ? "found" : null);
    if (said2 !== null) {
      setSaid(said2);
      return;
    }
    const at = begin();
    const next = [...found, typed];
    setFound(next);
    setTyped("");
    setSaid(null);
    const answer = encodeFound(next);
    if (checkHachinosu(size, givens, answer).ok) void finish(answer, at);
  }, [live, hive, typed, language, found, begin, size, givens, finish]);
  const shuffle = () => {
    // The same letters in another order, for a fresh look at them. Nothing about the puzzle depends on it, so it needs no seed.
    const rest = [...round];
    for (let at = rest.length - 1; at > 0; at -= 1) {
      const other = Math.floor(Math.random() * (at + 1));
      [rest[at], rest[other]] = [rest[other]!, rest[at]!];
    }
    setRound(rest.join(""));
  };

  /* The keyboard, anywhere on the page but a box to type in. */
  const latest = useRef({ press, rub, send, hive });
  useEffect(() => {
    latest.current = { press, rub, send, hive };
  });
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const { press: pressed, rub: rubbed, send: sent, hive: asked } = latest.current;
      if (event.key === ENTER_KEY) {
        event.preventDefault();
        sent();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        rubbed();
      } else if (asked !== null && /^[a-zA-Z]$/.test(event.key)) {
        const letter = event.key.toLowerCase();
        if ((asked.centre + asked.letters).includes(letter)) {
          event.preventDefault();
          pressed(letter);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const missed = useMemo(() => (done === null || hive === null ? [] : commonWordsOf(size, hive.centre, hive.letters).filter((word) => !found.includes(word))), [done, hive, size, found]);
  if (hive === null) return null;
  const button = `${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ${ROOM_FOR_A_WORD} px-3 py-1 text-sm`;

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-code={code} data-goal={goal} data-points={points} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <HachinosuHive centre={hive.centre} letters={round} onLetter={press} disabled={!live} />
      </SolvePaused>
      {done === null ? (
        <>
          <div className="flex min-h-10 items-center justify-center rounded-md border border-rule text-xl font-semibold tracking-widest uppercase" data-testid="hachinosu-typed" data-typed={typed} aria-live="polite">
            {typed}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={button} onClick={rub} disabled={!live || typed === ""} data-testid="hachinosu-delete">
              {say.say("pword.hachinosu.delete")}
            </button>
            <button type="button" className={button} onClick={shuffle} disabled={!live} data-testid="hachinosu-shuffle">
              {say.say("pword.hachinosu.shuffle")}
            </button>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} ${TAP_HEIGHT} ${ROOM_FOR_A_WORD} px-4 py-1 text-sm`} onClick={send} disabled={!live || typed === ""} data-testid="hachinosu-enter">
              {say.say("pword.hachinosu.enter")}
            </button>
          </div>
          <span className="min-h-5 text-sm text-muted" data-testid="hachinosu-said" data-said={said ?? undefined} aria-live="polite">
            {said === null ? say.say("pword.hachinosu.howTo", { letter: hive.centre.toUpperCase() }) : say.say(SAID[said]!, { letter: hive.centre.toUpperCase() })}
          </span>
        </>
      ) : null}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium tabular-nums" data-testid="hachinosu-points">
          {say.say("pword.hachinosu.points", { points: say.number(points), goal: say.number(goal) })}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full border border-rule" aria-hidden="true">
          <div className="h-full bg-moss" style={{ width: `${Math.min(100, goal === 0 ? 0 : (points / goal) * 100)}%` }} />
        </div>
        <HachinosuWords words={found} testId="hachinosu-found" />
      </div>
      {done === null ? null : (
        <>
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} />
          <div className="flex flex-col gap-2" data-testid="hachinosu-missed-box">
            <p className="text-sm font-medium">{say.say("pword.hachinosu.missed")}</p>
            <HachinosuWords words={missed} testId="hachinosu-missed" />
          </div>
        </>
      )}
    </section>
  );
}
