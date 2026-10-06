"use client";

import {
  advanceTicks,
  applyAction,
  createChallenge,
  createGame,
  createLevel,
  decodeGame,
  encodeGame,
  levelManifest,
  tutorialManifest,
  type CollapseCampaignLevel,
  type CollapseTutorialDefinition,
  type GameState,
} from "@johnmorrisdotca/houseki/stone-collapse";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { HOUSEKI_SPECS } from "@/lib/houseki/houseki.constants";

import { BoardColumn, Controls, ControlButton, GoalBar, Stat, StatRow } from "./HousekiParts";
import { HousekiWell, type WellCell } from "./HousekiWell";
import { freshSeed, todayUtc, useCheckpoints, useTickLoop, type HousekiGameProps } from "./housekiRuntime";

const SPEC = HOUSEKI_SPECS.stoneCollapse;
const TERMINAL = new Set(["won", "lost", "finished"]);

function contentOf(request: HousekiGameProps["request"]): { level: CollapseCampaignLevel | null; lesson: CollapseTutorialDefinition | null } {
  if (request.kind === "level") return { level: levelManifest[request.number - 1] ?? null, lesson: null };
  if (request.kind === "lesson") return { level: null, lesson: tutorialManifest[request.number - 1] ?? null };
  return { level: null, lesson: null };
}

function start(request: HousekiGameProps["request"]): GameState {
  const { level, lesson } = contentOf(request);
  if (level !== null) return createLevel(level.id);
  if (lesson !== null) {
    const { setup } = lesson;
    return createChallenge({ id: lesson.id, seed: `lesson:${lesson.id}`, width: setup.width, height: setup.height, colourCount: setup.colourCount, initialBoard: setup.board, goal: setup.goal, moveLimit: setup.moveLimit, witness: setup.witness });
  }
  if (request.kind === "daily") return createGame({ mode: "daily", dailyDate: todayUtc() });
  const size = SPEC.sizes.find((each) => request.kind === "free" && each.id === request.size) ?? SPEC.sizes[0]!;
  return createGame({ mode: "relaxed", preset: size.id as "compact" | "standard" | "wide" | "tall", colourCount: request.kind === "free" ? request.colours : 4, seed: freshSeed() });
}

function isOf(state: GameState, request: HousekiGameProps["request"]): boolean {
  const { level, lesson } = contentOf(request);
  const s = state.settings;
  if (level !== null) return s.challengeId === level.id;
  if (lesson !== null) return s.challengeId === lesson.id;
  if (request.kind === "daily") return s.mode === "daily" && s.dailyDate === todayUtc();
  if (request.kind === "free") {
    const size = SPEC.sizes.find((each) => each.id === request.size);
    return s.mode === "relaxed" && size !== undefined && s.width === size.width && s.height === size.height && s.colourCount === request.colours && s.shape === undefined && !s.tools;
  }
  return false;
}

function open(props: HousekiGameProps): GameState {
  if (props.resume !== null) {
    try {
      const kept = decodeGame(props.resume);
      if (isOf(kept, props.request) && !TERMINAL.has(kept.phase)) return kept;
    } catch {
      /* A save this package will not read is a game not kept. */
    }
  }
  return start(props.request);
}

/**
 * STONE COLLAPSE, played: a full board of stones, a group of two or more of one
 * colour to choose and take, and the rest falling into the gap. The game waits
 * for the player and has no clock; the loop here only lets a taken group
 * finish clearing (`advanceTicks`). Choosing a stone lights its group and says
 * what it would score; choosing it again, or pressing Take group, takes it.
 */
