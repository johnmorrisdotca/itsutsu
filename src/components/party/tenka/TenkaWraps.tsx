import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";
import { tenkaShapesFor } from "@/lib/party/tenka/tenkaShapes.data";

import { TENKA_WRAP_TAG } from "./tenka.constants";
import { chipRadius, chipWidth } from "./tenkaView";
import type { TenkaWrapsProps } from "./tenka.types";
import { tenkaWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { territoryName } from "./tenkaWords";

/** A territory's name as a tag says it, without "The". */


/**
 * WHERE THE WORLD WRAPS ROUND. The Bering Strait is the map's seam, so Alaska
 * and Kamchatka sit at opposite edges although they are
 * neighbours. At each edge the crossing ends in an arrow off the map and a tag
 * naming what is on the other side ("Alaska →" at the east edge, "← Kamchatka"
 * at the west), drawn the same size on the screen however far the
 * map is zoomed. The tag is lit when what it names is in reach, and a tap on
 * it is a tap on that territory, so an attack across the strait never needs
 * the map panned from one edge to the other.
 */
export function TenkaWraps({ game, scale, reach, dark, layer, onTerritory }: TenkaWrapsProps) {
  const say = useSpeaker();
  const TENKA_COPY = tenkaWords(say.locale);
  // Only the world wraps round (the Bering Strait); Europe has no edge to go off.
  const shapes = tenkaShapesFor(game);
  const { territories } = tenkaMapOf(game);
  const tagName = (territory: number) => (say.locale === "ja" ? territoryName(territories[territory], say) : territories[territory].name.replace(/^The /, ""));
  const unit = 1 / scale;
  const font = TENKA_WRAP_TAG.font * unit;
  // Where a territory's counter is, as the rectangle it covers at this scale: what a tag is kept clear of.
  const half = (chipRadius(scale) * chipWidth(2)) / 2;
  const covered = (left: number, top: number, width: number, height: number) =>
    shapes.labels.filter(([x, y]) => x + half > left && x - half < left + width && y + chipRadius(scale) > top && y - chipRadius(scale) < top + height).length;
  return (
    <>
      {shapes.wraps.flatMap(([west, east, row]) =>
        [
          { territory: east, x: 0, onEast: false },
          { territory: west, x: shapes.width, onEast: true },
        ]
          // The lit tags are drawn over the counters and the rest under them (`layer`).
          .filter(({ territory }) => reach.has(territory) === (layer === "over"))
          .map(({ territory, x, onEast }) => {
          const lit = reach.has(territory);
          const text = TENKA_COPY.wrapTo(tagName(territory), onEast);
          const width = text.length * font * (say.locale === "ja" ? 1 : 0.58) + 2 * TENKA_WRAP_TAG.inset * unit;
          const left = onEast ? x - TENKA_WRAP_TAG.inset * unit - width : x + TENKA_WRAP_TAG.inset * unit;
          const height = font * 1.6;
          // Beside the arrow, on whichever side leaves more of the counters clear (Alaska's, at the west edge; Kamchatka's, at the east): above when it is no worse.
          const above = row - (TENKA_WRAP_TAG.arrow + TENKA_WRAP_TAG.gap) * unit - height;
          const below = row + (TENKA_WRAP_TAG.below - TENKA_WRAP_TAG.font) * unit;
          const top = covered(left, below, width, height) < covered(left, above, width, height) ? below : above;
          const back = onEast ? x - TENKA_WRAP_TAG.arrow * unit : x + TENKA_WRAP_TAG.arrow * unit;
          return (
            <g
              key={`${territory}-${onEast ? "east" : "west"}`}
              className={onTerritory === undefined ? undefined : "cursor-pointer"}
              onClick={onTerritory === undefined ? undefined : () => onTerritory(territory)}
              data-testid="tenka-wrap"
              data-territory={territories[territory].key}
              data-edge={onEast ? "east" : "west"}
              data-lit={lit ? "true" : "false"}
              role={onTerritory === undefined ? undefined : "button"}
              aria-label={TENKA_COPY.wrapNote(territoryName(territories[territory], say))}
            >
              <polygon points={`${x},${row} ${back},${row - 4 * unit} ${back},${row + 4 * unit}`} fill={dark ? "#e8eef0" : "#1d3440"} />
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
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
