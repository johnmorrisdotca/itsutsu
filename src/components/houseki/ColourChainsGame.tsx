"use client";

import {
  actionsForTick,
  advanceTicks,
  applyAction,
  arashiLevelManifest,
  createArashiLevel,
  createChallenge,
  createGame,
  createInputScheduler,
  createLevel,
  createShizenLevel,
  decodeGame,
  encodeGame,
  landingCells,
  levelManifest,
  powerDropPreview,
  queueInputEdge,
  releaseAllInput,
  setHeldInput,
  shizenLevelManifest,
  tutorialManifest,
  type Action,
  type ChainCampaignLevel,
  type ChainTutorialDefinition,
  type GameState,
  type HeldControl,
} from "@johnmorrisdotca/houseki/colour-chains";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { HOUSEKI_SPECS, type HousekiColour } from "@/lib/houseki/houseki.constants";
import type { HousekiCampaign } from "@/lib/houseki/houseki.types";

import { BoardColumn, Controls, ControlButton, GoalBar, NextPieces, Stat, StatRow } from "./HousekiParts";
import { HousekiWell, type WellCell } from "./HousekiWell";
import { freshSeed, todayUtc, useCheckpoints, useGameKeys, useTickLoop, type HousekiGameProps } from "./housekiRuntime";

const SPEC = HOUSEKI_SPECS.colourChains;
const HIDDEN = 3;
const TERMINAL = new Set(["won", "lost", "finished"]);

const MANIFESTS: Record<HousekiCampaign, readonly ChainCampaignLevel[]> = { classic: levelManifest, shizen: shizenLevelManifest, arashi: arashiLevelManifest };

function contentOf(request: HousekiGameProps["request"]): { level: ChainCampaignLevel | null; lesson: ChainTutorialDefinition | null } {
  if (request.kind === "level") return { level: MANIFESTS[request.campaign][request.number - 1] ?? null, lesson: null };
  if (request.kind === "lesson") return { level: null, lesson: tutorialManifest[request.number - 1] ?? null };
  return { level: null, lesson: null };
}

function start(request: HousekiGameProps["request"]): GameState {
  const { level, lesson } = contentOf(request);
  if (level !== null && request.kind === "level") return request.campaign === "shizen" ? createShizenLevel(level.id) : request.campaign === "arashi" ? createArashiLevel(level.id) : createLevel(level.id);
  if (lesson !== null) return createChallenge({ id: lesson.id, ...lesson.setup, seed: `lesson:${lesson.id}` });
  if (request.kind === "daily") return createGame({ mode: "daily", dailyDate: todayUtc() });
  const size = SPEC.sizes.find((each) => request.kind === "free" && each.id === request.size) ?? SPEC.sizes[0]!;
  return createGame({
    mode: request.kind === "free" && request.arcade ? "arcade" : "relaxed",
    preset: size.id as "narrow" | "standard" | "wide" | "tall",
    colourCount: request.kind === "free" ? request.colours : 4,
    seed: freshSeed(),
  });
}

function isOf(state: GameState, request: HousekiGameProps["request"]): boolean {
  const { level, lesson } = contentOf(request);
  const s = state.settings;
  if (level !== null) return s.mode === "challenge" && s.challengeId === level.id;
  if (lesson !== null) return s.mode === "challenge" && s.seed === `lesson:${lesson.id}`;
  if (request.kind === "daily") return s.mode === "daily" && s.date === todayUtc();
  if (request.kind === "free") {
    const size = SPEC.sizes.find((each) => each.id === request.size);
    return s.mode === (request.arcade ? "arcade" : "relaxed") && size !== undefined && s.width === size.width && s.height === size.height && s.colourCount === request.colours && s.nature !== true && s.weather === undefined;
  }
  return false;
}