export default function StoneCollapseGame(props: HousekiGameProps) {
  const { request, appearance, readOnly = false, onKeep, onEnd, onTitle, stopped = false } = props;
  const say = useSpeaker();
  const [state, setState] = useState<GameState>(() => open(props));
  const game = useRef<GameState>(state);
  const kept = useRef("");
  const ended = useRef(false);
  const { level, lesson } = contentOf(request);
  const terminal = TERMINAL.has(state.phase);
  const locale = say.locale === "ja" ? "ja" : "en";

  useEffect(() => {
    onTitle?.(level !== null ? level.title[locale] : lesson !== null ? lesson.title[locale] : "");
  }, [level, lesson, locale, onTitle]);

  const set = (next: GameState) => {
    game.current = next;
    setState(next);
  };
  const end = (final: GameState) => {
    if (ended.current || readOnly) return;
    ended.current = true;
    const unbounded = request.kind === "daily" || request.kind === "free";
    onEnd?.({ outcome: final.phase === "won" ? "won" : final.phase === "finished" && unbounded ? "complete" : "lost", score: final.score, save: encodeGame(final) });
  };
  const act = (action: Parameters<typeof applyAction>[1]) => {
    const result = applyAction(game.current, action);
    if (!result.accepted) return;
    set(result.state);
    if (TERMINAL.has(result.state.phase)) end(result.state);
  };

  // A taken group clears, and the stones above it fall, over a few ticks: nothing else moves.
  useTickLoop(!readOnly && !stopped && !terminal && state.phase !== "ready", (ticks) => {
    const result = advanceTicks(game.current, ticks);
    set(result.state);
    if (TERMINAL.has(result.state.phase)) end(result.state);
  });

  useCheckpoints(
    () => {
      const now = game.current;
      if (readOnly || ended.current || TERMINAL.has(now.phase)) return;
      const text = encodeGame(now);
      kept.current = text;
      onKeep?.(text);
    },
    () => !readOnly && !ended.current && game.current.moves > 0 && encodeGame(game.current) !== kept.current,
    3000,
  );

  const cells = useMemo(() => cellsOf(state), [state]);
  const press = (index: number) => {
    const stone = state.board[index];
    if (state.phase !== "ready" || stone === null || stone === undefined) return;
    act({ kind: "select", stoneId: stone.id });
  };
  const goal = state.settings.goal;
  const standing = new Set(state.board.flatMap((stone) => (stone === null ? [] : [stone.id])));
  const targets = goal?.kind === "clear-targets" ? goal.targetIds : [];
  const done = targets.filter((id) => !standing.has(id)).length;
  const left = state.board.filter(Boolean).length;
  const limit = state.settings.moveLimit;
  const progress =
    goal === undefined
      ? null
      : goal.kind === "clear-targets"
        ? { text: say.say("houseki.play.goalTargetStones", { done: String(done), total: String(targets.length) }), done, total: targets.length }
        : goal.kind === "score-target"
          ? { text: say.say("houseki.play.goalScore", { done: String(Math.min(state.score, goal.minimumScore)), total: String(goal.minimumScore) }), done: Math.min(state.score, goal.minimumScore), total: goal.minimumScore }
          : { text: say.say("houseki.play.goalClear", { left: String(left) }), done: 0, total: 0 };
  const picked = state.selectedIds.length;
  const locked = readOnly || stopped || terminal || state.phase !== "ready";
  const status = state.phase !== "ready" ? say.say("houseki.play.clearing") : picked > 0 ? say.say("houseki.play.groupChosen", { count: String(picked), points: String(state.previewScore) }) : say.say("houseki.play.chooseGroup");

  return (
    <>
      {/* What the specs and the page read of the game, said once, and drawn nowhere. */}
      <span hidden data-testid="houseki-full" data-phase={state.phase} data-score={state.score} data-progress={state.moves} />
      <div className="flex flex-col gap-3 empty:hidden" data-testid="houseki-hud">
      {readOnly ? null : (
        <StatRow>
          <Stat label={say.say("houseki.play.score")} value={state.score} testId="houseki-score" />
          <Stat label={say.say("gamescreen.statMoves")} value={state.moves} testId="houseki-moves" />
          {limit !== undefined ? <Stat label={say.say("houseki.play.movesLeft")} value={Math.max(0, limit - state.moves)} testId="houseki-left" /> : null}
          <Stat label={say.say("houseki.play.stonesLeft")} value={left} testId="houseki-stones" />
        </StatRow>
      )}
      {progress !== null && !readOnly && progress.total > 0 ? <GoalBar text={progress.text} done={progress.done} total={progress.total} /> : null}
      {progress !== null && !readOnly && progress.total === 0 ? <p className="text-sm font-medium">{progress.text}</p> : null}
      {lesson !== null && !readOnly ? <p className="text-sm" data-testid="houseki-lesson">{lesson.steps.map((step) => step.instruction[locale]).join(" ")}</p> : null}
      {level !== null && !readOnly ? <p className="text-sm" data-testid="houseki-objective">{level.title[locale]}</p> : null}
      </div>
      <BoardColumn>
      <HousekiWell
        cols={state.settings.width}
        rows={state.settings.height}
        cells={cells}
        appearance={appearance}
        label={say.say("houseki.stoneCollapse.boardLabel")}
        phase={state.phase} fit={readOnly}
        onCell={readOnly || stopped || terminal ? undefined : press}
      />
      </BoardColumn>
      {readOnly ? null : (
        <div className="flex flex-col gap-3" data-testid="houseki-actions">
          <p className="min-h-5 text-sm" aria-live="polite" data-testid="houseki-status">
            {status}
          </p>
          <Controls label={say.say("houseki.play.controls")}>
            <ControlButton label={say.say("houseki.play.takeGroup")} testId="houseki-take" onPress={() => act({ kind: "confirm" })} disabled={locked || picked === 0} strong />
            <ControlButton label={say.say("ending.cancel")} testId="houseki-cancel" onPress={() => act({ kind: "cancel" })} disabled={locked || picked === 0} />
          </Controls>
          <p className="text-xs text-muted" data-chrome>{say.say("houseki.stoneCollapse.keys")}</p>
        </div>
      )}
    </>
  );
}

/** The board as cells: each stone, the group chosen with its score, and the stones that are going. */
function cellsOf(state: GameState): WellCell[] {
  const board = state.phase === "gravity" && state.gravityBoard !== null ? state.gravityBoard : state.board;
  const chosen = new Set(state.selectedIds);
  const going = new Set(state.pendingIds);
  return board.map((stone, index) => ({
    hole: state.settings.mask[index] === false ? true : undefined,
    gem: stone === null ? undefined : { id: stone.id, colour: stone.colour },
    state: stone === null ? undefined : going.has(stone.id) ? (state.phase === "clear-remove" ? "removing" : "marked") : chosen.has(stone.id) ? "selected" : undefined,
  }));
}
