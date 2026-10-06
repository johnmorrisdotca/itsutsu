"use client";

import { useCallback, useRef, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PlayingNow } from "@/components/layout/PlayingNow";
import { EndGameButton, GameEnding, NewGameLink } from "@/components/play/GameEnding";
import { ENDINGS } from "@/components/play/gameEnding.constants";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, PLAY_SURFACE, SECTION_HEADING, SECTION_TITLE } from "@/components/ui/ui.constants";
import { HOUSEKI_KANJI, HOUSEKI_SPECS, levelsIn, levelsOf } from "@/lib/houseki/houseki.constants";
import { housekiQuery, housekiRequestKey } from "@/lib/houseki/housekiAddress";
import { dropRun, keepRun, runFor, winRequest, wonCount } from "@/lib/houseki/housekiProgress";
import type { HousekiKind, HousekiRequest } from "@/lib/houseki/houseki.types";
import { gamePath, housekiPlayPath, rulesPath, setUpPath } from "@/lib/gomoku/slugs";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { HousekiGameClient } from "./HousekiGameClient";
import { keepHouseki, useHousekiSave } from "./housekiStore";
import { todayUtc, type HousekiEnd } from "./housekiRuntime";
import { requestWords } from "./housekiWords";
import { HOUSEKI_LABEL } from "@/lib/houseki/housekiCopy";

type Phase = "playing" | "won" | "lost" | "complete" | "gaveUp";
type Counting = { state: "idle" } | { state: "sending" } | { state: "counted"; ip: number; first: boolean } | { state: "failed"; why: "signin" | "refused" | "unreachable" };

/** Whether winning this earns points: a level or the Daily, never a lesson or a free game. */
const paysPoints = (request: HousekiRequest): boolean => request.kind === "level" || request.kind === "daily";

/** The thing after this one, in its campaign, or null. */
function nextOf(kind: HousekiKind, request: HousekiRequest): HousekiRequest | null {
  if (request.kind === "level") return request.number < levelsIn(kind, request.campaign) ? { ...request, number: request.number + 1 } : null;
  if (request.kind === "lesson") return request.number < HOUSEKI_SPECS[kind].lessons ? { kind: "lesson", number: request.number + 1 } : null;
  return null;
}

/**
 * A HOUSEKI GAME, BEING PLAYED, at /games/<slug>/play?level=N and its kin.
 *
 * The board is the package's (`HousekiGameClient`, in the browser only);
 * everything round it is the site's: the result under the board, with Next level
 * and Try again, and the one row every kind of play has for ending a game and
 * starting another (`GameEnding`): Give up, which leaves the game unfinished, and
 * New game, which goes to the set-up and leaves this one where it is. Restart sits
 * by the board, because it is a press play needs and Just the board keeps it.
 *
 * What is kept is kept in this browser as the game is played (a checkpoint every
 * few seconds, and when the page is left), and what is won is written once to the
 * server, which plays the game again from its start before it counts and pays
 * (`/api/houseki/win`). A lesson and a free game earn nothing and write nothing.
 */