function open(props: HousekiGameProps): GameState {
  if (props.resume !== null) {
    try {
      const kept = decodeGame(props.resume);
      if (isOf(kept, props.request) && !TERMINAL.has(kept.phase)) return kept.phase === "falling" && ["arcade", "daily"].includes(kept.settings.mode) ? applyAction(kept, { kind: "pause" }).state : kept;
    } catch {
      /* A save this package will not read is a game not kept. */
    }
  }
  return start(props.request);
}

/**
 * COLOUR CHAINS, played: a falling pair of stones, turned a quarter at a time,
 * four or more of a colour clearing together and the chains running on. The
 * Shizen and Arashi campaigns are the same game with magnetic stones and with
 * weather. The rules are the package's (`applyAction`, `advanceTicks`); this is
 * the loop, the presses, the ghost and the checkpoints round them, as
 * `FallingTripletsGame` is for its own.
 */
export default function ColourChainsGame(props: HousekiGameProps) {
  const { request, appearance, readOnly = false, onKeep, onEnd, onTitle, stopped = false } = props;
  const say = useSpeaker();
  const [state, setState] = useState<GameState>(() => open(props));
  const game = useRef<GameState>(state);
  const input = useRef<ReturnType<typeof createInputScheduler>>(createInputScheduler());
  const held = useRef(new Map<string, HeldControl>());
  const releases = useRef(new Set<HeldControl>());
  const kept = useRef("");
  const ended = useRef(false);
  const [counting, setCounting] = useState<number | null>(null);
  const [weather, setWeather] = useState<"jumble" | "lightning" | null>(null);
  const { level, lesson } = contentOf(request);
  const terminal = TERMINAL.has(state.phase);
  const locale = say.locale === "ja" ? "ja" : "en";

  useEffect(() => {
    onTitle?.(level !== null ? level.title[locale] : lesson !== null ? lesson.title[locale] : "");
  }, [level, lesson, locale, onTitle]);

  useEffect(() => {
    if (weather === null) return;
    const timer = window.setTimeout(() => setWeather(null), 2500);
    return () => window.clearTimeout(timer);
  }, [weather]);

  const set = (next: GameState) => {
    game.current = next;
    setState(next);
  };
  const end = (final: GameState) => {
    if (ended.current || readOnly) return;
    ended.current = true;
    const complete = final.phase === "finished" && (request.kind === "daily" || request.kind === "free");
    onEnd?.({ outcome: final.phase === "won" ? "won" : complete ? "complete" : "lost", score: final.score, save: encodeGame(final) });
  };
  const remember = (events: readonly { type: string; kind?: unknown }[]) => {
    const found = events.find((event) => event.type === "weather-triggered");
    if (found !== undefined) setWeather(found.kind === "jumble" ? "jumble" : "lightning");
  };
  const play = (kind: Action["kind"]): boolean => {
    const result = applyAction(game.current, { kind } as Action);
    if (!result.accepted) return false;
    remember(result.events);
    set(result.state);
    if (TERMINAL.has(result.state.phase)) end(result.state);
    return true;
  };

  const beginHold = (control: HeldControl) => {
    releases.current.delete(control);
    input.current = setHeldInput(input.current, control, true);
  };
  const endHold = (control: HeldControl) => {
    if (input.current.held[control] === 0) releases.current.add(control);
    else input.current = setHeldInput(input.current, control, false);
  };
  const edge = (kind: "rotate-clockwise" | "rotate-anticlockwise" | "hard-drop" | "place" | "pause" | "resume") => {
    input.current = queueInputEdge(input.current, { kind });
  };

  const running = !readOnly && !stopped && !terminal;
  useTickLoop(running && counting === null, (ticks) => {
    let current = game.current;
    for (let tick = 0; tick < ticks; tick += 1) {
      const [actions, next] = actionsForTick(current, input.current);
      input.current = next;
      for (const control of releases.current) input.current = setHeldInput(input.current, control, false);
      releases.current.clear();
      let pieceEnded = false;
      for (const item of actions) {
        const was = current;
        const result = applyAction(current, item.kind === ("soft-drop" as string) ? { kind: "down" } : item);
        if (!result.accepted) continue;
        remember(result.events);
        current = result.state;
        if ((was.phase === "falling" && current.phase !== "falling") || current.completedPairs > was.completedPairs) pieceEnded = true;
      }
      if (pieceEnded || current.phase !== "falling") input.current = releaseAllInput(input.current);
      const result = advanceTicks(current, 1);
      remember(result.events);
      current = result.state;
      if (TERMINAL.has(current.phase)) break;
    }
    set(current);
    if (TERMINAL.has(current.phase)) end(current);
  });

  const pause = () => {
    input.current = releaseAllInput(input.current);
    held.current.clear();
    releases.current.clear();
    const now = game.current;
    if (!terminal && ["arcade", "daily"].includes(now.settings.mode) && now.phase === "falling") play("pause");
  };
  useEffect(() => {
    if (readOnly) return;
    const away = () => document.hidden && pause();
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", away);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", away);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pause reads only refs and the latest state.
  }, [readOnly]);

  const resume = async () => {
    if (counting !== null || game.current.phase !== "paused") return;
    input.current = releaseAllInput(input.current);
    for (let n = 3; n > 0; n -= 1) {
      setCounting(n);
      await new Promise((done) => setTimeout(done, 1000));
    }
    setCounting(null);
    play("resume");
  };

  useCheckpoints(
    () => {
      const now = game.current;
      if (readOnly || ended.current || TERMINAL.has(now.phase)) return;
      const text = encodeGame(now);
      kept.current = text;
      onKeep?.(text);
    },
    () => !readOnly && !ended.current && game.current.elapsedTicks > 0 && encodeGame(game.current) !== kept.current,
    5000,
  );

  const relaxedPlay = state.settings.mode === "relaxed";
  const keysOn = !readOnly && !stopped && !terminal;
  useGameKeys(
    keysOn,
    (key, event) => {
      const lower = key.toLowerCase();
      const holds: Record<string, HeldControl> = { arrowleft: "left", arrowright: "right", arrowdown: "soft-drop" };
      if (holds[lower] !== undefined) {
        event.preventDefault();
        if (!held.current.has(event.code)) {
          held.current.set(event.code, holds[lower]!);
          beginHold(holds[lower]!);
        }
        return;
      }
      if (key === " " && (event.target as HTMLElement | null)?.closest("button") != null) return;
      const map: Record<string, "rotate-clockwise" | "rotate-anticlockwise" | "hard-drop" | "place"> = { x: "rotate-clockwise", arrowup: "rotate-clockwise", z: "rotate-anticlockwise", " ": relaxedPlay ? "place" : "hard-drop" };
      if (lower === "escape") {
        event.preventDefault();
        if (event.repeat) return;
        if (game.current.phase === "paused") void resume();
        else edge("pause");
        return;
      }
      if (map[lower] === undefined) return;
      event.preventDefault();
      if (event.repeat) return;
      edge(map[lower]!);
    },
    (_key, event) => {
      const control = held.current.get(event.code);
      if (control === undefined) return;
      held.current.delete(event.code);
      if (![...held.current.values()].includes(control)) endHold(control);
    },
  );

  const cells = useMemo(() => cellsOf(state, readOnly), [state, readOnly]);
  const goal = level?.goal ?? (lesson !== null ? lesson.setup.goal : null);
  const queueLeft = level !== null ? level.queue.length : lesson !== null ? lesson.setup.queue.length : state.settings.pairLimit ?? null;
  const standing = new Set(state.board.flatMap((gem) => (gem === null ? [] : [gem.id])));
  const targets = goal?.kind === "clear-targets" ? goal.targetIds : [];
  const done = targets.filter((id) => !standing.has(id)).length;
  const progress =
    goal === null
      ? null
      : goal.kind === "clear-targets"
        ? { text: say.say("houseki.play.goalTargets", { done: String(done), total: String(targets.length) }), done, total: targets.length }
        : goal.kind === "minimum-chain"
          ? { text: say.say("houseki.play.goalChain", { done: String(Math.min(state.maxChain, goal.chain)), total: String(goal.chain) }), done: Math.min(state.maxChain, goal.chain), total: goal.chain }
          : { text: say.say("houseki.play.goalEmpty", { left: String(state.board.filter(Boolean).length) }), done: 0, total: 0 };
  const wave = state.waves.at(-1);
  const status =
    counting !== null
      ? say.say("houseki.play.readyIn", { count: String(counting) })
      : state.phase === "paused"
        ? say.say("puzzle.solve.paused")
        : weather !== null && state.phase === "falling"
          ? say.say(weather === "jumble" ? "houseki.play.earthquake" : "houseki.play.lightning")
          : wave !== undefined && ["clear-mark", "clear-remove", "gravity"].includes(state.phase)
            ? say.say("houseki.play.chain", { count: String(wave.chain) })
            : relaxedPlay
              ? say.say("houseki.play.placePair")
              : "";
  const preview = state.next.map((pair, index) => pair.map((colour, at) => ({ colour: colour as HousekiColour, magnetic: state.nextMagnetic?.[index]?.[at] === true })));
  const locked = readOnly || stopped || terminal;

  return (
    <>
      {/* What the specs and the page read of the game, said once, and drawn nowhere. */}
      <span hidden data-testid="houseki-falling" data-phase={state.phase} data-score={state.score} data-progress={state.completedPairs} />
      <div className="flex flex-col gap-3 empty:hidden" data-testid="houseki-hud">
      {readOnly ? null : (
        <StatRow>
          <Stat label={say.say("houseki.play.score")} value={state.score} testId="houseki-score" />
          <Stat label={say.say("houseki.play.bestChain")} value={state.maxChain} testId="houseki-chain" />
          {queueLeft !== null ? <Stat label={say.say("houseki.play.pairsLeft")} value={Math.max(0, queueLeft - state.completedPairs)} testId="houseki-left" /> : null}
        </StatRow>
      )}
      {progress !== null && !readOnly && progress.total > 0 ? <GoalBar text={progress.text} done={progress.done} total={progress.total} /> : null}
      {progress !== null && !readOnly && progress.total === 0 ? <p className="text-sm font-medium">{progress.text}</p> : null}
      {level?.objective !== undefined && !readOnly ? <p className="text-sm" data-testid="houseki-objective">{level.objective[locale]}</p> : null}
      {lesson !== null && !readOnly ? <p className="text-sm" data-testid="houseki-lesson">{lesson.steps.map((step) => step.instruction[locale]).join(" ")}</p> : null}
      {readOnly ? null : <NextPieces label={say.say("houseki.play.next")} pieces={preview} vertical={false} />}
      </div>
      <BoardColumn>
      <HousekiWell cols={state.settings.width} rows={state.settings.height} hidden={HIDDEN} cells={cells} appearance={appearance} label={say.say("houseki.colourChains.boardLabel")} phase={state.phase} fit={readOnly} />
      </BoardColumn>
      {readOnly ? null : (
        <div className="flex flex-col gap-3" data-testid="houseki-actions">
          <p className="min-h-5 text-sm" aria-live="polite" data-testid="houseki-status">
            {status}
          </p>
          <Controls label={say.say("houseki.play.controls")}>
            <ControlButton label="←" testId="houseki-left-button" onHold={(on) => (on ? beginHold("left") : endHold("left"))} disabled={locked} title={say.say("houseki.play.left")} />
            <ControlButton label={`↶ ${say.say("houseki.play.turnLeft")}`} testId="houseki-turn-left" onPress={() => edge("rotate-anticlockwise")} disabled={locked} title={say.say("houseki.play.turnLeft")} />
            <ControlButton label={`${say.say("houseki.play.turnRight")} ↷`} testId="houseki-turn-right" onPress={() => edge("rotate-clockwise")} disabled={locked} title={say.say("houseki.play.turnRight")} />
            <ControlButton label="→" testId="houseki-right-button" onHold={(on) => (on ? beginHold("right") : endHold("right"))} disabled={locked} title={say.say("houseki.play.right")} />
            <ControlButton label={say.say("houseki.play.down")} testId="houseki-down" onHold={(on) => (on ? beginHold("soft-drop") : endHold("soft-drop"))} disabled={locked} hidden={relaxedPlay} />
            <ControlButton label={say.say("houseki.play.drop")} testId="houseki-drop" onPress={() => edge("hard-drop")} disabled={locked} hidden={relaxedPlay} strong />
            <ControlButton label={say.say("houseki.play.place")} testId="houseki-place" onPress={() => edge("place")} disabled={locked} hidden={!relaxedPlay} strong />
            {state.phase === "paused" || counting !== null ? (
              <ControlButton label={say.say("puzzle.solve.resume")} testId="houseki-resume" onPress={() => void resume()} disabled={stopped || terminal || counting !== null} />
            ) : (
              <ControlButton label={say.say("puzzle.solve.pause")} testId="houseki-pause" onPress={() => edge("pause")} disabled={locked} hidden={relaxedPlay} />
            )}
          </Controls>
          <p className="text-xs text-muted" data-chrome>{say.say("houseki.colourChains.keys")}</p>
        </div>
      )}
    </>
  );
}

