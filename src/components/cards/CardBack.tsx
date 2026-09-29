import { useId } from "react";

import { BACK_TILE, BRAND_GLYPH_PATHS, BRAND_STONES, CARD_BACK_FIELDS, CARD_BOX, CARD_INK } from "./Cards.constants";
import type { CardBackField } from "./cards.types";

/** One row of the tile: the five stones, dark at both ends, then the gap; `shift` slides it along, so rows interleave like stones on a board. */
function TileRow({ y, shift }: { y: number; shift: number }) {
  const { spacing, radius, border, places, dark } = BACK_TILE;
  const span = places * spacing;
  return (
    <>
      {[0, 1, 2, 3, 4].flatMap((at) => {
        const x = (spacing / 2 + at * spacing + shift) % span;
        const isDark = (dark as readonly number[]).includes(at);
        // A dark stone keeps the brand's ivory border (the kit's dark matrix), faint, so it reads as a stone on the charcoal and not a hole.
        const stone = (cx: number) => (
          <circle
            key={`${at}-${cx}`}
            cx={cx}
            cy={y}
            r={radius}
            fill={isDark ? CARD_INK.black : CARD_INK.face}
            fillOpacity={isDark ? 1 : 0.9}
            stroke={CARD_INK.face}
            strokeOpacity={isDark ? 0.55 : 0}
            strokeWidth={border}
          />
        );
        // A stone that crosses the tile's edge is drawn on both sides, so the rows join without a seam.
        const reach = radius + border;
        return x + reach > span ? [stone(x), stone(x - span)] : x - reach < 0 ? [stone(x), stone(x + span)] : [stone(x)];
      })}
    </>
  );
}

/** The 五つ and its five stones, from the brand avatar, centred at a point and fitted to a width. */
function Medallion({ x, y, width }: { x: number; y: number; width: number }) {
  // The avatar's glyphs and stones fill x 19–221 and y 55–204 of its 240-unit box.
  const scale = width / 206;
  return (
    <g transform={`translate(${x - 120 * scale} ${y - 129.5 * scale}) scale(${scale})`}>
      {BRAND_GLYPH_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} fill={CARD_INK.black} />
      ))}
      {BRAND_STONES.xs.map((cx, at) => (
        <circle
          key={cx}
          cx={cx}
          cy={BRAND_STONES.y}
          r={BRAND_STONES.radius}
          fill={at === 0 || at === 4 ? CARD_INK.black : CARD_INK.face}
          stroke={CARD_INK.black}
          strokeWidth={BRAND_STONES.border}
        />
      ))}
    </g>
  );
}

/**
 * THE BACK OF EVERY CARD: the Itsutsu mark, tiled.
 *
 * John, 2026-09-29: "backs of the cards are probably styliized to have the
 * itsutsu logos in a tiled beautiful pattern." The tile is the logo's own five
 * stones — dark, light, light, light, dark — laid in rows like brickwork, each
 * row half a motif and half a stone along from the last, so the stones pack
 * like a honeycomb, on a field of the brand's charcoal
 * inside an ivory rim. At the centre, on an ivory medallion, the 五つ of the
 * avatar with its stones under it, copied from the brand kit's paths. At a
 * phone's forty-odd pixels the stones read as a fine texture and the
 * medallion as a light square; at a desk every stone is a stone.
 */
export function CardBack({ field = "ink" }: { field?: CardBackField }) {
  const id = useId();
  const tile = `card-back-tile-${id}`;
  const { width, height } = CARD_BOX;
  const { spacing, places } = BACK_TILE;
  const ground = CARD_BACK_FIELDS[field];
  return (
    <>
      <defs>
        <pattern id={tile} width={places * spacing} height={spacing * 2} patternUnits="userSpaceOnUse" patternTransform={`translate(${width / 2 - 1.5 * spacing} 4)`}>
          <rect width={places * spacing} height={spacing * 2} fill={ground} />
          <TileRow y={spacing / 2} shift={0} />
          <TileRow y={spacing * 1.5} shift={(places * spacing) / 2 + spacing / 2} />
        </pattern>
      </defs>
      <rect x={0.6} y={0.6} width={width - 1.2} height={height - 1.2} rx={7} fill={CARD_INK.face} stroke={CARD_INK.edge} strokeWidth={1.2} />
      <rect x={4.5} y={4.5} width={width - 9} height={height - 9} rx={4} fill={`url(#${tile})`} opacity={0.97} />
      <rect x={7.5} y={7.5} width={width - 15} height={height - 15} rx={2.5} fill="none" stroke={CARD_INK.face} strokeOpacity={0.55} strokeWidth={0.7} />
      <rect x={width / 2 - 23} y={height / 2 - 23} width={46} height={46} rx={7} fill={ground} />
      <rect x={width / 2 - 19} y={height / 2 - 19} width={38} height={38} rx={6} fill={CARD_INK.face} />
      <Medallion x={width / 2} y={height / 2} width={30} />
    </>
  );
}
