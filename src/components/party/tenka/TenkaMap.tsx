"use client";

import { useRef } from "react";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { ViewPad } from "@/components/puzzles/ViewPad";
import { TENKA_NEUTRAL } from "@/lib/party/tenka/tenka.constants";
import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { TENKA_SHAPES } from "@/lib/party/tenka/tenkaShapes.data";
import { tenkaPlayerName } from "@/lib/party/tenka/tenkaTurn";
import { centredBaseline } from "@/lib/ui/svgText";

import { PARTY_MARBLES } from "../party.constants";
import type { PartyMarble } from "../party.types";
import { TENKA_COPY, TENKA_FRAME_SHAPE, TENKA_LAND_OPACITY, TENKA_LINES, TENKA_NEUTRAL_MARBLE, TENKA_SEA, TENKA_SEA_DARK } from "./tenka.constants";
import type { TenkaMapProps } from "./tenka.types";
import { chipRadius } from "./tenkaView";
import { useMapView } from "./useMapView";

/** An owner's marble: a player's, or the neutral army's grey. */
export function ownerMarble(owner: number): PartyMarble {
  return owner === TENKA_NEUTRAL ? TENKA_NEUTRAL_MARBLE : PARTY_MARBLES[owner];
}

/**
 * THE WORLD, ON THE SITE'S OWN BOARD.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim and the
 * shadow are `BoardFrame`, in the reader's own board theme, with no
 * coordinates — a map has no letters and numbers. Only its shape follows the
 * map's (`TENKA_FRAME_SHAPE`): a map of the world is twice as wide as it is
 * tall, and a square board would be half sea.
 *
 * Inside, a plain chart: every territory filled in its owner's colour, the
 * borders between continents drawn heavier, the sea links dashed, and on each
 * territory a counter with the owner's letter and the armies there, so no
 * territory is told apart by colour alone. The chosen territory is ringed, the
 * ones it can reach outlined, a target ringed again.
 *
 * Looked at through the box with pinch, drag, wheel and Fit (`useMapView`,
 * `ViewPad`). Every territory, and its counter, is a button to a finger, a
 * keyboard and a screen reader, named by its name, owner and armies. The
 * outlines come from Natural Earth by `scripts/tenka-map.mjs`, and only this
 * component, in the browser, carries them.
 */
