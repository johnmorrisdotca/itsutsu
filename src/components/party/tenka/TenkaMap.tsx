"use client";

import { useImperativeHandle, useRef, type MouseEvent } from "react";
import { usePartyMarbles } from "../partyMarbles";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { ViewPad } from "@/components/puzzles/ViewPad";
import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";
import { tenkaShapesFor } from "@/lib/party/tenka/tenkaShapes.data";

import {
  TENKA_COPY,
  TENKA_LAND_OPACITY,
  TENKA_LINES,
  TENKA_NARROW_BOX,
  TENKA_REGION_BUTTON,
  TENKA_REGION_NAMES,
  TENKA_SEA,
  TENKA_SEA_DARK,
  TENKA_TAP_REACH,
} from "./tenka.constants";
import type { TenkaMapProps } from "./tenka.types";
import { TenkaChips, ownerMarble } from "./TenkaChips";
import { TenkaWraps } from "./TenkaWraps";
import { READABLE_SCALE, areaAround, nearestTerritory } from "./tenkaView";
import { useMapView } from "./useMapView";

/**
 * THE WORLD, ON THE SITE'S OWN BOARD.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim and the
 * shadow are `BoardFrame`'s, in the reader's own board theme, with no
 * coordinates — a map has no letters and numbers — and the wood the shape of
 * a map (`aspect="map"`): four by three on a phone, two by one from a laptop.
 *
 * Inside, a plain chart: every territory filled in its owner's colour, the
 * borders between continents heavier, the sea links dashed, and on each
 * territory its counter (`TenkaChips`), the same size on the screen however
 * far the map is zoomed. The chosen territory is ringed, what it can reach
 * outlined, a target ringed again.
 *
 * MADE TO BE PLAYED ON A PHONE. Pinch, drag, the wheel and Fit
 * (`useMapView`, `ViewPad`); a row under the map to look at the whole world
 * or one continent with a tap; a tap on the sea takes the nearest territory
 * within a fingertip (`TENKA_TAP_REACH`), so an island or a sliver of Europe
 * never has to be hit exactly; and on a phone, choosing where an attack or a
 * move comes from frames it with what it can reach (`frameAround`), close
 * enough that every counter there is drawn whole.
 */
