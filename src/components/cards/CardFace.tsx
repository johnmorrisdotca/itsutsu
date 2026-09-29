import { RANK_DISPLAY } from "@/lib/cards/cards.constants";
import type { Card, Suit } from "@/lib/cards/cards.types";
import { isRed } from "@/lib/cards/deck";

import { BRAND_STONES, CARD_BOX, CARD_INK, COURT_KANJI, FACE_LAYOUT, SUIT_PATHS } from "./Cards.constants";

/** A suit drawn at a centre and a size, in the card's 100 × 140 box. */
export function SuitPip({ suit, x, y, size, fill }: { suit: Suit; x: number; y: number; size: number; fill: string }) {
  const scale = size / 100;
  return <path d={SUIT_PATHS[suit]} fill={fill} transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`} />;
}

/** The rank in the corner: a ten is squeezed to the width of one figure, so every corner is one width. */
function Rank({ card, fill }: { card: Card; fill: string }) {
  const { x, y, size } = FACE_LAYOUT.rank;
  const text = RANK_DISPLAY[card.rank].short;
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={700}
      textAnchor="middle"
      fill={fill}
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
      {...(text.length > 1 ? { textLength: size * 0.95, lengthAdjust: "spacingAndGlyphs" } : {})}
    >
      {text}
    </text>
  );
}

/** The rank with its suit under it: drawn once at the top left and again, turned over, at the bottom right. */
function Corner({ card, fill }: { card: Card; fill: string }) {
  const pip = FACE_LAYOUT.cornerPip;
  return (
    <g>
      <Rank card={card} fill={fill} />
      <SuitPip suit={card.suit} x={pip.x} y={pip.y} size={pip.size} fill={fill} />
    </g>
  );
}

/** A court card: its kanji on a pale panel, the suit above it. */
function Court({ card, fill }: { card: Card & { rank: 11 | 12 | 13 }; fill: string }) {
  const { x, y, width, height } = FACE_LAYOUT.court;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={CARD_INK.court} stroke={fill} strokeWidth={1.2} />
      <SuitPip suit={card.suit} x={50} y={y + 12} size={13} fill={fill} />
      <text x={50} y={y + height - 13} fontSize={34} textAnchor="middle" fill={fill} className="font-mincho">
        {COURT_KANJI[card.rank]}
      </text>
    </g>
  );
}

/** The logo's five stones, small, under the ace of spades: the one card a deck signs. */
function AceStones() {
  const scale = 40 / 208;
  return (
    <g transform={`translate(${50 - 120 * scale} ${122 - BRAND_STONES.y * scale}) scale(${scale})`}>
      {BRAND_STONES.xs.map((x, at) => (
        <circle
          key={x}
          cx={x}
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
 * THE FACE OF A CARD, drawn by us: no font's suit symbols and nobody's art.
 *
 * Read at a glance on a phone: a big rank and its suit in the top left (a
 * hand fanned to the right shows them), a bigger suit in the top right (a
 * column overlapped downward shows it with the rank on the top strip alone),
 * and the same corner turned over at the bottom right.
 *
 * COLOUR IS NEVER THE ONLY SIGN. Red and black are what a Klondike run
 * alternates on, so a red card also wears a fine red line inside its edge,
 * which a black card never does: a reader who cannot tell the two inks apart
 * sees a frame or no frame, on the top strip as on the whole card. And every
 * suit is its own outline — a club's three lobes, a spade's point and stem —
 * so the suit itself never rests on colour either.
 */
export function CardFace({ card }: { card: Card }) {
  const red = isRed(card);
  const fill = red ? CARD_INK.red : CARD_INK.black;
  const { width, height } = CARD_BOX;
  const top = FACE_LAYOUT.topPip;
  return (
    <>
      <rect x={0.6} y={0.6} width={width - 1.2} height={height - 1.2} rx={7} fill={CARD_INK.face} stroke={CARD_INK.edge} strokeWidth={1.2} />
      {red ? <rect x={3} y={3} width={width - 6} height={height - 6} rx={5} fill="none" stroke={CARD_INK.red} strokeWidth={0.9} data-card-red-line="" /> : null}
      <Corner card={card} fill={fill} />
      <SuitPip suit={card.suit} x={top.x} y={top.y} size={top.size} fill={fill} />
      {card.rank >= 11 ? (
        <Court card={card as Card & { rank: 11 | 12 | 13 }} fill={fill} />
      ) : card.rank === 1 ? (
        <>
          <SuitPip suit={card.suit} x={FACE_LAYOUT.acePip.x} y={FACE_LAYOUT.acePip.y} size={FACE_LAYOUT.acePip.size} fill={fill} />
          {card.suit === "spades" ? <AceStones /> : null}
        </>
      ) : (
        <SuitPip suit={card.suit} x={FACE_LAYOUT.bigPip.x} y={FACE_LAYOUT.bigPip.y} size={FACE_LAYOUT.bigPip.size} fill={fill} />
      )}
      <g transform={`rotate(180 ${width / 2} ${height / 2})`}>
        <Corner card={card} fill={fill} />
      </g>
    </>
  );
}
