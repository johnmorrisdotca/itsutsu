"use client";

import {
  advanceTicks,
  applyAction,
  blockCells,
  createGame,
  createLesson,
  createLevel,
  decodeGame,
  encodeGame,
  levelManifest,
  lessonManifest,
  type Action,
  type Floor,
  type GameState,
  type MagneticCampaignLevel,
  type MagneticLesson,
} from "@johnmorrisdotca/houseki/magnetic-blocks";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { HOUSEKI_SPECS, type HousekiColour } from "@/lib/houseki/houseki.constants";

import { BoardColumn, Controls, ControlButton, GoalBar, NextPieces, Stat, StatRow } from "./HousekiParts";
import { HousekiWell, type WellCell } from "./HousekiWell";
import { freshSeed, useCheckpoints, useGameKeys, useTickLoop, type HousekiGameProps } from "./housekiRuntime";

const SPEC = HOUSEKI_SPECS.magneticBlocks;
const TERMINAL = new Set(["won", "lost", "finished"]);

function contentOf(request: HousekiGameProps["request"]): { level: MagneticCampaignLevel | null; lesson: MagneticLesson | null } {
  if (request.kind === "level") return { level: levelManifest[request.number - 1] ?? null, lesson: null };
  if (request.kind === "lesson") return { level: null, lesson: lessonManifest[request.number - 1] ?? null };
  return { level: null, lesson: null };
}

function start(request: HousekiGameProps["request"]): GameState {
  const { level, lesson } = contentOf(request);
  if (level !== null) return createLevel(level.id);
  if (lesson !== null) return createLesson(lesson.id);
  const size = SPEC.sizes.find((each) => request.kind === "free" && each.id === request.size) ?? SPEC.sizes[0]!;
  return createGame({
    mode: request.kind === "free" && request.arcade ? "arcade" : "relaxed",
    width: size.width,
    height: size.height,
    colourCount: request.kind === "free" ? request.colours : 5,
    seed: freshSeed(),
    pieceLimit: 200,
    schedule: { kind: "fixed", floor: "calm" },
    floorSwitch: true,
    magneticImpact: false,
  });
}

function isOf(state: GameState, request: HousekiGameProps["request"]): boolean {
  const { level, lesson } = contentOf(request);
  const s = state.settings;
  if (level !== null) return String(s.seed) === String(level.options.seed) && s.goal !== undefined;
  if (lesson !== null) return String(s.seed) === String(lesson.options.seed);
  if (request.kind === "free") {
    const size = SPEC.sizes.find((each) => each.id === request.size);
    return s.mode === (request.arcade ? "arcade" : "relaxed") && size !== undefined && s.width === size.width && s.height === size.height && s.colourCount === request.colours && s.goal === undefined;
  }
  return false;
}

function open(props: HousekiGameProps): GameState {
  if (props.resume !== null) {
    try {
      const kept = decodeGame(props.resume);
      if (isOf(kept, props.request) && !TERMINAL.has(kept.phase)) return kept.phase === "falling" && kept.settings.mode === "arcade" ? applyAction(kept, { kind: "pause" }).state : kept;
    } catch {
      /* A save this package will not read is a game not kept. */
    }
  }
  return start(props.request);
}

/** What a press of Space does: Place (the gentle land) in a Relaxed game, and Drop in an Arcade one; the ghost shows the same one. */
const spaceOf = (state: GameState): "land" | "hard-drop" => (state.settings.mode === "relaxed" ? "land" : "hard-drop");

/**
 * MAGNETIC BLOCKS, played: a falling 2×2 block of four bonded gems on a floor
 * that turns magnetic on a schedule. Calm keeps a block's bonds as it settles,
 * Pull breaks them; the Floor Switch lets a player pick the floor for one block
 * after a look at what it will do. The rules are the package's; this is the loop,
 * the presses, the ghost of where the block will come to rest, and the floors.
 */
