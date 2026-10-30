"use client";

import {
  applyAction,
  canPlace,
  createGame,
  createLevel,
  createTutorial,
  decodeGame,
  encodeGame,
  levelManifest,
  statusOf,
  tutorialManifest,
  type GameState,
  type Piece,
} from "@johnmorrisdotca/houseki/tsumiki";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { BoardColumn, GoalBar, Stat, StatRow } from "./HousekiParts";
import { HousekiWell, MiniGem, type WellCell } from "./HousekiWell";
import { freshSeed, todayUtc, useCheckpoints, type HousekiGameProps } from "./housekiRuntime";

const SIDE = 8;
const TERMINAL = new Set(["won", "lost", "finished"]);

type Request = HousekiGameProps["request"];

function contentOf(request: Request) {
  if (request.kind === "level") return { level: levelManifest[request.number - 1] ?? null, lesson: null };
  if (request.kind === "lesson") return { level: null, lesson: tutorialManifest[request.number - 1] ?? null };
  return { level: null, lesson: null };
}

function start(request: Request): GameState {
  const { level, lesson } = contentOf(request);
  if (level !== null) return createLevel(level.id);
  if (lesson !== null) return createTutorial(lesson.id);
  if (request.kind === "daily") return createGame({ mode: "daily", dailyDate: todayUtc() });
  return createGame({ mode: "relaxed", seed: freshSeed() });
}

