"use client";

import {
  GEM_SWAP_CAMPAIGN,
  GEM_SWAP_LESSONS,
  advanceTicks,
  applyAction,
  createGame,
  decodeGame,
  encodeGame,
  legalActions,
  type GameState,
  type GemSwapCampaignLevel,
  type GemSwapLesson,
  type Goal,
} from "@johnmorrisdotca/houseki/gem-swap";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { HOUSEKI_SPECS } from "@/lib/houseki/houseki.constants";

import { BoardColumn, Controls, ControlButton, GoalBar, Stat, StatRow } from "./HousekiParts";
import { HousekiWell, type WellCell } from "./HousekiWell";
import { freshSeed, todayUtc, useCheckpoints, useTickLoop, type HousekiGameProps } from "./housekiRuntime";

const SPEC = HOUSEKI_SPECS.gemSwap;
const GLYPHS = { "row-beam": "↔", "column-beam": "↕", bomb: "✹", "colour-burst": "✦" } as const;

function contentOf(request: HousekiGameProps["request"]): { level: GemSwapCampaignLevel | null; lesson: GemSwapLesson | null } {
  if (request.kind === "level") return { level: GEM_SWAP_CAMPAIGN[request.number - 1] ?? null, lesson: null };
  if (request.kind === "lesson") return { level: null, lesson: GEM_SWAP_LESSONS[request.number - 1] ?? null };
  return { level: null, lesson: null };
}

function start(request: HousekiGameProps["request"]): GameState {
  const { level, lesson } = contentOf(request);
  if (level !== null) return createGame(level.options);
  if (lesson !== null) return createGame(lesson.initial);
  if (request.kind === "daily") return createGame({ mode: "daily", dailyDate: todayUtc() });
  const size = SPEC.sizes.find((each) => request.kind === "free" && each.id === request.size) ?? SPEC.sizes[0]!;
  return createGame({ mode: "relaxed", preset: size.id as "compact" | "standard" | "wide" | "tall", colourCount: request.kind === "free" ? request.colours : 5, seed: freshSeed() });
}

/** A value with its keys in order, so that two of them can be told apart by their text alone. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function isOf(state: GameState, request: HousekiGameProps["request"]): boolean {
  const { level, lesson } = contentOf(request);
  if (level !== null || lesson !== null) {
    const expected = createGame(level?.options ?? lesson!.initial);
    return canonical(expected.initialOptions) === canonical(state.initialOptions) && canonical(expected.challenge) === canonical(state.challenge);
  }
  if (request.kind === "daily") return state.mode === "daily" && state.dailyDate === todayUtc();
  if (request.kind === "free") {
    const size = SPEC.sizes.find((each) => each.id === request.size);
    return state.mode === "relaxed" && state.challenge === null && size !== undefined && state.settings.width === size.width && state.settings.height === size.height && state.settings.colourCount === request.colours && !state.settings.tools && state.settings.shape === undefined;
  }
  return false;
}

function open(props: HousekiGameProps): GameState {
  if (props.resume !== null) {
    try {
      const kept = decodeGame(props.resume);
      if (isOf(kept, props.request) && kept.outcome === null) return kept;
    } catch {
      /* A save this package will not read is a game not kept. */
    }
  }
  return start(props.request);
}

/**
 * GEM SWAP, played: a full board of gems, two neighbours to swap, and a line of
 * three or more to clear it. The game waits for the player; the loop here only
 * lets a swap settle and the cascades run (`advanceTicks`). A swap that makes
 * no line goes back, and the board says so.
 */