export default function MagneticBlocksGame(props: HousekiGameProps) {
  const { request, appearance, readOnly = false, onKeep, onEnd, onTitle, stopped = false } = props;
  const say = useSpeaker();
  const [state, setState] = useState<GameState>(() => open(props));
  const game = useRef<GameState>(state);
  const kept = useRef("");
  const ended = useRef(false);
  const [counting, setCounting] = useState<number | null>(null);
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
    onEnd?.({ outcome: final.phase === "won" ? "won" : final.phase === "finished" && level === null && lesson === null ? "complete" : "lost", score: final.score, save: encodeGame(final) });
  };
  const play = (action: Action): boolean => {
    const result = applyAction(game.current, action);
    if (!result.accepted) return false;
    set(result.state);
    if (TERMINAL.has(result.state.phase)) end(result.state);
    return true;
  };

  // Only an Arcade game has a clock; Relaxed ticks only to let a cleared block settle.
  useTickLoop(!readOnly && !stopped && !terminal && counting === null, (ticks) => {
    const result = advanceTicks(game.current, ticks);
    set(result.state);
    if (TERMINAL.has(result.state.phase)) end(result.state);
  });

  const pause = () => {
    const now = game.current;
    if (!terminal && now.settings.mode === "arcade" && now.phase === "falling") play({ kind: "pause" });
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
    for (let n = 3; n > 0; n -= 1) {
      setCounting(n);
      await new Promise((done) => setTimeout(done, 1000));
    }
    setCounting(null);
    play({ kind: "resume" });
  };

  useCheckpoints(
    () => {
      const now = game.current;
      if (readOnly || ended.current || TERMINAL.has(now.phase)) return;
      const text = encodeGame(now);
      kept.current = text;
      onKeep?.(text);
    },
    () => !readOnly && !ended.current && game.current.elapsedTicks + game.current.moves > 0 && encodeGame(game.current) !== kept.current,
    5000,
  );

  const keysOn = !readOnly && !stopped && !terminal;
  useGameKeys(keysOn, (key, event) => {
    const current = game.current;
    const lower = key.toLowerCase();
    let action: Action | null = null;
    if (key === "ArrowLeft") action = { kind: "left" };
    else if (key === "ArrowRight") action = { kind: "right" };
    else if (key === "ArrowDown") action = current.settings.mode === "arcade" ? { kind: "soft-drop" } : null;
    else if (key === "ArrowUp" || lower === "x") action = { kind: "rotate-clockwise" };
    else if (lower === "z") action = { kind: "rotate-anticlockwise" };
    else if (key === " ") {
      if ((event.target as HTMLElement | null)?.closest("button") != null) return;
      action = { kind: spaceOf(current) };
    } else if (key === "Escape" || lower === "p") {
      event.preventDefault();
      if (current.phase === "paused") void resume();
      else if (current.settings.mode === "arcade") play({ kind: "pause" });
      return;
    }
    if (action === null) return;
    event.preventDefault();
    if (event.repeat && !["left", "right", "soft-drop"].includes(action.kind)) return;
    play(action);
  });

  const projected = useMemo(() => {
    if (state.phase !== "falling" || state.active === null) return { ghost: null as GameState | null, drop: null as GameState | null };
    const ghost = applyAction(state, { kind: spaceOf(state) }).state;
    const drop = state.settings.mode === "relaxed" && state.settings.magneticImpact ? applyAction(state, { kind: "hard-drop" }).state : ghost;
    return { ghost, drop };
  }, [state]);
  const cells = useMemo(() => cellsOf(state, readOnly ? null : projected.ghost), [state, projected.ghost, readOnly]);
  const impactCount = projected.drop?.impactRemovedIds.length ?? 0;
  const showDrop = state.settings.mode === "arcade" || level !== null || lesson !== null;
  const relaxed = state.settings.mode === "relaxed";
  const locked = readOnly || stopped || terminal;
  const limit = state.settings.pieceLimit;
  const goal = state.settings.goal;
  const standing = new Set(state.board.flatMap((gem) => (gem === null ? [] : [gem.id])));
  const targets = goal?.kind === "clear-targets" ? goal.targetIds : [];
  const done = targets.filter((id) => !standing.has(id)).length;
  const shownFloor = state.pendingFloorOverride ?? state.floor;
  const status =
    counting !== null
      ? say.say("houseki.play.readyIn", { count: String(counting) })
      : state.phase === "paused"
        ? say.say("puzzle.solve.paused")
        : ["clear-mark", "clear-remove", "gravity"].includes(state.phase) && state.chain > 1
          ? say.say("houseki.play.chain", { count: String(state.chain) })
          : relaxed
            ? say.say("houseki.play.placeBlock")
            : "";
  const preview = state.queue.slice(0, 3).map((piece) => piece.map((colour) => ({ colour: colour as HousekiColour })));
  const floorWord = (floor: Floor) => say.say(floor === "magnetic" ? "houseki.floor.pull" : "houseki.floor.calm");

  return (
    <>
      {/* What the specs and the page read of the game, said once, and drawn nowhere. */}
      <span hidden data-testid="houseki-falling" data-phase={state.phase} data-score={state.score} data-progress={state.placements} />
      <div className="flex flex-col gap-3 empty:hidden" data-testid="houseki-hud">
      {readOnly ? null : (
        <StatRow>
          <Stat label={say.say("houseki.play.score")} value={state.score} testId="houseki-score" />
          <Stat label={say.say("houseki.play.bestChain")} value={state.maxChain} testId="houseki-chain" />
          <Stat label={say.say("houseki.play.blocksLeft")} value={Math.max(0, limit - state.placements)} testId="houseki-left" />
        </StatRow>
      )}
      {!readOnly && targets.length > 0 ? <GoalBar text={say.say("houseki.play.goalTargets", { done: String(done), total: String(targets.length) })} done={done} total={targets.length} /> : null}
      {!readOnly && goal?.kind === "clear-all" ? <p className="text-sm font-medium">{say.say("houseki.play.goalEmpty", { left: String(state.board.filter(Boolean).length) })}</p> : null}
      {level !== null && !readOnly ? <p className="text-sm" data-testid="houseki-objective">{level.objective[locale]}</p> : null}
      {lesson !== null && !readOnly ? <p className="text-sm" data-testid="houseki-lesson">{lesson.instruction.map((line) => line[locale]).join(" ")}</p> : null}
      {readOnly ? null : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <NextPieces label={say.say("houseki.play.next")} pieces={preview} vertical={false} />
          <span className="flex items-center gap-1.5 text-xs" data-testid="houseki-floor">
            <span className="text-muted">{say.say("houseki.play.floorNow")}</span>
            <b className={`rounded-md px-1.5 py-0.5 ${shownFloor === "magnetic" ? "bg-slate-700 text-white" : "bg-shade"}`}>{shownFloor === "magnetic" ? "✧ " : "● "}{floorWord(shownFloor)}</b>
            <span className="text-muted">{say.say("houseki.play.floorNext")}</span>
            <b className="rounded-md bg-shade px-1.5 py-0.5">{state.nextFloor === "magnetic" ? "✧ " : "● "}{floorWord(state.nextFloor)}</b>
          </span>
        </div>
      )}
      </div>
      <BoardColumn>
      <HousekiWell cols={state.settings.width} rows={state.settings.height} cells={cells} appearance={appearance} label={say.say("houseki.magneticBlocks.boardLabel")} phase={state.phase} fit={readOnly} round={false} />
      </BoardColumn>
      {readOnly ? null : (
        <div className="flex flex-col gap-3" data-testid="houseki-actions">
          <p className="min-h-5 text-sm" aria-live="polite" data-testid="houseki-status">
            {status}
            {impactCount > 0 && state.phase === "falling" ? ` ${say.say(relaxed ? "houseki.play.impactDrop" : "houseki.play.impact", { count: String(impactCount) })}` : ""}
          </p>
          <Controls label={say.say("houseki.play.controls")}>
            <ControlButton label="←" testId="houseki-left-button" onPress={() => play({ kind: "left" })} disabled={locked} title={say.say("houseki.play.left")} />
            <ControlButton label={`↶ ${say.say("houseki.play.turnLeft")}`} testId="houseki-turn-left" onPress={() => play({ kind: "rotate-anticlockwise" })} disabled={locked} title={say.say("houseki.play.turnLeft")} />
            <ControlButton label={`${say.say("houseki.play.turnRight")} ↷`} testId="houseki-turn-right" onPress={() => play({ kind: "rotate-clockwise" })} disabled={locked} title={say.say("houseki.play.turnRight")} />
            <ControlButton label="→" testId="houseki-right-button" onPress={() => play({ kind: "right" })} disabled={locked} title={say.say("houseki.play.right")} />
            <ControlButton label={say.say("houseki.play.down")} testId="houseki-down" onPress={() => play({ kind: "soft-drop" })} disabled={locked} hidden={relaxed} />
            <ControlButton label={say.say("houseki.play.drop")} testId="houseki-drop" onPress={() => play({ kind: "hard-drop" })} disabled={locked} hidden={!showDrop} strong={!relaxed} />
            <ControlButton label={say.say("houseki.play.place")} testId="houseki-place" onPress={() => play({ kind: "land" })} disabled={locked} hidden={!relaxed} strong />
            {state.phase === "paused" || counting !== null ? (
              <ControlButton label={say.say("puzzle.solve.resume")} testId="houseki-resume" onPress={() => void resume()} disabled={stopped || terminal || counting !== null} />
            ) : (
              <ControlButton label={say.say("puzzle.solve.pause")} testId="houseki-pause" onPress={() => play({ kind: "pause" })} disabled={locked} hidden={relaxed} />
            )}
          </Controls>
          {state.settings.floorSwitch ? (
            <section className="flex flex-col gap-1.5 rounded-lg border border-rule p-2" aria-label={say.say("houseki.floor.switch")} data-testid="houseki-switch">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm">{say.say("houseki.floor.switch")}</b>
                <span className="text-xs text-muted" data-testid="houseki-charges">{state.floorSwitchCharges > 0 ? say.say("houseki.floor.available") : say.say("houseki.floor.spent")}</span>
              </div>
              <p className="text-xs text-muted" data-chrome>{say.say("houseki.floor.help")}</p>
              <div className="flex flex-wrap gap-2">
                {(["calm", "magnetic"] as const).map((floor) => (
                  <button
                    key={floor}
                    type="button"
                    className={`${BUTTON_BASE} ${BUTTON_QUIET} ${state.pendingFloorOverride === floor ? "ring-2 ring-ink" : ""}`}
                    aria-pressed={state.pendingFloorOverride === floor}
                    disabled={locked || state.phase !== "falling" || state.floorSwitchCharges === 0}
                    onClick={() => play({ kind: "set-floor-override", floor })}
                    data-testid={`houseki-floor-${floor}`}
                  >
                    {floorWord(floor)}
                  </button>
                ))}
                <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} disabled={locked || state.pendingFloorOverride === null} onClick={() => play({ kind: "cancel-floor-override" })} data-testid="houseki-floor-cancel">
                  {say.say("houseki.floor.cancel")}
                </button>
              </div>
            </section>
          ) : null}
          <p className="text-xs text-muted" data-chrome>{say.say("houseki.magneticBlocks.keys")}</p>
        </div>
      )}
    </>
  );
}