function isOf(state: GameState, request: Request): boolean {
  const { level, lesson } = contentOf(request);
  const settings = state.settings;
  if (level !== null) return settings.challengeId === level.id;
  if (lesson !== null) return settings.challengeId === lesson.id;
  if (request.kind === "daily") return settings.mode === "daily" && settings.dailyDate === todayUtc();
  return request.kind === "free" && settings.mode === "relaxed";
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

/** A piece drawn small, in the tray: its own shape on a grid just big enough for it. */
function PieceShape({ piece }: { piece: Piece }) {
  const rows = Math.max(...piece.cells.map(([row]) => row)) + 1;
  const columns = Math.max(...piece.cells.map(([, column]) => column)) + 1;
  const filled = new Set(piece.cells.map(([row, column]) => row * columns + column));
  return (
    <span className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${columns}, clamp(0.85rem, 4.2cqw, 1.35rem))`, gridAutoRows: "clamp(0.85rem, 4.2cqw, 1.35rem)" }}>
      {Array.from({ length: rows * columns }, (_, at) => (
        <span key={at} className="relative block">
          {filled.has(at) ? <span className="absolute inset-0 flex items-center justify-center [&>span]:!size-full [&>span]:text-[0.7rem]"><MiniGem colour={piece.colour} round={false} /></span> : null}
        </span>
      ))}
    </span>
  );
}

/**
 * TSUMIKI, played: three shapes in a tray, laid on an eight by eight board, and every row or column that fills
 * clears. It waits for the player and has no clock. A shape is chosen in the tray and then a square on the board,
 * where its top left goes; moving over the board shows where it would land, and a finger or a mouse
 * can also drag it there. The engine and the levels are the package's (`@johnmorrisdotca/houseki/tsumiki`),
 * and what a win sends is its save, which the server plays again (`housekiVerify.ts`).
 */
export default function TsumikiGame(props: HousekiGameProps) {
  const { request, appearance, readOnly = false, onKeep, onEnd, onTitle, stopped = false } = props;
  const say = useSpeaker();
  const [state, setState] = useState<GameState>(() => open(props));
  const game = useRef<GameState>(state);
  const kept = useRef("");
  const ended = useRef(false);
  const [slot, setSlot] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const well = useRef<HTMLDivElement>(null);
  const justChosen = useRef(false);
  const { level, lesson } = contentOf(request);
  const terminal = TERMINAL.has(state.phase);
  const locale = say.locale === "ja" ? "ja" : "en";

  useEffect(() => {
    onTitle?.(level !== null ? level.title[locale] : lesson !== null ? lesson.title[locale] : "");
  }, [level, lesson, locale, onTitle]);

  const end = (final: GameState) => {
    if (ended.current || readOnly) return;
    ended.current = true;
    const unbounded = request.kind === "daily" || request.kind === "free";
    onEnd?.({ outcome: final.phase === "won" ? "won" : final.phase === "finished" && unbounded ? "complete" : "lost", score: final.score, save: encodeGame(final) });
  };
  const locked = readOnly || stopped || terminal;
  const place = (at: number) => {
    if (slot === null || locked) return;
    const result = applyAction(game.current, { kind: "place", slot, row: Math.floor(at / SIDE), column: at % SIDE });
    if (!result.accepted) return;
    game.current = result.state;
    setState(result.state);
    setSlot(null);
    setOver(null);
    if (TERMINAL.has(result.state.phase)) end(result.state);
  };

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

  /* The cell under a finger or the mouse, from the board's own box: a drag that began in the tray never presses a cell. */
  const cellAt = (x: number, y: number): number | null => {
    const box = well.current?.querySelector<HTMLElement>('[role="group"]')?.getBoundingClientRect();
    if (box === undefined || box.width === 0) return null;
    const column = Math.floor(((x - box.left) / box.width) * SIDE);
    const row = Math.floor(((y - box.top) / box.height) * SIDE);
    return column < 0 || row < 0 || column >= SIDE || row >= SIDE ? null : row * SIDE + column;
  };

  const cells = useMemo(() => cellsOf(state, slot, over), [state, slot, over]);
  const status = statusOf(state);
  const goal = state.settings.goal;
  const total = status.goalTotal;
  const goalText =
    goal === undefined
      ? null
      : goal.kind === "score"
        ? say.say("houseki.tsumiki.goalScore", { done: String(status.goalDone), total: String(total) })
        : goal.kind === "lines"
          ? say.say("houseki.tsumiki.goalLines", { done: String(status.goalDone), total: String(total) })
          : say.say("houseki.tsumiki.goalStones", { done: String(status.goalDone), total: String(total) });
  const noRoom = slot !== null && over !== null && !canPlace(state, slot, Math.floor(over / SIDE), over % SIDE);

  return (
    <>
      {/* What the specs and the page read of the game, said once, and drawn nowhere. */}
      <span hidden data-testid="houseki-full" data-phase={state.phase} data-score={state.score} data-progress={state.moves} data-lines={state.lines} />
      <div className="flex flex-col gap-3 empty:hidden" data-testid="houseki-hud">
        {readOnly ? null : (
          <StatRow>
            <Stat label={say.say("houseki.play.score")} value={state.score} testId="houseki-score" />
            <Stat label={say.say("houseki.tsumiki.lines")} value={state.lines} testId="houseki-lines" />
            <Stat label={say.say("gamescreen.statMoves")} value={state.moves} testId="houseki-moves" />
          </StatRow>
        )}
        {goalText !== null && !readOnly ? <GoalBar text={goalText} done={status.goalDone} total={total} /> : null}
        {lesson !== null && !readOnly ? <p className="text-sm" data-testid="houseki-lesson">{lesson.steps.map((step) => step.instruction[locale]).join(" ")}</p> : null}
        {level !== null && !readOnly ? <p className="text-sm" data-testid="houseki-objective">{level.title[locale]}</p> : null}
      </div>
      <BoardColumn>
        <div
          ref={well}
          style={dragging ? { touchAction: "none" } : undefined}
          onPointerMove={readOnly || slot === null ? undefined : (event) => setOver(cellAt(event.clientX, event.clientY))}
          onPointerLeave={readOnly ? undefined : () => setOver(null)}
        >
          <HousekiWell cols={SIDE} rows={SIDE} cells={cells} appearance={appearance} label={say.say("houseki.tsumiki.boardLabel")} phase={state.phase} fit={readOnly} round={false} onCell={locked ? undefined : place} />
        </div>
      </BoardColumn>
      {readOnly ? null : (
        <div className="flex flex-col gap-3" data-testid="houseki-actions">
          <div
            className="flex items-center justify-center gap-2 sm:gap-4"
            style={{ containerType: "inline-size" }}
            role="group"
            aria-label={say.say("houseki.tsumiki.tray")}
            data-testid="tsumiki-tray"
            data-chrome-keep
          >
            {state.tray.map((piece, at) => (
              <button
                key={at}
                type="button"
                className={`flex h-28 max-w-32 min-w-0 flex-1 touch-none items-center justify-center rounded-md border p-1 ${slot === at ? "border-ink ring-2 ring-ink" : "border-rule"} ${piece === null ? "invisible" : "cursor-grab"}`}
                disabled={piece === null || locked}
                aria-pressed={slot === at}
                aria-label={say.say("houseki.tsumiki.shape", { number: String(at + 1), cells: String(piece?.cells.length ?? 0) })}
                onClick={() => {
                  // The press that chose it, ending: a second press on a chosen shape is what lets it go.
                  if (justChosen.current) justChosen.current = false;
                  else setSlot((so) => (so === at ? null : at));
                }}
                onPointerDown={(event) => {
                  if (piece === null || locked) return;
                  justChosen.current = slot !== at;
                  setSlot(at);
                  setDragging(true);
                  event.currentTarget.releasePointerCapture?.(event.pointerId);
                  const up = (lifted: PointerEvent) => {
                    window.removeEventListener("pointerup", up);
                    window.removeEventListener("pointermove", moved);
                    setDragging(false);
                    const cell = cellAt(lifted.clientX, lifted.clientY);
                    if (cell !== null) {
                      const result = applyAction(game.current, { kind: "place", slot: at, row: Math.floor(cell / SIDE), column: cell % SIDE });
                      if (result.accepted) {
                        game.current = result.state;
                        setState(result.state);
                        setSlot(null);
                        setOver(null);
                        if (TERMINAL.has(result.state.phase)) end(result.state);
                      }
                    }
                  };
                  const moved = (move: PointerEvent) => setOver(cellAt(move.clientX, move.clientY));
                  window.addEventListener("pointerup", up);
                  window.addEventListener("pointermove", moved);
                }}
                data-testid="tsumiki-slot"
                data-slot={at}
                data-shape={piece?.shape}
                data-chosen={slot === at ? "true" : "false"}
              >
                {piece === null ? null : <PieceShape piece={piece} />}
              </button>
            ))}
          </div>
          <p className="min-h-5 text-sm" aria-live="polite" data-testid="houseki-status" data-no-room={noRoom ? "true" : "false"}>
            {terminal ? "" : slot === null ? say.say("houseki.tsumiki.choose") : noRoom ? say.say("houseki.tsumiki.noRoom") : say.say("houseki.tsumiki.place")}
          </p>
          <p className="text-xs text-muted" data-chrome>{say.say("houseki.tsumiki.keys")}</p>
        </div>
      )}
    </>
  );
}

/** The board as cells: each block, a stone with its mark, and the ghost of the shape chosen where it would land. */
function cellsOf(state: GameState, slot: number | null, over: number | null): WellCell[] {
  const piece = slot === null ? null : state.tray[slot];
  const ghost = new Set<number>();
  if (piece !== null && piece !== undefined && over !== null && slot !== null && canPlace(state, slot, Math.floor(over / SIDE), over % SIDE)) {
    for (const [row, column] of piece.cells) ghost.add(over + row * SIDE + column);
  }
  return state.board.map((block, index) => ({
    gem: block === null ? undefined : { id: block.id, colour: block.colour, ...(block.stone ? { glyph: "◆" } : {}) },
    ghost: ghost.has(index) && piece !== null && piece !== undefined ? { colour: piece.colour } : undefined,
    state: block?.stone === true ? ("target" as const) : undefined,
  }));
}