/** The well as a list of cells: what has settled, the pair in the air, where it lands, and what is clearing or about to fall. */
function cellsOf(state: GameState, readOnly: boolean): WellCell[] {
  const { width, height } = state.settings;
  const rows = height + HIDDEN;
  const clearing = new Set(state.clearCells);
  const cells: WellCell[] = Array.from({ length: width * rows }, () => ({}));
  state.board.forEach((gem, index) => {
    if (gem === null || index >= cells.length) return;
    cells[index] = { gem: { id: gem.id, colour: gem.colour, magnetic: gem.magnetic === true }, state: clearing.has(index) ? (state.phase === "clear-remove" ? "removing" : "marked") : undefined };
  });
  if (readOnly) return cells;
  if (state.active !== null) {
    const power = powerDropPreview(state.phase === "paused" ? applyAction(state, { kind: "resume" }).state : state);
    if (power !== null) {
      for (const cell of power.settledCells) {
        const at = (cell.y + HIDDEN) * width + cell.x;
        const gem = state.active.gems.find((one) => one.id === cell.id);
        if (gem !== undefined && cells[at] !== undefined && cells[at]!.gem === undefined) cells[at]!.ghost = { id: gem.id, colour: gem.colour, magnetic: gem.magnetic === true };
      }
    } else {
      const landing = landingCells(state);
      landing?.forEach((cell, index) => {
        const gem = state.active!.gems[index];
        const at = (cell.y + HIDDEN) * width + cell.x;
        if (gem !== undefined && cells[at] !== undefined && cells[at]!.gem === undefined) cells[at]!.ghost = { id: gem.id, colour: gem.colour, magnetic: gem.magnetic === true };
      });
    }
    const offsets = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] } as const;
    const [dx, dy] = offsets[state.active.orientation];
    state.active.gems.forEach((gem, index) => {
      const x = state.active!.pivot.x + (index === 0 ? 0 : dx);
      const y = state.active!.pivot.y + (index === 0 ? 0 : dy);
      const at = (y + HIDDEN) * width + x;
      if (at >= 0 && at < cells.length) cells[at]!.active = { id: gem.id, colour: gem.colour, magnetic: gem.magnetic === true };
    });
  }
  if (state.phase === "gravity" && state.gravityBoard !== null) {
    state.gravityBoard.forEach((gem, index) => {
      if (gem === null || state.board[index]?.id === gem.id || cells[index] === undefined) return;
      cells[index]!.falling = { id: gem.id, colour: gem.colour, magnetic: gem.magnetic === true };
    });
  }
  return cells;
}

