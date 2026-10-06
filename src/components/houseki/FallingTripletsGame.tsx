"use client";

import {
  actionsForTick,
  advanceTicks,
  applyAction,
  createChallenge,
  createGame,
  createInputScheduler,
  createLevel,
  decodeGame,
  encodeGame,
  landingY,
  levelManifest,
  queueInputEdge,
  releaseAllActions,
  setHeldAction,
  tutorialManifest,
  type Action,
  type CampaignLevel,
  type GameState,
  type TutorialDefinition,
} from "@johnmorrisdotca/houseki/falling-triplets";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { HOUSEKI_SPECS, type HousekiColour } from "@/lib/houseki/houseki.constants";

import { BoardColumn, Controls, ControlButton, GoalBar, NextPieces, Stat, StatRow } from "./HousekiParts";
import { HousekiWell, type WellCell } from "./HousekiWell";
import { freshSeed, todayUtc, useCheckpoints, useGameKeys, useTickLoop, type HousekiGameProps } from "./housekiRuntime";

const SPEC = HOUSEKI_SPECS.fallingTriplets;
const HIDDEN = 3;
const TERMINAL = new Set(["won", "lost", "finished"]);

/** The level or lesson a request names, in the package. */
function contentOf(request: HousekiGameProps["request"]): { level: CampaignLevel | null; lesson: TutorialDefinition | null } {
  if (request.kind === "level") return { level: levelManifest[request.number - 1] ?? null, lesson: null };
  if (request.kind === "lesson") return { level: null, lesson: tutorialManifest[request.number - 1] ?? null };
  return { level: null, lesson: null };
}

/** The game a request asks for, made fresh. */
function start(request: HousekiGameProps["request"]): GameState {
  const { level, lesson } = contentOf(request);
  if (level !== null) return createLevel(level.id);
  if (lesson !== null) return createChallenge({ ...lesson.setup, seed: `lesson:${lesson.id}` });
  if (request.kind === "daily") return createGame({ mode: "daily", seed: todayUtc() });
  const size = SPEC.sizes.find((each) => request.kind === "free" && each.id === request.size) ?? SPEC.sizes[0]!;
  return createGame({
    mode: request.kind === "free" && request.arcade ? "arcade" : "relaxed",
    preset: size.id as "narrow" | "standard" | "wide" | "tall",
    colourCount: request.kind === "free" ? request.colours : 5,
    seed: freshSeed(),
  });
}

/** Whether a kept save is of the very thing asked for, so that a level's save is never opened as another. */
function isOf(state: GameState, request: HousekiGameProps["request"]): boolean {
  const { level, lesson } = contentOf(request);
  const s = state.settings;
  if (level !== null) return s.mode === "challenge" && s.seed === level.seed;
  if (lesson !== null) return s.mode === "challenge" && s.seed === `lesson:${lesson.id}`;
  if (request.kind === "daily") return s.mode === "daily" && s.seed === todayUtc();
  if (request.kind === "free") {
    const size = SPEC.sizes.find((each) => each.id === request.size);
    return s.mode === (request.arcade ? "arcade" : "relaxed") && size !== undefined && s.width === size.width && s.height === size.height && s.colourCount === request.colours;
  }
  return false;
}

function open(props: HousekiGameProps): GameState {
  if (props.resume !== null) {
    try {
      const kept = decodeGame(props.resume);
      if (isOf(kept, props.request) && !TERMINAL.has(kept.phase)) {
        // An Arcade game is never left falling by a page being opened: it waits, paused, for a press of Continue.
        return kept.phase === "falling" && kept.settings.mode !== "relaxed" ? applyAction(kept, { kind: "pause" }).state : kept;
      }
    } catch {
      /* A save this package will not read is a game not kept. */
    }
  }
  return start(props.request);
}

