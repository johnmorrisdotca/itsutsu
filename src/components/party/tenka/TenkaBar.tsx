"use client";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { TENKA_MOVES, TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import type { TenkaPhase } from "@/lib/party/tenka/tenka.types";
import { mustTrade } from "@/lib/party/tenka/tenka";
import { setsIn, tradeValue } from "@/lib/party/tenka/tenkaCards";
import { mostAttackDice } from "@/lib/party/tenka/tenkaDice";
import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { tenkaPlayerName } from "@/lib/party/tenka/tenkaTurn";

import { MarbleChip } from "../MarbleChip";
import { TENKA_COPY } from "./tenka.constants";
import type { TenkaBarProps } from "./tenka.types";
import { choiceNow } from "./tenkaTaps";

/** Which of the four steps a phase is part of. */
const STEP_OF: Record<TenkaPhase, number> = { setUp: 0, reinforce: 0, attack: 1, occupy: 1, fortify: 2, shift: 2, over: 3 };

const name = (territory: number) => TENKA_TERRITORIES[territory].name;

function Stepper({ value, least, most, onChange }: { value: number; least: number; most: number; onChange: (value: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1" data-testid="tenka-stepper">
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} min-w-11 px-2`} onClick={() => onChange(Math.max(least, value - 1))} disabled={value <= least} aria-label="One fewer">
        −
      </button>
      <span className="min-w-8 text-center text-base font-semibold tabular-nums" data-testid="tenka-count">
        {value}
      </span>
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} min-w-11 px-2`} onClick={() => onChange(Math.min(most, value + 1))} disabled={value >= most} aria-label="One more">
        +
      </button>
    </span>
  );
}

/**
 * THE PHASE BAR: Place · Attack · Fortify · End turn, the step the turn is at
 * lit, and under it the buttons that step needs — always in reach of the
 * thumb, stuck to the foot of a phone's screen while the map is looked at.
 *
 * It asks the rules for nothing and decides nothing: each button is one move
 * (or, for a fortifying move, its two halves) handed to the table, which asks
 * `playTenka`. Between players' turns it asks for the device to be passed on,
 * by name, before anybody's cards are shown.
 */
export function TenkaBar({ game, choice, onMove, onArmies, handed, onReady }: TenkaBarProps) {
  const now = choiceNow(game, choice);
  const player = tenkaPlayerName(game, game.toPlay);
  const step = STEP_OF[game.phase];

  if (game.phase === TENKA_PHASES.over) return null;

  return (
    <section
      className="sticky bottom-0 z-20 flex flex-col gap-2 rounded-2xl border border-rule bg-paper/95 px-4 py-3 shadow-[0_-6px_16px_-10px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:static lg:shadow-none"
      data-testid="tenka-bar"
      data-phase={game.phase}
      aria-live="polite"
    >
      <ol className="flex items-center gap-1 text-[0.7rem] font-semibold tracking-[0.1em] uppercase" aria-label="The steps of a turn">
        {TENKA_COPY.steps.map((label, at) => (
          <li key={label} className={`rounded-full px-2 py-0.5 ${at === step ? "bg-ink text-paper" : "text-muted"}`} aria-current={at === step ? "step" : undefined} data-testid="tenka-step" data-current={at === step ? "true" : undefined}>
            {label}
          </li>
        ))}
      </ol>

      {!handed ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="tenka-pass">
          <MarbleChip player={game.toPlay} />
          <span className="text-base font-semibold" data-testid="tenka-pass-to">
            {TENKA_COPY.passTo(player)}
          </span>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onReady} data-testid="tenka-ready">
            {TENKA_COPY.ready(player)}
          </button>
        </div>
      ) : (
        <BarActions game={game} now={now} onMove={onMove} onArmies={onArmies} />
      )}
    </section>
  );
}