export function TenkaMap({ game, appearance, marks, onTerritory, readOnly: preview = false }: TenkaMapProps) {
  const theme = BOARD_THEMES[appearance.boardTheme];
  const box = useRef<HTMLDivElement>(null);
  const readOnly = preview || onTerritory === undefined;
  const { view, fitted, fit, press, onPointerDown, onClickCapture } = useMapView(box, TENKA_SHAPES.width, TENKA_SHAPES.height, readOnly);
  const radius = chipRadius(view?.scale ?? 1);
  const reach = new Set(marks.reach);
  const last = game.lastRoll;

  return (
    <div className={`w-full ${TENKA_FRAME_SHAPE}`}>
      <BoardFrame size={1} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false}>
        <div
          ref={box}
          className="absolute inset-0 touch-none select-none"
          style={{ background: theme.dark ? TENKA_SEA_DARK : TENKA_SEA }}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
          data-testid="tenka-map"
          data-fitted={fitted ? "true" : "false"}
          data-scale={view === null ? undefined : view.scale.toFixed(3)}
        >
          {view === null ? null : (
            <svg className="absolute inset-0 h-full w-full" role="group" aria-label={TENKA_COPY.map}>
              <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
                {TENKA_SHAPES.outlines.map((outline, territory) => {
                  const owner = game.owners[territory];
                  const marble = ownerMarble(owner);
                  const chosen = marks.chosen === territory || marks.target === territory;
                  return (
                    <path
                      key={territory}
                      d={outline}
                      fill={marble.fill}
                      fillOpacity={TENKA_LAND_OPACITY}
                      stroke="rgba(20,20,20,0.55)"
                      strokeWidth={TENKA_LINES.territory / view.scale}
                      strokeLinejoin="round"
                      className={readOnly ? undefined : "cursor-pointer"}
                      onClick={readOnly ? undefined : () => onTerritory?.(territory)}
                      data-testid="tenka-land"
                      data-territory={TENKA_TERRITORIES[territory].key}
                      data-chosen={chosen ? "true" : undefined}
                    />
                  );
                })}
                <path d={TENKA_SHAPES.continentBorders} fill="none" stroke="rgba(10,10,10,0.8)" strokeWidth={TENKA_LINES.continent / view.scale} strokeLinecap="round" pointerEvents="none" />
                {TENKA_SHAPES.seaLines.map(([x1, y1, x2, y2], line) => (
                  <line
                    key={line}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={theme.dark ? "#e8eef0" : "#1d3440"}
                    strokeWidth={TENKA_LINES.sea / view.scale}
                    strokeDasharray={TENKA_LINES.seaDash.split(" ").map((dash) => Number(dash) / view.scale).join(" ")}
                    pointerEvents="none"
                  />
                ))}
                {/* What is chosen, over the land: the territory ringed, what it may reach outlined, the target ringed again. */}
                {TENKA_SHAPES.outlines.map((outline, territory) => {
                  const ring = marks.chosen === territory || marks.target === territory ? TENKA_LINES.chosen : reach.has(territory) ? TENKA_LINES.reach : 0;
                  if (ring === 0) return null;
                  return (
                    <path
                      key={territory}
                      d={outline}
                      fill={reach.has(territory) && marks.target !== territory ? "rgba(255,255,255,0.22)" : "none"}
                      stroke={marks.target === territory ? theme.winning : reach.has(territory) ? "#ffffff" : "#111111"}
                      strokeWidth={ring / view.scale}
                      strokeDasharray={reach.has(territory) && marks.target !== territory ? `${6 / view.scale} ${4 / view.scale}` : undefined}
                      pointerEvents="none"
                      data-testid={reach.has(territory) ? "tenka-reach" : "tenka-chosen"}
                      data-territory={TENKA_TERRITORIES[territory].key}
                    />
                  );
                })}
                {TENKA_SHAPES.labels.map(([x, y], territory) => {
                  const owner = game.owners[territory];
                  const marble = ownerMarble(owner);
                  const armies = game.armies[territory];
                  const name = TENKA_TERRITORIES[territory].name;
                  const whose = owner === TENKA_NEUTRAL ? "the neutral army's" : `${tenkaPlayerName(game, owner)}'s`;
                  // The pill: the owner's letter, then the armies, each in room of its own.
                  const digits = String(armies).length;
                  const width = radius * (0.45 + 0.75 + 0.1 + 0.74 * digits + 0.45);
                  const letterX = -width / 2 + radius * (0.45 + 0.375);
                  const numberX = -width / 2 + radius * (0.45 + 0.75 + 0.1 + 0.37 * digits);
                  const fought = last !== null && (last.from === territory || last.to === territory);
                  return (
                    <g
                      key={territory}
                      transform={`translate(${x} ${y})`}
                      role={readOnly ? undefined : "button"}
                      tabIndex={readOnly ? undefined : 0}
                      aria-label={`${name}, ${whose} (${marble.label}, ${marble.letter}), ${armies} ${armies === 1 ? "army" : "armies"}`}
                      className={readOnly ? undefined : "cursor-pointer outline-none"}
                      onClick={readOnly ? undefined : () => onTerritory?.(territory)}
                      onKeyDown={
                        readOnly
                          ? undefined
                          : (event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              onTerritory?.(territory);
                            }
                      }
                      data-testid="tenka-territory"
                      data-territory={TENKA_TERRITORIES[territory].key}
                      data-name={name}
                      data-owner={owner}
                      data-armies={armies}
                      data-reach={reach.has(territory) ? "true" : undefined}
                      data-chosen={marks.chosen === territory ? "true" : undefined}
                      data-target={marks.target === territory ? "true" : undefined}
                    >
                      <rect
                        x={-width / 2}
                        y={-radius}
                        width={width}
                        height={radius * 2}
                        rx={radius}
                        fill={marble.fill}
                        stroke={fought ? theme.winning : "rgba(0,0,0,0.7)"}
                        strokeWidth={(fought ? 2.4 : 1) / view.scale}
                      />
                      <text x={letterX} y={centredBaseline(0, radius * 1.05)} fontSize={radius * 1.05} fontWeight={600} textAnchor="middle" fill={marble.ink} opacity={0.8} aria-hidden="true">
                        {marble.letter}
                      </text>
                      <text x={numberX} y={centredBaseline(0, radius * 1.25)} fontSize={radius * 1.25} fontWeight={700} textAnchor="middle" fill={marble.ink} aria-hidden="true">
                        {armies}
                      </text>
                      <title>{`${name}: ${whose}, ${armies}`}</title>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
          {readOnly ? null : <ViewPad fitted={fitted} onFit={fit} onPress={press} label={TENKA_COPY.fit} testId="tenka" />}
        </div>
      </BoardFrame>
    </div>
  );
}