export default function GemSwapGame(props: HousekiGameProps) {
  const { request, appearance, readOnly = false, onKeep, onEnd, onTitle, stopped = false } = props;
  const say = useSpeaker();
  const [state, setState] = useState<GameState>(() => open(props));
  const game = useRef<GameState>(state);
  const kept = useRef("");
  const ended = useRef(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [back, setBack] = useState(false);
  const { level, lesson } = contentOf(request);
  const terminal = state.outcome !== null;
  const locale = say.locale === "ja" ? "ja" : "en";

  useEffect(() => {
    onTitle?.(level !== null ? level.title[locale] : lesson !== null ? lesson.title[locale] : "");
  }, [level, lesson, locale, onTitle]);

  const set = (next: GameState) => {
    game.current = next;
    setState(next);
  };
  const end = (final: GameState) => {
    if (ended.current || readOnly || final.outcome === null) return;
    ended.current = true;
    onEnd?.({ outcome: final.outcome === "won" ? "won" : final.outcome === "finished" && (request.kind === "daily" || request.kind === "free") ? "complete" : "lost", score: final.score, save: encodeGame(final) });
  };

  useTickLoop(!readOnly && !stopped && !terminal && state.phase !== "ready", (ticks) => {
    const result = advanceTicks(game.current, ticks);
    set(result.state);
    end(result.state);
  });

  useCheckpoints(
    () => {
      const now = game.current;
      if (readOnly || ended.current || now.outcome !== null) return;
      const text = encodeGame(now);
      kept.current = text;
      onKeep?.(text);
    },
    () => !readOnly && !ended.current && game.current.swapCount > 0 && encodeGame(game.current) !== kept.current,
    3000,
  );

  const press = (index: number) => {
    const now = game.current;
    if (now.phase !== "ready" || now.board[index] === null || now.board[index] === undefined) return;
    setBack(false);
    if (chosen === null) return setChosen(index);
    if (chosen === index) return setChosen(null);
    const result = applyAction(now, { kind: "swap", from: chosen, to: index });
    if (result.accepted) {
      setChosen(null);
      set(result.state);
      end(result.state);
    } else {
      // A swap that makes no line goes back; the gem pressed is the one to swap from next.
      setBack(true);
      setChosen(index);
    }
  };

  const cells = useMemo(() => cellsOf(state, chosen), [state, chosen]);
  const legal = legalActions(state);
  const stuck = state.phase === "ready" && !terminal && legal.some((action) => action.kind === "reshuffle");
  const challenge = state.challenge;
  const moveLimit = challenge?.moveLimit;
  const goals = challenge?.goals ?? [];
  const locked = readOnly || stopped || terminal;
  const status = state.phase !== "ready" ? say.say("houseki.play.clearing") : back ? say.say("houseki.play.swapBack") : chosen !== null ? say.say("houseki.play.chooseNeighbour") : say.say("houseki.play.chooseGem");

  return (
    <>
      {/* What the specs and the page read of the game, said once, and drawn nowhere. */}
      <span hidden data-testid="houseki-full" data-phase={state.phase} data-score={state.score} data-progress={state.swapCount} />
      <div className="flex flex-col gap-3 empty:hidden" data-testid="houseki-hud">
      {readOnly ? null : (
        <StatRow>
          <Stat label={say.say("houseki.play.score")} value={state.score} testId="houseki-score" />
          <Stat label={say.say("houseki.play.swaps")} value={state.swapCount} testId="houseki-moves" />
          {moveLimit !== undefined ? <Stat label={say.say("houseki.play.swapsLeft")} value={Math.max(0, moveLimit - state.swapCount)} testId="houseki-left" /> : null}
          <Stat label={say.say("houseki.play.bestChain")} value={state.bestChain} testId="houseki-chain" />
        </StatRow>
      )}
      {readOnly
        ? null
        : goals.map((goal, index) => {
            const line = goalLine(goal, state, say);
            return <GoalBar key={index} text={line.text} done={line.done} total={line.total} />;
          })}
      {lesson !== null && !readOnly ? <p className="text-sm" data-testid="houseki-lesson">{lesson.steps.map((step) => step.text[locale]).join(" ")}</p> : null}
      </div>
      <BoardColumn>
      <HousekiWell
        cols={state.settings.width}
        rows={state.settings.height}
        cells={cells}
        appearance={appearance}
        label={say.say("houseki.gemSwap.boardLabel")}
        phase={state.phase} fit={readOnly}
        round={false}
        onCell={readOnly || stopped || terminal ? undefined : press}
      />
      </BoardColumn>
      {readOnly ? null : (
        <div className="flex flex-col gap-3" data-testid="houseki-actions">
          <p className="min-h-5 text-sm" aria-live="polite" data-testid="houseki-status">
            {status}
          </p>
          <Controls label={say.say("houseki.play.controls")}>
            <ControlButton label={say.say("ending.cancel")} testId="houseki-cancel" onPress={() => setChosen(null)} disabled={locked || chosen === null} />
            <ControlButton
              label={say.say("houseki.play.reshuffle")}
              testId="houseki-reshuffle"
              onPress={() => {
                const result = applyAction(game.current, { kind: "reshuffle" });
                if (result.accepted) set(result.state);
              }}
              disabled={locked}
              hidden={!stuck}
              strong
            />
          </Controls>
          <p className="text-xs text-muted" data-chrome>{say.say("houseki.gemSwap.keys")}</p>
        </div>
      )}
    </>
  );
}

/** What a goal says, and how far along it is. */
function goalLine(goal: Goal, state: GameState, say: ReturnType<typeof useSpeaker>): { text: string; done: number; total: number } {
  if (goal.kind === "score") return { text: say.say("houseki.play.goalScore", { done: String(Math.min(state.score, goal.target)), total: String(goal.target) }), done: Math.min(state.score, goal.target), total: goal.target };
  if (goal.kind === "collect") {
    const got = Math.min(state.clearedByColour[goal.colour] ?? 0, goal.target);
    return { text: say.say("houseki.play.goalCollect", { colour: goal.colour, done: String(got), total: String(goal.target) }), done: got, total: goal.target };
  }
  if (goal.kind === "chain") return { text: say.say("houseki.play.goalChain", { done: String(Math.min(state.bestChain, goal.target)), total: String(goal.target) }), done: Math.min(state.bestChain, goal.target), total: goal.target };
  const total = state.seals.length + state.sealsCleared;
  return { text: say.say("houseki.play.goalSeals", { done: String(state.sealsCleared), total: String(total) }), done: state.sealsCleared, total };
}

/** The board as cells: each gem with its special mark, the one chosen to swap, the seals still on the board and the gems that are going. */
function cellsOf(state: GameState, chosen: number | null): WellCell[] {
  const board = state.phase === "gravity" && state.gravityBoard !== null ? state.gravityBoard : state.board;
  const going = new Set(state.pendingCells);
  const sealed = new Set(state.seals.map((seal) => seal.cell));
  return board.map((gem, index) => ({
    hole: state.settings.mask[index] === false ? true : undefined,
    gem: gem === null ? undefined : { id: gem.id, colour: gem.colour, glyph: gem.kind === undefined ? undefined : GLYPHS[gem.kind] },
    state: going.has(index) ? (state.phase === "clear-remove" ? "removing" : "marked") : index === chosen ? "selected" : sealed.has(index) ? "target" : undefined,
  }));
}