/** The well as a list of cells: what has settled and how it is bonded, the block in the air, and where it will come to rest. */
function cellsOf(state: GameState, ghost: GameState | null): WellCell[] {
  const { width, height } = state.settings;
  const board = state.phase === "gravity" && state.gravityBoard !== null ? state.gravityBoard : state.board;
  const pending = new Set(state.pendingClear);
  const hit = new Set(ghost?.impactRemovedIds ?? []);
  const cells: WellCell[] = Array.from({ length: width * height }, (_, index) => ({ hole: state.settings.mask[index] === false ? true : undefined }));
  const at = new Map<number, number>();
  board.forEach((gem, index) => {
    if (gem !== null) at.set(gem.id, index);
  });
  board.forEach((gem, index) => {
    if (gem === null) return;
    cells[index] = { ...cells[index], gem: { id: gem.id, colour: gem.colour }, state: pending.has(index) ? "marked" : hit.has(gem.id) ? "impact" : undefined };
  });
  for (const edge of state.bonds) {
    const a = at.get(edge.a);
    const b = at.get(edge.b);
    if (a === undefined || b === undefined) continue;
    const link = (from: number, to: number) => {
      const bonds = (cells[from]!.bonds ??= {});
      if (to === from + 1) bonds.right = true;
      else if (to === from - 1) bonds.left = true;
      else if (to === from + width) bonds.down = true;
      else if (to === from - width) bonds.up = true;
    };
    link(a, b);
    link(b, a);
  }
  if (ghost !== null && state.active !== null) {
    const ids = new Set(state.active.gems.map((gem) => gem.id));
    const projected = ghost.gravityBoard ?? ghost.board;
    projected.forEach((gem, index) => {
      if (gem !== null && ids.has(gem.id) && cells[index] !== undefined && cells[index]!.gem === undefined) cells[index]!.ghost = { id: gem.id, colour: gem.colour };
    });
  }
  if (state.active !== null && state.phase === "falling") {
    for (const entry of blockCells(state.active, width)) {
      if (entry.index >= 0 && entry.index < cells.length) cells[entry.index] = { ...cells[entry.index], active: { id: entry.gem.id, colour: entry.gem.colour } };
    }
  }
  return cells;
}
