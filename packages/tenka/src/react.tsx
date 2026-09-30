import { useEffect, useRef, type HTMLAttributes, type SVGAttributes } from "react";

import type { TenkaGame, TenkaMapMarks } from "./tenka.types.ts";
import { NO_MARKS, tenkaMapModel } from "./ui/mapModel.ts";
import { mountTenka, type TenkaTableOptions } from "./ui/mount.ts";

const RING = { chosen: { stroke: "#111", width: 5 }, target: { stroke: "#fff", width: 5 }, reach: { stroke: "#111", width: 2.5 } } as const;

export type TenkaMapProps = {
  game: Pick<TenkaGame, "owners" | "armies">;
  /** What to light up: from `marksFor(game, choice)`. */
  marks?: TenkaMapMarks;
  /** A colour for each seat. */
  colours?: readonly string[];
  /** A territory pressed. Without it the map is only a picture. */
  onTerritory?: (territory: number) => void;
  label?: string;
} & Omit<SVGAttributes<SVGSVGElement>, "onClick">;

/**
 * THE WORLD, AS A REACT COMPONENT: every territory in its owner's colour,
 * its counter of armies, the rings of a choice, and a press on a territory
 * or its counter reported by number. It draws; the rules stay in
 * `playTenka`, and what a press means in `tapTerritory`. Scales to its
 * container's width; style `.tk-land`, `.tk-sea` and the rest as you like.
 */
export function TenkaMap({ game, marks = NO_MARKS, colours, onTerritory, label = "Map of the world", ...svg }: TenkaMapProps) {
  const model = tenkaMapModel(game, marks, colours);
  const press = onTerritory === undefined ? undefined : (territory: number) => () => onTerritory(territory);
  return (
    <svg viewBox={`0 0 ${model.width} ${model.height}`} role="group" aria-label={label} {...svg}>
      <rect x={0} y={0} width={model.width} height={model.height} fill="#b9d3dc" className="tk-sea" />
      {model.lands.map((land) => (
        <path key={land.key} d={land.outline} fill={land.fill} fillOpacity={0.82} stroke="rgba(20,20,20,0.55)" strokeWidth={1.2} strokeLinejoin="round" className="tk-land" data-territory={land.key} onClick={press?.(land.territory)} style={press === undefined ? undefined : { cursor: "pointer" }}>
          <title>{`${land.name}: ${land.armies}`}</title>
        </path>
      ))}
      <path d={model.continentBorders} fill="none" stroke="rgba(10,10,10,0.8)" strokeWidth={3} strokeLinecap="round" pointerEvents="none" />
      {model.seaLines.map(([x1, y1, x2, y2], line) => (
        <line key={line} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1d3440" strokeWidth={2} strokeDasharray="8 6" pointerEvents="none" />
      ))}
      {model.lands.map((land) =>
        land.ring === null ? null : <path key={`ring-${land.key}`} d={land.outline} fill="none" stroke={RING[land.ring].stroke} strokeWidth={RING[land.ring].width} strokeLinejoin="round" pointerEvents="none" />,
      )}
      {model.lands.map((land) => (
        <g key={`counter-${land.key}`} onClick={press?.(land.territory)} style={press === undefined ? undefined : { cursor: "pointer" }}>
          <circle cx={land.at[0]} cy={land.at[1]} r={17} fill={land.fill} stroke="#111" strokeWidth={2} />
          <text x={land.at[0]} y={land.at[1]} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth={3} paintOrder="stroke">
            {land.armies}
          </text>
        </g>
      ))}
    </svg>
  );
}

export type TenkaTableProps = TenkaTableOptions & Omit<HTMLAttributes<HTMLDivElement>, keyof TenkaTableOptions>;

/**
 * A whole table against the computer, as a React component: the plain-DOM
 * table (`mountTenka`) mounted into this component's element once the
 * browser has it. Options are read when it mounts; give it a new `key` to
 * start over with different ones.
 */
export function TenkaTable({ players, computers, rounds, seed, colours, computerDelayMs, onChange, ...element }: TenkaTableProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(() => {
    const target = host.current;
    if (target === null) return;
    const table = mountTenka(target, { players, computers, rounds, seed, colours, computerDelayMs, onChange: (game) => latest.current?.(game) });
    return () => table.destroy();
    // Mounted once per key, as documented above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={host} {...element} />;
}
