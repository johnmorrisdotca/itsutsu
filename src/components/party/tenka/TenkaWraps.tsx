import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { TENKA_SHAPES } from "@/lib/party/tenka/tenkaShapes.data";

import { TENKA_COPY, TENKA_WRAP_TAG } from "./tenka.constants";
import type { TenkaWrapsProps } from "./tenka.types";

/** A territory's name as a tag says it, without "The". */
const tagName = (territory: number) => TENKA_TERRITORIES[territory].name.replace(/^The /, "");

/**
 * WHERE THE WORLD WRAPS ROUND. The Bering Strait is the map's seam, so Alaska
 * and the Russian Far East sit at opposite edges although they are
 * neighbours. At each edge the crossing ends in an arrow off the map and a tag
 * naming what is on the other side ("Alaska →" at the east edge, "← Russian
 * Far East" at the west), drawn the same size on the screen however far the
 * map is zoomed. The tag is lit when what it names is in reach, and a tap on
 * it is a tap on that territory, so an attack across the strait never needs
 * the map panned from one edge to the other.
 */
export function TenkaWraps({ scale, reach, dark, onTerritory }: TenkaWrapsProps) {
  const unit = 1 / scale;
  const font = TENKA_WRAP_TAG.font * unit;
  return (
    <>
      {TENKA_SHAPES.wraps.flatMap(([west, east, row]) =>
        [
          { territory: east, x: 0, onEast: false },
          { territory: west, x: TENKA_SHAPES.width, onEast: true },
        ].map(({ territory, x, onEast }) => {
          const lit = reach.has(territory);
          const text = TENKA_COPY.wrapTo(tagName(territory), onEast);
          const width = text.length * font * 0.58 + 2 * TENKA_WRAP_TAG.inset * unit;
          const left = onEast ? x - TENKA_WRAP_TAG.inset * unit - width : x + TENKA_WRAP_TAG.inset * unit;
          const top = row + (TENKA_WRAP_TAG.below - font / unit) * unit;
          const back = onEast ? x - TENKA_WRAP_TAG.arrow * unit : x + TENKA_WRAP_TAG.arrow * unit;
          return (
            <g
              key={`${territory}-${onEast ? "east" : "west"}`}
              className={onTerritory === undefined ? undefined : "cursor-pointer"}
              onClick={onTerritory === undefined ? undefined : () => onTerritory(territory)}
              data-testid="tenka-wrap"
              data-territory={TENKA_TERRITORIES[territory].key}
              data-edge={onEast ? "east" : "west"}
              data-lit={lit ? "true" : "false"}
              role={onTerritory === undefined ? undefined : "button"}
              aria-label={TENKA_COPY.wrapNote(TENKA_TERRITORIES[territory].name)}
            >
              <polygon points={`${x},${row} ${back},${row - 4 * unit} ${back},${row + 4 * unit}`} fill={dark ? "#e8eef0" : "#1d3440"} />
              <rect
                x={left}
                y={top}
                width={width}
                height={font * 1.6}
                rx={font * 0.5}
                fill={lit ? "#ffffff" : dark ? "rgba(20,30,36,0.85)" : "rgba(255,255,255,0.75)"}
                stroke={lit ? "#111111" : dark ? "#e8eef0" : "#1d3440"}
                strokeWidth={(lit ? 2 : 1) * unit}
                strokeDasharray={lit ? `${6 * unit} ${4 * unit}` : undefined}
              />
              <text x={left + width / 2} y={top + font * 1.15} fontSize={font} textAnchor="middle" fill={lit ? "#111111" : dark ? "#e8eef0" : "#1d3440"} fontWeight={600}>
                {text}
              </text>
            </g>
          );
        }),
      )}
    </>
  );
}