export function HousekiPlay({ kind, request, appearance }: { kind: HousekiKind; request: HousekiRequest; appearance: Appearance }) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const save = useHousekiSave();
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [score, setScore] = useState(0);
  const [title, setTitle] = useState("");
  const [counting, setCounting] = useState<Counting>({ state: "idle" });
  const lastEnd = useRef<HousekiEnd | null>(null);
  // The save this request had when the page opened: a restart or a second go begins afresh, so it is read once.
  const [resume, setResume] = useState<string | null | undefined>(undefined);
  if (resume === undefined && save !== undefined) setResume(runFor(save, kind, request)?.save ?? null);
  const key = housekiRequestKey(request);
  const next = nextOf(kind, request);
  const won = save === undefined ? 0 : wonCount(save, kind);

  const onKeep = useCallback(
    (text: string) => keepHouseki((was) => keepRun(was, kind, { request, save: text, at: Date.now() })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the request is named by its key.
    [kind, key],
  );

  const count = useCallback(
    async (end: HousekiEnd) => {
      setCounting({ state: "sending" });
      try {
        const response = await fetch("/api/houseki/win", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, request, save: end.save }),
        });
        if (response.status === 401) return setCounting({ state: "failed", why: "signin" });
        const body = (await response.json().catch(() => null)) as { ok?: boolean; ip?: number; first?: boolean } | null;
        if (response.ok && body?.ok === true && typeof body.ip === "number") return setCounting({ state: "counted", ip: body.ip, first: body.first === true });
        setCounting({ state: "failed", why: "refused" });
      } catch {
        setCounting({ state: "failed", why: "unreachable" });
      }
    },
    [kind, request],
  );

  const onEnd = useCallback(
    (end: HousekiEnd) => {
      lastEnd.current = end;
      setScore(end.score);
      setPhase(end.outcome);
      const done = end.outcome === "won" || end.outcome === "complete";
      // Finished, won or lost, the game is no longer waiting: only an unfinished one is kept.
      keepHouseki((was) => dropRun(done ? winRequest(was, kind, request, todayUtc()) : was, kind, request));
      if (done && paysPoints(request)) void count(end);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the request is named by its key.
    [kind, key, count],
  );

  const again = () => {
    keepHouseki((was) => dropRun(was, kind, request));
    setResume(null);
    lastEnd.current = null;
    setPhase("playing");
    setCounting({ state: "idle" });
    setRun((was) => was + 1);
  };
  const giveUp = () => {
    keepHouseki((was) => dropRun(was, kind, request));
    setPhase("gaveUp");
  };
  const ended = phase !== "playing";
  const what = requestWords(say, request);
  const label = HOUSEKI_LABEL[kind];

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      // Beside furniture that just the board takes away, the column is the whole of the modal (`data-bare-column`).
      data-bare-column
      data-testid="houseki-game"
      data-kind={kind}
      data-request={key}
      data-state={phase}
      {...readyMark(hydrated)}
    >
      {/* The column of the play: the game's board is its own column inside it (`BoardColumn`), and everything else here stands beside that board from a laptop's width. */}
      <div className="flex min-w-0 flex-col gap-3" data-houseki-game>
        <p className="text-sm font-medium" data-testid="houseki-line" aria-live="polite">
          {title === "" ? what : `${what} · ${title}`}
        </p>
        <PlayingNow on={phase === "playing"} />
        {save === undefined ? (
            <div className="mx-auto aspect-[3/4] w-full max-w-[22rem] rounded-md border border-rule bg-ivory" data-testid="houseki-board-loading" aria-busy="true" />
        ) : (
          <HousekiGameClient key={`${key}:${run}`} kind={kind} request={request} resume={run === 0 ? (resume ?? null) : null} run={run} appearance={appearance} onKeep={onKeep} onEnd={onEnd} onTitle={setTitle} stopped={phase === "gaveUp"} />
        )}
        {ended ? (
          <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="houseki-result" data-result={phase} role="status">
            <h2 className={SECTION_HEADING} data-testid="houseki-result-title">
              {phase === "won"
                ? say.say(request.kind === "lesson" ? "houseki.end.lessonDone" : "houseki.end.won", { what })
                : phase === "complete"
                  ? say.say(request.kind === "daily" ? "houseki.end.dailyDone" : "houseki.end.gameOver")
                  : phase === "lost"
                    ? say.say("houseki.end.lost")
                    : say.say("houseki.end.gaveUp")}
            </h2>
            <p className="text-sm">
              {phase === "gaveUp" ? say.say("houseki.end.gaveUpText", { what }) : phase === "lost" ? say.say(request.kind === "level" || request.kind === "lesson" ? "houseki.end.lostText" : "houseki.end.lostFree") : say.say("houseki.end.score", { score: say.number(score) })}
            </p>
            {phase === "won" || phase === "complete" ? <PointsLine counting={counting} request={request} onRetry={() => lastEnd.current !== null && void count(lastEnd.current)} /> : null}
            <div className="flex flex-wrap gap-2">
              {phase === "won" && next !== null ? (
                <Link href={housekiPlayPath(kind, housekiQuery(next))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="houseki-next">
                  {say.say(request.kind === "lesson" ? "houseki.end.nextLesson" : "houseki.end.nextLevel")}
                </Link>
              ) : null}
              <button type="button" onClick={again} className={`${BUTTON_BASE} ${phase === "won" && next !== null ? BUTTON_QUIET : BUTTON_STRONG}`} data-testid="houseki-again">
                {phase === "won" || phase === "complete" ? say.say("houseki.end.playAgain") : say.say("houseki.end.again")}
              </button>
              <Link href={setUpPath(kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="houseki-levels">
                {say.say("houseki.end.setUp")}
              </Link>
            </div>
          </div>
        ) : null}
        {/* The one row of presses every play has: Restart, which Just the board keeps, then Give up and New game, which it leaves out (`GameEnding`). */}
        <div className="flex flex-wrap items-center gap-2">
          {ended ? null : (
            <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} title={say.say("houseki.play.restartKeeps")} data-testid="houseki-restart">
              {say.say("houseki.play.restart")}
            </button>
          )}
          <GameEnding>
            <EndGameButton ending={ENDINGS.giveUp} onEnd={giveUp} disabled={ended} testId="houseki-give-up" />
            <NewGameLink href={setUpPath(kind)} testId="houseki-new" />
          </GameEnding>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <section className={`${PANEL_CLASS} flex flex-col gap-1.5`} data-chrome data-testid="houseki-progress">
          <h2 className={SECTION_TITLE}>
            {label} <span className="font-mincho normal-case tracking-normal">{HOUSEKI_KANJI[kind]}</span>
          </h2>
          <p className="text-sm">{save === undefined ? "" : say.say("houseki.card.wonOf", { won: say.number(won), levels: say.number(levelsOf(kind)) })}</p>
          <p className="text-xs text-muted">{say.say("houseki.play.kept")}</p>
        </section>
        <p className="text-sm" data-chrome>
          <Link href={rulesPath(kind)} className="underline underline-offset-4">
            {say.say("gamepages.rules")} →
          </Link>{" "}
          ·{" "}
          <Link href={gamePath(kind)} className="underline underline-offset-4">
            {say.say("houseki.play.about")} →
          </Link>
        </p>
      </aside>
      {/* "Are you still there?", as every board a person plays on asks (`idleWatch.coverage.test.ts`): an Arcade game pauses itself when the page is left, and the rest simply wait. */}
      <AskIfAway watching={phase === "playing"} detail={say.say("houseki.play.idleDetail")} kept={say.say("houseki.play.idleKept")} />
    </section>
  );
}

/** What became of the win: counted, being counted, or not. */
function PointsLine({ counting, request, onRetry }: { counting: Counting; request: HousekiRequest; onRetry: () => void }) {
  const say = useSpeaker();
  if (!paysPoints(request)) return <p className="text-xs text-muted">{say.say(request.kind === "lesson" ? "houseki.end.noPointsLesson" : "houseki.end.noPointsFree")}</p>;
  if (counting.state === "idle" || counting.state === "sending") return <p className="text-sm" data-testid="houseki-points" data-counting="sending">{say.say("houseki.end.counting")}</p>;
  if (counting.state === "counted") {
    return (
      <p className="text-sm font-medium" data-testid="houseki-points" data-counting="counted" data-ip={counting.ip}>
        {say.say(counting.first ? "houseki.end.countedFirst" : "houseki.end.countedAgain", { ip: say.number(counting.ip) })}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="houseki-points" data-counting="failed">
      <span>{say.say(counting.why === "signin" ? "houseki.end.failedSignIn" : counting.why === "unreachable" ? "houseki.end.failedUnreachable" : "houseki.end.failedRefused")}</span>
      {counting.why === "signin" ? null : (
        <button type="button" onClick={onRetry} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="houseki-points-retry">
          {say.say("houseki.end.retry")}
        </button>
      )}
    </div>
  );
}