export function TenkaMap({ game, appearance, marks, onTerritory, readOnly: preview = false, handle }: TenkaMapProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  // The game's own map: the world, or Europe (Tenka 1.2).
  const shapes = tenkaShapesFor(game);
  const { territories, continents } = tenkaMapOf(game);
  const { width: MAP_W, height: MAP_H } = shapes;
  const theme = BOARD_THEMES[appearance.boardTheme];
  const box = useRef<HTMLDivElement>(null);
  const readOnly = preview || onTerritory === undefined;
  const tap = readOnly ? undefined : onTerritory;
  const { view, frame, fitted, fit, frameTo, press, onPointerDown, onClickCapture } = useMapView(box, MAP_W, MAP_H, readOnly);
  const reach = new Set(marks.reach);

  useImperativeHandle(
    handle,
    () => ({
      frameAround: (territories) => {
        // Only on a phone: a laptop's whole world is already big enough to play on.
        if (territories.length === 0 || frame.width === 0 || frame.width >= TENKA_NARROW_BOX) return;
        // The first, then the rest nearest first, as many as still fit with every counter drawn whole: a neighbour
        // across the Bering Strait or the Atlantic is left for a pan rather than shrinking the view to hold it.
        const [first, ...rest] = territories;
        const middle = (area: readonly number[]) => [(area[0] + area[2]) / 2, (area[1] + area[3]) / 2];
        const [fx, fy] = middle(shapes.boxes[first]);
        const nearest = [...rest].sort((a, b) => {
          const [ax, ay] = middle(shapes.boxes[a]);
          const [bx, by] = middle(shapes.boxes[b]);
          return Math.hypot(ax - fx, ay - fy) - Math.hypot(bx - fx, by - fy);
        });
        let around = shapes.boxes[first];
        for (const territory of nearest) {
          const wider = areaAround([around, shapes.boxes[territory]]);
          if ((wider[2] - wider[0]) * READABLE_SCALE > frame.width || (wider[3] - wider[1]) * READABLE_SCALE > frame.height) continue;
          around = wider;
        }
        frameTo(around, READABLE_SCALE);
      },
    }),
    [frame, frameTo],
  );

  /* A tap on the sea: the nearest territory within a fingertip takes it. */
  const onSea = (event: MouseEvent<SVGRectElement>) => {
    if (tap === undefined || view === null || box.current === null) return;
    const rect = box.current.getBoundingClientRect();
    const territory = nearestTerritory(shapes.labels, (event.clientX - rect.left - view.x) / view.scale, (event.clientY - rect.top - view.y) / view.scale, TENKA_TAP_REACH / view.scale);
    if (territory !== null) tap(territory);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <BoardFrame size={1} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false} aspect="map">
        <div
          ref={box}
          className="absolute inset-0 touch-none select-none"
          style={{ background: theme.dark ? TENKA_SEA_DARK : TENKA_SEA }}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
          data-testid="tenka-map"
          data-fitted={fitted ? "true" : "false"}
          data-scale={view === null ? undefined : view.scale.toFixed(3)}
          data-readable={view !== null && view.scale >= READABLE_SCALE ? "true" : "false"}
        >
          {view === null ? null : (
            <svg className="absolute inset-0 h-full w-full" role="group" aria-label={TENKA_COPY.mapOf(game.map)}>
              <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
                <rect x={-MAP_W} y={-MAP_H} width={MAP_W * 3} height={MAP_H * 3} fill="transparent" onClick={tap === undefined ? undefined : onSea} data-testid="tenka-sea" />
                {shapes.outlines.map((outline, territory) => (
                  <path
                    key={territory}
                    d={outline}
                    fill={ownerMarble(game.owners[territory], marbles).fill}
                    fillOpacity={TENKA_LAND_OPACITY}
                    stroke="rgba(20,20,20,0.55)"
                    strokeWidth={TENKA_LINES.territory / view.scale}
                    strokeLinejoin="round"
                    className={tap === undefined ? undefined : "cursor-pointer"}
                    onClick={tap === undefined ? undefined : () => tap(territory)}
                    data-testid="tenka-land"
                    data-territory={territories[territory].key}
                  />
                ))}
                <path d={shapes.continentBorders} fill="none" stroke="rgba(10,10,10,0.8)" strokeWidth={TENKA_LINES.continent / view.scale} strokeLinecap="round" pointerEvents="none" />
                {shapes.seaLines.map(([x1, y1, x2, y2], line) => (
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
                {shapes.outlines.map((outline, territory) => {
                  const ring = marks.chosen === territory || marks.target === territory ? TENKA_LINES.chosen : reach.has(territory) ? TENKA_LINES.reach : 0;
                  if (ring === 0) return null;
                  const onlyReach = reach.has(territory) && marks.target !== territory;
                  return (
                    <path
                      key={territory}
                      d={outline}
                      fill={onlyReach ? "rgba(255,255,255,0.22)" : "none"}
                      stroke={marks.target === territory ? theme.winning : onlyReach ? "#ffffff" : "#111111"}
                      strokeWidth={ring / view.scale}
                      strokeDasharray={onlyReach ? `${6 / view.scale} ${4 / view.scale}` : undefined}
                      pointerEvents="none"
                      data-testid={onlyReach ? "tenka-reach" : "tenka-chosen"}
                      data-territory={territories[territory].key}
                    />
                  );
                })}
                <TenkaWraps game={game} scale={view.scale} reach={reach} dark={theme.dark} onTerritory={tap} />
                <TenkaChips game={game} marks={marks} scale={view.scale} onTerritory={tap} />
              </g>
            </svg>
          )}
          {readOnly ? null : <ViewPad fitted={fitted} onFit={fit} onPress={press} label={TENKA_COPY.fit} testId="tenka" />}
        </div>
      </BoardFrame>
      {readOnly ? null : (
        /* One tap to look at a continent, or the whole world again: the regions a finger would otherwise pinch to. */
        <nav className="flex flex-wrap items-center gap-1.5" aria-label={TENKA_COPY.regions} data-testid="tenka-regions">
          <span className="text-xs text-muted">{TENKA_COPY.regions}</span>
          <button type="button" onClick={fit} className={TENKA_REGION_BUTTON} aria-pressed={fitted} data-testid="tenka-region" data-region="world">
            {game.map === "europe" ? TENKA_COPY.mapWords("europe") : TENKA_COPY.world}
          </button>
          {continents.map((continent) => (
            <button
              key={continent.key}
              type="button"
              onClick={() => frameTo(areaAround(continent.territories.map((territory) => shapes.boxes[territory])), 0)}
              className={TENKA_REGION_BUTTON}
              data-testid="tenka-region"
              data-region={continent.key}
            >
              {TENKA_REGION_NAMES[continent.key]}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