/**
 * FALLING TRIPLETS, played: the package's engine drawn on the site's own wood.
 * A column of three gems falls; Cycle changes the order of its colours, Place or
 * Drop puts it down. Everything the rules say is the package's (`applyAction`,
 * `advanceTicks`); what is here is the frame round it: a sixtieth-of-a-second
 * loop, the held and one-shot presses the package's input scheduler asks for,
 * the ghost of where the piece will land, and a checkpoint kept every few
 * seconds so that a game put down is still there when it is picked up.
 */
export default function FallingTripletsGame(props: HousekiGameProps) {
  const { request, appearance, readOnly = false, onKeep, onEnd, onTitle, stopped = false } = props;
  const say = useSpeaker();
  const [state, setState] = useState<GameState>(() => open(props));
  const game = useRef<GameState>(state);
  const input = useRef<ReturnType<typeof createInputScheduler>>(createInputScheduler());
  const held = useRef(new Map<string, string>());
  const releases = useRef(new Set<"left" | "right" | "soft-drop">());
  const kept = useRef<string>("");
  const ended = useRef(false);
  const [counting, setCounting] = useState<number | null>(null);
  const { level, lesson } = contentOf(request);
  const terminal = TERMINAL.has(state.phase);

  useEffect(() => {
    const title = level !== null ? level.title[say.locale === "ja" ? "ja" : "en"] : lesson !== null ? lesson.title[say.locale === "ja" ? "ja" : "en"] : "";
    onTitle?.(title);
  }, [level, lesson, say.locale, onTitle]);

  const set = (next: GameState) => {
    game.current = next;
    setState(next);
  };

  const end = (final: GameState) => {
    if (ended.current || readOnly) return;
    ended.current = true;
    const won = final.phase === "won";
    const complete = final.phase === "finished" && (request.kind === "daily" || request.kind === "free");
    onEnd?.({ outcome: won ? "won" : complete ? "complete" : "lost", score: final.score, save: encodeGame(final) });
  };

  const play = (kind: Action["kind"]): boolean => {
    const result = applyAction(game.current, { kind });
    if (!result.accepted) return false;
    set(result.state);
    if (TERMINAL.has(result.state.phase)) end(result.state);
    return true;
  };

  const beginHold = (action: "left" | "right" | "soft-drop") => {
    releases.current.delete(action);
    input.current = setHeldAction(input.current, action, true);
  };
  const endHold = (action: "left" | "right" | "soft-drop") => {
    if (input.current.held[action] === 0) releases.current.add(action);
    else input.current = setHeldAction(input.current, action, false);
  };
  const edge = (kind: Action["kind"]) => {
    input.current = queueInputEdge(input.current, { kind });
  };

  // The loop: one logical tick at a time, with the player's presses laid into the tick they came in.
  const running = !readOnly && !stopped && !terminal;
  useTickLoop(running && counting === null, (ticks) => {
    let current = game.current;
    for (let tick = 0; tick < ticks; tick += 1) {
      const [actions, next] = actionsForTick(input.current);
      input.current = next;
      for (const action of releases.current) input.current = setHeldAction(input.current, action, false);
      releases.current.clear();
      let pieceEnded = false;
      for (const item of actions) {
        const was = current;
        const result = applyAction(current, item);
        if (!result.accepted) continue;
        current = result.state;
        if ((was.phase === "falling" && current.phase !== "falling") || current.completedPieces > was.completedPieces) pieceEnded = true;
      }
      if (pieceEnded || current.phase !== "falling") input.current = releaseAllActions(input.current);
      current = advanceTicks(current, 1).state;
      if (TERMINAL.has(current.phase)) break;
    }
    set(current);
    if (TERMINAL.has(current.phase)) end(current);
  });

  // Left alone, an Arcade game waits for a press; it also waits while the page is away.
  const pause = () => {
    input.current = releaseAllActions(input.current);
    held.current.clear();
    releases.current.clear();
    const now = game.current;
    if (!terminal && now.settings.mode !== "relaxed" && now.phase === "falling") play("pause");
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
    input.current = releaseAllActions(input.current);
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

  /* A Relaxed game has no clock and a press that puts the piece down; every other falls by itself, and Down and Drop speed it. */
  const cheap = state.settings.mode === "relaxed";
  const keysOn = !readOnly && !stopped && !terminal;
  useGameKeys(
    keysOn,
    (key, event) => {
      const lower = key.toLowerCase();
      const holds: Record<string, "left" | "right" | "soft-drop"> = { arrowleft: "left", arrowright: "right", arrowdown: "soft-drop" };
      if (holds[lower] !== undefined) {
        event.preventDefault();
        if (!held.current.has(event.code)) {
          held.current.set(event.code, holds[lower]!);
          beginHold(holds[lower]!);
        }
        return;
      }
      if (key === " " && (event.target as HTMLElement | null)?.closest("button") != null) return;
      const map: Record<string, Action["kind"]> = { x: "cycle-forward", arrowup: "cycle-forward", z: "cycle-backward", " ": cheap ? "place" : "hard-drop" };
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
      const action = held.current.get(event.code);
      if (action === undefined) return;
      held.current.delete(event.code);
      if (![...held.current.values()].includes(action)) endHold(action as "left" | "right" | "soft-drop");
    },
  );

  const cells = useMemo(() => cellsOf(state, readOnly), [state, readOnly]);
  const width = state.settings.width;
  const height = state.settings.height;
  const goal = level?.goal ?? (lesson !== null ? lesson.setup.goal : null);
  const queueLeft = level !== null ? level.queue.length : lesson !== null ? lesson.setup.queue.length : state.settings.pieceLimit ?? null;
  const targets = goal?.type === "targets" ? goal.targetIds : [];
  const standing = new Set(state.board.flatMap((gem) => (gem === null ? [] : [gem.id])));
  const progress =
    goal === null
      ? null
      : goal.type === "targets"
        ? { text: say.say("houseki.play.goalTargets", { done: String(targets.filter((id) => !standing.has(id)).length), total: String(targets.length) }), done: targets.filter((id) => !standing.has(id)).length, total: targets.length }
        : goal.type === "chain"
          ? { text: say.say("houseki.play.goalChain", { done: String(Math.min(state.maxChain, goal.minimumChain)), total: String(goal.minimumChain) }), done: Math.min(state.maxChain, goal.minimumChain), total: goal.minimumChain }
          : { text: say.say("houseki.play.goalEmpty", { left: String(state.board.filter(Boolean).length) }), done: 0, total: 0 };
  const wave = state.waves.at(-1);
  const status =
    counting !== null
      ? say.say("houseki.play.readyIn", { count: String(counting) })
      : state.phase === "paused"
        ? say.say("puzzle.solve.paused")
        : wave !== undefined && ["clear-mark", "clear-remove", "gravity"].includes(state.phase)
          ? say.say("houseki.play.chain", { count: String(wave.chain) })
          : cheap
            ? say.say("houseki.play.placeTriplet")
            : "";
  const preview = state.next.map((piece) => piece.map((colour) => ({ colour: colour as HousekiColour })));
  const locked = readOnly || stopped || terminal;

  return (
    <>
      {/* What the specs and the page read of the game, said once, and drawn nowhere. */}
      <span hidden data-testid="houseki-falling" data-phase={state.phase} data-score={state.score} data-progress={state.completedPieces} />
      <div className="flex flex-col gap-3 empty:hidden" data-testid="houseki-hud">
      {readOnly ? null : (
        <StatRow>
          <Stat label={say.say("houseki.play.score")} value={state.score} testId="houseki-score" />
          <Stat label={say.say("houseki.play.bestChain")} value={state.maxChain} testId="houseki-chain" />
          {queueLeft !== null ? <Stat label={say.say("houseki.play.piecesLeft")} value={Math.max(0, queueLeft - state.completedPieces)} testId="houseki-left" /> : null}
        </StatRow>
      )}
      {progress !== null && !readOnly && progress.total > 0 ? <GoalBar text={progress.text} done={progress.done} total={progress.total} /> : null}
      {progress !== null && !readOnly && progress.total === 0 ? <p className="text-sm font-medium">{progress.text}</p> : null}
      {lesson !== null && !readOnly ? <p className="text-sm" data-testid="houseki-lesson">{lesson.steps.map((step) => step.instruction[say.locale === "ja" ? "ja" : "en"]).join(" ")}</p> : null}
      {readOnly ? null : <NextPieces label={say.say("houseki.play.next")} pieces={preview} />}
      </div>
      <BoardColumn>
      <HousekiWell cols={width} rows={height} hidden={HIDDEN} cells={cells} appearance={appearance} label={say.say("houseki.fallingTriplets.boardLabel")} phase={state.phase} fit={readOnly} />
      </BoardColumn>
      {readOnly ? null : (
        <div className="flex flex-col gap-3" data-testid="houseki-actions">
          <p className="min-h-5 text-sm" aria-live="polite" data-testid="houseki-status">
            {status}
          </p>
          <Controls label={say.say("houseki.play.controls")}>
            <ControlButton label="←" testId="houseki-left-button" onHold={(on) => (on ? beginHold("left") : endHold("left"))} disabled={locked} title={say.say("houseki.play.left")} />
            <ControlButton label={say.say("houseki.play.cycle")} testId="houseki-cycle" onPress={() => edge("cycle-forward")} disabled={locked} />
            <ControlButton label={say.say("houseki.play.reverse")} testId="houseki-reverse" onPress={() => edge("cycle-backward")} disabled={locked} />
            <ControlButton label="→" testId="houseki-right-button" onHold={(on) => (on ? beginHold("right") : endHold("right"))} disabled={locked} title={say.say("houseki.play.right")} />
            <ControlButton label={say.say("houseki.play.down")} testId="houseki-down" onHold={(on) => (on ? beginHold("soft-drop") : endHold("soft-drop"))} disabled={locked} hidden={cheap} />
            <ControlButton label={say.say("houseki.play.drop")} testId="houseki-drop" onPress={() => edge("hard-drop")} disabled={locked} hidden={cheap} strong />
            <ControlButton label={say.say("houseki.play.place")} testId="houseki-place" onPress={() => edge("place")} disabled={locked} hidden={!cheap} strong />
            {state.phase === "paused" || counting !== null ? (
              <ControlButton label={say.say("puzzle.solve.resume")} testId="houseki-resume" onPress={() => void resume()} disabled={stopped || terminal || counting !== null} />
            ) : (
              <ControlButton label={say.say("puzzle.solve.pause")} testId="houseki-pause" onPress={() => edge("pause")} disabled={locked} hidden={cheap} />
            )}
          </Controls>
          <p className="text-xs text-muted" data-chrome>{say.say("houseki.fallingTriplets.keys")}</p>
        </div>
      )}
    </>
  );
}

/** The well as a list of cells: what has settled, the piece in the air, where it will land, and what is clearing. */
function cellsOf(state: GameState, readOnly: boolean): WellCell[] {
  const { width, height } = state.settings;
  const rows = height + HIDDEN;
  const board = state.phase === "gravity" && state.gravityBoard !== undefined ? state.gravityBoard : state.board;
  const clearing = new Set(state.pendingClear ?? []);
  const cells: WellCell[] = Array.from({ length: width * rows }, () => ({}));
  board.forEach((gem, index) => {
    if (gem === null || index >= cells.length) return;
    const marked = clearing.has(index);
    cells[index] = { gem: { id: gem.id, colour: gem.colour }, state: marked ? (state.phase === "clear-remove" ? "removing" : "marked") : gem.target === true ? "target" : undefined };
  });
  if (!readOnly && state.active !== null) {
    const landing = landingY(state);
    state.active.gems.forEach((gem, index) => {
      if (landing !== null) {
        const at = (landing + index + HIDDEN) * width + state.active!.x;
        if (cells[at] !== undefined && cells[at]!.gem === undefined) cells[at]!.ghost = { id: gem.id, colour: gem.colour };
      }
      const at = (state.active!.y + index + HIDDEN) * width + state.active!.x;
      if (at >= 0 && at < cells.length) cells[at]!.active = { id: gem.id, colour: gem.colour };
    });
  }
  return cells;
}
