import { CardBack } from "@/components/cards/CardBack";
import { CardFace } from "@/components/cards/CardFace";
import { HitotsuCardDrawing } from "@johnmorrisdotca/hitotsu/react";

import type { PictureSize } from "./games.types";
import { pictureBox } from "./picture";
import { centredBaseline } from "@/lib/ui/svgText";

import type { Mark } from "./familyMark.types";
import { FAMILY_MARKS } from "./familyMarks.constants";

export { FAMILY_MARKS };

/** A letter tile's colours, as the word puzzle paints them: in its place, and in the word elsewhere. */
const TILE_FILL: Record<"hit" | "near", string> = { hit: "var(--moss)", near: "var(--ochre)" };

/** Where a domino end's pips sit in its square, for nought to six, in that square's 0..1. */
const MARK_PIPS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
};

/** A card's width in a mark, in cells: two cells and a little, so a fan of three fills the little board. */
const MARK_CARD_WIDTH = 2.3;

const PLAIN: Mark = { n: 5, stones: [{ r: 2, c: 2 }] };

/**
 * The family's mark as an inline SVG, at one of the site's three picture sizes.
 *
 * It was sized by whatever class a page handed it, so four pages drew four
 * sizes — 20px in a chip on /games/new, 40 on a game's page, 48 on /games, 64
 * on the family's own. That became one family size, 56px, and then John asked
 * for every picture to be one regular size, the board tile's. So the caller
 * says "small", "regular" or "large" and nothing else (`PICTURE_PX`), and
 * `gamePictures.coverage.test.ts` refuses a size class at any call site.
 * `className` is left for placement only.
 */
export function FamilyMark({ family, size, className = "" }: { family: string; size: PictureSize; className?: string }) {
  const mark = FAMILY_MARKS[family] ?? PLAIN;
  const { n } = mark;
  const cells = mark.cells === true;
  const at = (i: number) => (cells ? i + 0.5 : i);
  const extent = cells ? n : n - 1;
  const pad = 0.6;
  const lines = Array.from({ length: cells ? n + 1 : n }, (_, i) => i);

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${extent + pad * 2} ${extent + pad * 2}`}
      className={`shrink-0 ${className}`.trim()}
      style={pictureBox(size)}
      aria-hidden="true"
      data-testid="family-mark"
      data-family={family}
      data-picture={size}
    >
      <rect
        x={-pad}
        y={-pad}
        width={extent + pad * 2}
        height={extent + pad * 2}
        rx={0.5}
        fill={cells ? "var(--moss-soft)" : "var(--ivory)"}
        stroke="var(--rule-strong)"
        strokeWidth={0.08}
      />
      {lines.map((i) => (
        <g key={i} stroke="var(--rule-strong)" strokeWidth={0.06}>
          <line x1={0} x2={extent} y1={i} y2={i} />
          <line y1={0} y2={extent} x1={i} x2={i} />
        </g>
      ))}
      {(mark.cards ?? []).map(({ card, x, y, angle }, at) => (
        <g key={at} transform={`rotate(${angle} ${x} ${y + MARK_CARD_WIDTH})`}>
          <svg x={x - MARK_CARD_WIDTH / 2} y={y - MARK_CARD_WIDTH * 0.7} width={MARK_CARD_WIDTH} height={MARK_CARD_WIDTH * 1.4} viewBox="0 0 100 140">
            {card === null ? <CardBack /> : <CardFace card={card} />}
          </svg>
        </g>
      ))}
      {(mark.colourCards ?? []).map(({ card, x, y, angle }, at) => (
        <g key={`colour-${at}`} transform={`rotate(${angle} ${x} ${y + MARK_CARD_WIDTH})`}>
          <svg x={x - MARK_CARD_WIDTH / 2} y={y - MARK_CARD_WIDTH * 0.7} width={MARK_CARD_WIDTH} height={MARK_CARD_WIDTH * 1.4} viewBox="0 0 100 140">
            <HitotsuCardDrawing card={card} />
          </svg>
        </g>
      ))}
      {mark.ink !== undefined ? <path d={mark.ink} fill="none" stroke="var(--ink)" strokeWidth={0.1} strokeLinecap="round" /> : null}
      {mark.stones.map((stone) => (
        <circle
          key={`${stone.r}-${stone.c}`}
          cx={at(stone.c)}
          cy={at(stone.r)}
          r={0.42}
          fill={stone.white ? "var(--ivory)" : "var(--ink)"}
          stroke="var(--ink)"
          strokeWidth={0.08}
          strokeDasharray={stone.faded ? "0.2 0.15" : undefined}
          opacity={stone.faded ? 0.5 : 1}
        />
      ))}
      {(mark.tiles ?? []).map((tile) => (
        <g key={`${tile.x}-${tile.y}`}>
          <rect x={tile.x - 0.1} y={tile.y + 0.1} width={1.3} height={1.7} rx={0.14} fill="#d9c59b" stroke="#a8926a" strokeWidth={0.05} />
          <rect x={tile.x} y={tile.y} width={1.3} height={1.7} rx={0.14} fill="#fffdf6" stroke="#b9ad96" strokeWidth={0.05} />
          <text x={tile.x + 0.65} y={centredBaseline(tile.y + 0.85, 0.95)} textAnchor="middle" fontSize={0.95} fontWeight={700} fill={tile.red === true ? "#b2302f" : "#22231f"}>
            {tile.glyph}
          </text>
        </g>
      ))}
      {(mark.dominoes ?? []).map((domino) => (
        <g key={`${domino.x}-${domino.y}`}>
          <rect x={domino.x} y={domino.y} width={2.3} height={1.15} rx={0.14} fill="#fffdf6" stroke="var(--ink)" strokeWidth={0.06} />
          <line x1={domino.x + 1.15} x2={domino.x + 1.15} y1={domino.y + 0.12} y2={domino.y + 1.03} stroke="var(--ink)" strokeWidth={0.05} />
          {domino.ends.flatMap((end, half) =>
            (MARK_PIPS[end] ?? []).map(([px, py], at) => (
              <circle key={`${half}-${at}`} cx={domino.x + half * 1.15 + 0.1 + px * 0.95} cy={domino.y + 0.1 + py * 0.95} r={0.09} fill="#22231f" />
            )),
          )}
        </g>
      ))}
      {mark.path !== undefined ? (
        <path d={mark.path} fill="none" stroke="var(--shu)" strokeWidth={0.14} strokeLinecap="round" />
      ) : null}
      {(mark.digits ?? []).map((digit) =>
        digit.tile === undefined ? null : (
          <rect key={`t${digit.r}-${digit.c}`} x={digit.c + 0.06} y={digit.r + 0.06} width={0.88} height={0.88} fill={TILE_FILL[digit.tile]} />
        ),
      )}
      {(mark.digits ?? []).map((digit) => (
        <text
          key={`d${digit.r}-${digit.c}`}
          x={at(digit.c)}
          y={centredBaseline(at(digit.r), mark.digitSize ?? 0.75)}
          textAnchor="middle"
          fontSize={mark.digitSize ?? 0.75}
          fontWeight={600}
          fill={digit.tile === undefined ? "var(--ink)" : "var(--ivory)"}
          opacity={digit.faded ? 0.35 : 1}
        >
          {digit.faded ? "?" : (digit.letter ?? digit.value)}
        </text>
      ))}
    </svg>
  );
}