function BarActions({ game, now, onMove, onArmies }: Pick<TenkaBarProps, "game" | "onMove" | "onArmies"> & { now: ReturnType<typeof choiceNow> }) {
  const line = (text: string, testId = "tenka-say") => (
    <p className="text-sm" data-testid={testId}>
      {text}
    </p>
  );
  switch (game.phase) {
    case TENKA_PHASES.setUp:
      return line(TENKA_COPY.setUp(game.setUpLeft[game.toPlay]));
    case TENKA_PHASES.reinforce: {
      const sets = setsIn(game.hands[game.toPlay]);
      return (
        <div className="flex flex-col gap-2">
          {line(mustTrade(game) ? TENKA_COPY.mustTrade : TENKA_COPY.place(game.reserve))}
          <div className="flex flex-wrap gap-2">
            {sets.length > 0 ? (
              <button type="button" className={`${BUTTON_BASE} ${mustTrade(game) ? BUTTON_STRONG : BUTTON_QUIET}`} onClick={() => onMove({ kind: TENKA_MOVES.trade, cards: sets[0] })} data-testid="tenka-trade-first">
                {TENKA_COPY.trade(tradeValue(game.trades))}
              </button>
            ) : null}
            {now.placedOn !== null && !mustTrade(game) && game.reserve > 1 ? (
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={() => onMove({ kind: TENKA_MOVES.place, territory: now.placedOn!, armies: game.reserve })} data-testid="tenka-place-all">
                {TENKA_COPY.placeAll(game.reserve, name(now.placedOn))}
              </button>
            ) : null}
          </div>
        </div>
      );
    }
    case TENKA_PHASES.attack: {
      const most = now.from === null ? 0 : mostAttackDice(game.armies[now.from]);
      return (
        <div className="flex flex-col gap-2">
          {line(now.from !== null && now.to !== null ? TENKA_COPY.attackTarget(name(now.from), name(now.to)) : TENKA_COPY.attackHint)}
          <div className="flex flex-wrap gap-2">
            {now.from !== null && now.to !== null
              ? [...Array.from({ length: most }, (_, at) => most - at)].map((dice) => (
                  <button
                    key={dice}
                    type="button"
                    className={`${BUTTON_BASE} ${dice === most ? BUTTON_STRONG : BUTTON_QUIET}`}
                    onClick={() => onMove({ kind: TENKA_MOVES.attack, from: now.from!, to: now.to!, dice })}
                    data-testid="tenka-roll"
                    data-dice={dice}
                  >
                    {TENKA_COPY.roll(dice)}
                  </button>
                ))
              : null}
            {now.from !== null && now.to !== null ? (
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => onMove({ kind: TENKA_MOVES.blitz, from: now.from!, to: now.to! })} data-testid="tenka-blitz">
                {TENKA_COPY.blitz}
              </button>
            ) : null}
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => onMove({ kind: TENKA_MOVES.endAttack })} data-testid="tenka-end-attack">
              {TENKA_COPY.doneAttacking} →
            </button>
          </div>
        </div>
      );
    }
    case TENKA_PHASES.occupy: {
      const taking = game.occupying!;
      return (
        <div className="flex flex-col gap-2">
          {line(TENKA_COPY.occupy(name(taking.to)))}
          <div className="flex flex-wrap items-center gap-2">
            <Stepper value={now.armies} least={taking.least} most={game.armies[taking.from] - 1} onChange={onArmies} />
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={() => onMove({ kind: TENKA_MOVES.occupy, armies: now.armies })} data-testid="tenka-occupy">
              {TENKA_COPY.moveIn(now.armies)}
            </button>
          </div>
        </div>
      );
    }
    case TENKA_PHASES.fortify:
    case TENKA_PHASES.shift: {
      const pair = game.shifting ?? (now.from !== null && now.to !== null ? { from: now.from, to: now.to } : null);
      const armies = game.shifting !== null ? Math.max(1, Math.min(now.armies || 1, game.armies[game.shifting.from] - 1)) : now.armies;
      return (
        <div className="flex flex-col gap-2">
          {line(pair !== null ? TENKA_COPY.fortifyPair(name(pair.from), name(pair.to)) : TENKA_COPY.fortifyHint)}
          <div className="flex flex-wrap items-center gap-2">
            {pair !== null ? (
              <>
                <Stepper value={armies} least={1} most={game.armies[pair.from] - 1} onChange={onArmies} />
                <button
                  type="button"
                  className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                  onClick={() =>
                    onMove(
                      game.shifting !== null
                        ? { kind: TENKA_MOVES.shift, armies }
                        : [
                            { kind: TENKA_MOVES.fortify, from: pair.from, to: pair.to },
                            { kind: TENKA_MOVES.shift, armies },
                          ],
                    )
                  }
                  data-testid="tenka-fortify"
                >
                  {TENKA_COPY.fortify(armies)}
                </button>
              </>
            ) : null}
            {game.phase === TENKA_PHASES.fortify ? (
              <button type="button" className={`${BUTTON_BASE} ${pair === null ? BUTTON_STRONG : BUTTON_QUIET}`} onClick={() => onMove({ kind: TENKA_MOVES.endTurn })} data-testid="tenka-end-turn">
                {TENKA_COPY.endTurn} →
              </button>
            ) : null}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
