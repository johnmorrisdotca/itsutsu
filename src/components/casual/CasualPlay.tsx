"use client";

import type { StatusEvent } from "@johnmorrisdotca/karakuri/play";
import { useCallback, useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { EndGameButton, GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { ENDINGS } from "@/components/play/gameEnding.constants";
import { PlayingNow } from "@/components/layout/PlayingNow";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, PLAY_SURFACE, SECTION_HEADING, SECTION_TITLE } from "@/components/ui/ui.constants";
import { CASUAL_SPECS } from "@/lib/casual/casual.constants";
import { casualCopy } from "@/lib/party/partyCopy";
import type { CasualKind } from "@/lib/casual/casual.types";
import { leaveLevel, startLevel, winLevel, wonLevels } from "@/lib/casual/casualProgress";
import { casualPlayPath, gamePath, rulesPath, setUpPath } from "@/lib/gomoku/slugs";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CasualBoardClient } from "./CasualBoardClient";
import { keepCasual, useCasualSave } from "./casualStore";
import { casualWords } from "@/components/casual/casualWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

type Phase = "playing" | "won" | "lost" | "gaveUp";

/**
 * A CASUAL GAME, BEING PLAYED, at /games/<slug>/play?level=N.
 *
 * The board is the package's (`CasualBoard`); everything round it is the
 * site's: the result under the board, Next level and Try again, and the one
 * row every kind of play has for ending a game and starting another
 * (`GameEnding`): Give up, which leaves the level unsolved, and New game, which
 * goes to the set-up screen and leaves this level where it is. Restart sits by
 * the board, because it is a press play needs and Just the board keeps it.
 *
 * What is kept is kept at once and only in this browser (`casualStore.ts`): a
 * level begun is the one in progress, a level won is won for good. Nothing is
 * sent anywhere, scored, rated or counted: a casual game has no points and no
 * experience (docs/plans/casual-games/README.md).
 */
export function CasualPlay({ kind, level }: { kind: CasualKind; level: number }) {
  const say = useSpeaker();
  const CASUAL_COPY = casualWords(say.locale);
  const hydrated = useHydrated();
  const save = useCasualSave();
  const spec = CASUAL_SPECS[kind];
  const copy = casualCopy(kind, say.locale);
  const story = kind === "choiceStory";
  const last = level >= spec.levels;
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [text, setText] = useState("");
  const [info, setInfo] = useState("");

  const onStatus = useCallback(
    (event: StatusEvent) => {
      setInfo(event.info);
      setText(event.text);
      setPhase((was) => (was === "gaveUp" ? was : event.status));
      if (event.status === "won") keepCasual((was) => winLevel(was, kind, level));
      else if (event.status === "playing") keepCasual((was) => startLevel(was, kind, level));
    },
    [kind, level],
  );

  const again = () => {
    setPhase("playing");
    setText("");
    setRun((was) => was + 1);
  };
  const giveUp = () => {
    setPhase("gaveUp");
    keepCasual((was) => leaveLevel(was, kind));
  };
  const ended = phase !== "playing";
  const won = save === undefined ? 0 : wonLevels(save, kind).length;

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="casual-game"
      data-kind={kind}
      data-level={level}
      data-state={phase}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <p className="text-sm font-medium" data-testid="casual-line" aria-live="polite">
          {say.say("casual.levelOf", { word: CASUAL_COPY.levelWord(story), level: String(level), total: String(spec.levels) })}
          {info === "" ? "" : ` · ${info}`}
        </p>
        <PlayingNow on={phase === "playing"} />
        <div className={phase === "gaveUp" ? "pointer-events-none opacity-60" : ""}>
          <CasualBoardClient kind={kind} level={level} run={run} onStatus={onStatus} />
        </div>
        {phase === "won" || phase === "lost" || phase === "gaveUp" ? (
          <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="casual-result" data-result={phase} role="status">
            <h2 className={SECTION_HEADING} data-testid="casual-result-title">
              {phase === "won" ? CASUAL_COPY.wonTitle(level, story) : phase === "lost" ? CASUAL_COPY.lostTitle : CASUAL_COPY.gaveUpTitle}
            </h2>
            <p className="text-sm">{phase === "gaveUp" ? CASUAL_COPY.gaveUpText(level, story) : text}</p>
            {phase === "won" && last ? <p className="text-sm">{CASUAL_COPY.allDone}</p> : null}
            <div className="flex flex-wrap gap-2">
              {phase === "won" && !last ? (
                <Link href={casualPlayPath(kind, level + 1)} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="casual-next">
                  {story ? CASUAL_COPY.nextStory : CASUAL_COPY.next}
                </Link>
              ) : null}
              <button type="button" onClick={again} className={`${BUTTON_BASE} ${phase === "won" && !last ? BUTTON_QUIET : BUTTON_STRONG}`} data-testid="casual-again">
                {phase === "won" ? CASUAL_COPY.playAgain : CASUAL_COPY.again}
              </button>
              <Link href={setUpPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="casual-levels">
                {CASUAL_COPY.levels}
              </Link>
            </div>
          </div>
        ) : null}
        {/* The one row of presses every play has: Restart, which Just the board keeps, then Give up and New game, which it leaves out (`GameEnding`). */}
        <div className="flex flex-wrap items-center gap-2">
          {ended ? null : (
            <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} title={CASUAL_COPY.restartKeeps} data-testid="casual-restart">
              {CASUAL_COPY.restart}
            </button>
          )}
          <GameEnding>
            <EndGameButton ending={ENDINGS.giveUp} onEnd={giveUp} disabled={ended} testId="casual-give-up" />
            <NewGameLink href={setUpPath(kind)} testId="casual-new" />
          </GameEnding>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <section className={`${PANEL_CLASS} flex flex-col gap-1.5`} data-chrome data-testid="casual-progress">
          <h2 className={SECTION_TITLE}>
            {say.pairsWithKanji ? copy.label : copy.kanji} {say.pairsWithKanji ? <span className="font-mincho normal-case tracking-normal">{copy.kanji}</span> : null}
          </h2>
          <p className="text-sm">{save === undefined ? "" : CASUAL_COPY.wonOf(won, spec.levels, story)}</p>
          <p className="text-xs text-muted">{CASUAL_COPY.never}</p>
        </section>
        <p className="text-sm" data-chrome>
          <Link href={rulesPath(kind)} className="underline underline-offset-4">
            {CASUAL_COPY.rulesLink} →
          </Link>{" "}
          ·{" "}
          <Link href={gamePath(kind)} className="underline underline-offset-4">
            {CASUAL_COPY.about} →
          </Link>
        </p>
      </aside>
      {/* "Are you still there?", as every board a person plays on asks (`idleWatch.coverage.test.ts`): nothing here has a clock, so it only says the level waits. */}
      <AskIfAway watching={phase === "playing"} detail={CASUAL_COPY.idleDetail} kept={CASUAL_COPY.idleKept} />
    </section>
  );
}
