"use client";

import { country } from "@johnmorrisdotca/kuni";
import { useCallback, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { ResultMark } from "@/components/game/ResultMark";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_STRONG, PLAY_SURFACE, SELECTABLE } from "@/components/ui/ui.constants";
import { viewHref } from "@/lib/history/myGamesViews";
import { joinQuery, playPath } from "@/lib/gomoku/slugs";
import { checkKuniate } from "@/lib/puzzles/kuniate/check";
import { KUNIATE_GUESS_COUNT, readGuesses, readQuestion } from "@/lib/puzzles/kuniate/code";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PuzzleWayBack } from "./PuzzleWayBack";
import { PuzzleWallpaper } from "./PuzzleWallpaper";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { KuniateClue, placeName } from "./kuniate/KuniateClue";
import { KuniateGuess } from "./kuniate/KuniateGuess";
import { KuniateRows } from "./kuniate/KuniateRows";

/**
 * Solving a Kuniate: a country shown by one thing about it, named in six guesses.
 *
 * The guesses are one string (`kuniate/code.ts`), and what is kept half way and handed in at
 * the end. The clock starts on the first guess. Found ends it as a solve; six wrong guesses end
 * it as a word whose guesses ran out ends, kept, with the answer shown (`runOut`). Loaded on its
 * own, in the browser only (`PuzzlePlay`): Kuni's lists and each country's outline are this game's to fetch, and no other puzzle carries them.
 */
export function KuniateSolve({ puzzle, hasAccount, race = null, resumed = null }: { puzzle: Puzzle; hasAccount: boolean; race?: SolveRace | null; resumed?: ResumedRun | null }) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const { kind, size, level, seed, givens } = puzzle;
  const hidden = readQuestion(givens, size) ?? "";
  const [guesses, setGuesses] = useState<readonly string[]>(() => {
    const kept = resumed === null ? null : readGuesses(resumed.progress);
    return kept !== null && !kept.includes(hidden) ? kept : [];
  });
  const code = guesses.join("");
  const { elapsedMs, done, begin, finish, runOut, pausing, clock } = useSolve(puzzle, hasAccount, race, null, { progress: code, resumed });
  const live = done === null && !pausing.paused;

  const guess = useCallback(
    (place: string) => {
      if (!live || guesses.includes(place) || guesses.length >= KUNIATE_GUESS_COUNT) return;
      const at = begin();
      const next = [...guesses, place];
      setGuesses(next);
      const answer = next.join("");
      if (checkKuniate(size, givens, answer, "found").ok) void finish(answer, at);
      else if (next.length === KUNIATE_GUESS_COUNT) void runOut(answer, at);
    },
    [live, guesses, begin, size, givens, finish, runOut],
  );

  const answerName = placeName(hidden, say.locale);
  const capital = country(hidden)?.capital?.[say.locale === "ja" ? "ja" : "en"];

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-code={code} data-hidden={done === null ? undefined : hidden} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <KuniateClue code={hidden} size={size} />
      </SolvePaused>
      {done === null ? <KuniateGuess guessed={guesses} disabled={!live} onGuess={guess} /> : null}
      <KuniateRows guesses={guesses} hidden={hidden} />
      {done === null ? (
        <span className="min-h-5 text-sm text-muted" data-testid="kuniate-said" aria-live="polite">
          {say.count("pword.kuniate.left", KUNIATE_GUESS_COUNT - guesses.length)}
        </span>
      ) : (
        <p className={`${SELECTABLE} text-base`} data-testid="kuniate-answer">
          <strong data-testid="kuniate-was">{answerName}</strong>
          {capital === undefined ? null : ` · ${say.say("pword.kuniate.capitalIs", { capital })}`}
        </p>
      )}
      {done === null ? null : done.outOfGuesses === true ? (
        <div className={`${SELECTABLE} flex flex-col gap-2`} data-testid="word-out">
          <p className="text-base" data-testid={done.outOfTime ? "puzzle-out-of-time" : undefined}>
            <ResultMark kind="failure" className="mr-1.5" />
            {done.outOfTime ? <Paired en={say.say("puzzle.outcome.outOfTime")} kanji="時間切れ" /> : say.say("pword.out.guesses", { rows: String(KUNIATE_GUESS_COUNT) })}
          </p>
          {hasAccount && race === null ? (
            <p className="text-xs text-muted" data-testid="word-kept">
              {done.paid !== null && done.paid.points > 0 ? say.say("pword.out.playedOutPaid", { points: String(done.paid.points) }) : ""}
              {say.say("pword.out.keptBefore")}
              {say.pairsWithKanji ? " " : ""}
              <Link href={viewHref("completed")} className="underline">
                {say.say("puzzle.done.keptLink")}
              </Link>
              {say.pairsWithKanji ? " " : ""}
              {say.say("pword.out.keptAfter")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2" data-testid="puzzle-way-on">
            <Link href={joinQuery(playPath(kind), puzzleQuery({ size, level, seed: null, checks: null, hints: false, clock }))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="word-another">
              {say.say("pword.kuniate.another")}
            </Link>
            <PuzzleWayBack kind={kind} />
          </div>
          <PuzzleWallpaper puzzle={puzzle} result={say.say("pword.out.guesses", { rows: String(KUNIATE_GUESS_COUNT) })} />
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} />
      )}
    </section>
  );
}
