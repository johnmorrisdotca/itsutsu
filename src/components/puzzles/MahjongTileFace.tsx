import type { ReactNode } from "react";

import { MAHJONG_FACES } from "@johnmorrisdotca/jarajara";
import type { MahjongFace } from "@johnmorrisdotca/jarajara";

import { MAHJONG_INK, MAHJONG_TILE } from "./mahjong.constants";

/**
 * THE FACES OF THE TILES, drawn for this site: a Japanese-style set, in the
 * plainest strokes that still read at a phone's thirty pixels. Characters are
 * the numeral over a red 萬; circles and bamboo are counted out in dots and
 * sticks; the winds and dragons are their characters, 中 red and 發 green, and
 * the white dragon a blue frame. The flowers and seasons carry a band of their
 * group's colour across the top, pink for the flowers and amber for the
 * seasons, since any of a group matches any other. Every suit tile and wind
 * also has its number or letter small in the top corner, for a reader who does
 * not count dots at a glance or read 東 as east.
 *
 * Drawn once as `<symbol>`s (`MahjongFaceSymbols`) and placed with `<use>`,
 * so a layout of 144 draws 42 pictures. The tiles are light objects on the
 * table by night as by day: every colour here is fixed, never the theme's.
 */
const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
const WIND_KANJI = ["東", "南", "西", "北"];
const WIND_LETTERS = ["E", "S", "W", "N"];
const FLOWER_KANJI = ["梅", "蘭", "菊", "竹"];
const SEASON_KANJI = ["春", "夏", "秋", "冬"];

const FONT = "var(--font-mincho), 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif CJK JP', serif";

/* Circles: where each dot sits, and its radius, for one to nine. */
const DOTS: Record<number, { r: number; at: [number, number][] }> = {
  1: { r: 10, at: [[15, 20]] },
  2: { r: 6.5, at: [[15, 11], [15, 29]] },
  3: { r: 5.5, at: [[8, 9], [15, 20], [22, 31]] },
  4: { r: 5.5, at: [[9, 12], [21, 12], [9, 28], [21, 28]] },
  5: { r: 5, at: [[8, 10], [22, 10], [15, 20], [8, 30], [22, 30]] },
  6: { r: 4.6, at: [[9, 9], [21, 9], [9, 20], [21, 20], [9, 31], [21, 31]] },
  7: { r: 3.8, at: [[7, 7], [15, 11], [23, 15], [9, 24], [21, 24], [9, 33], [21, 33]] },
  8: { r: 3.8, at: [[9, 6.5], [21, 6.5], [9, 15.5], [21, 15.5], [9, 24.5], [21, 24.5], [9, 33.5], [21, 33.5]] },
  9: { r: 3.8, at: [[7, 9], [15, 9], [23, 9], [7, 20], [15, 20], [23, 20], [7, 31], [15, 31], [23, 31]] },
};

/* The colour of each dot, in the order above: blue, green and a red at the heart where a real set puts one. */
function dotColour(rank: number, index: number): string {
  if (rank === 1) return MAHJONG_INK.red;
  if (rank === 3 || rank === 5) return index === (rank === 3 ? 1 : 2) ? MAHJONG_INK.red : rank === 3 ? MAHJONG_INK.blue : MAHJONG_INK.green;
  if (rank === 7) return index < 3 ? MAHJONG_INK.green : MAHJONG_INK.red;
  if (rank === 9) return index >= 3 && index < 6 ? MAHJONG_INK.red : MAHJONG_INK.blue;
  if (rank === 6) return index < 2 ? MAHJONG_INK.green : MAHJONG_INK.red;
  return index % 2 === 0 ? MAHJONG_INK.blue : MAHJONG_INK.green;
}

/* Bamboo: each stick's top-left and length, and whether it is the red one, for two to nine. */
const STICKS: Record<number, [number, number, number, boolean?][]> = {
  2: [[15, 4, 14], [15, 22, 14]],
  3: [[15, 4, 14], [10, 22, 14], [20, 22, 14]],
  4: [[10, 4, 14], [20, 4, 14], [10, 22, 14], [20, 22, 14]],
  5: [[8, 4, 14], [22, 4, 14], [15, 13, 14, true], [8, 22, 14], [22, 22, 14]],
  6: [[7, 4, 14], [15, 4, 14], [23, 4, 14], [7, 22, 14], [15, 22, 14], [23, 22, 14]],
  7: [[15, 3, 10, true], [7, 15, 10], [15, 15, 10], [23, 15, 10], [7, 27, 10], [15, 27, 10], [23, 27, 10]],
  8: [[6, 4, 14], [12, 4, 14], [18, 4, 14], [24, 4, 14], [6, 22, 14], [12, 22, 14], [18, 22, 14], [24, 22, 14]],
  9: [[7, 3, 10], [15, 3, 10, true], [23, 3, 10], [7, 15, 10], [15, 15, 10, true], [23, 15, 10], [7, 27, 10], [15, 27, 10, true], [23, 27, 10]],
};

function Stick({ x, y, length, red }: { x: number; y: number; length: number; red?: boolean }) {
  const colour = red === true ? MAHJONG_INK.red : MAHJONG_INK.green;
  return (
    <g>
      <rect x={x - 1.7} y={y} width={3.4} height={length} rx={1.4} fill={colour} />
      <line x1={x - 1.7} x2={x + 1.7} y1={y + length / 2} y2={y + length / 2} stroke="#fff" strokeWidth={0.8} />
    </g>
  );
}

/** A small number or letter in the top-left corner. */
function Index({ text }: { text: string }) {
  return (
    <text x={3.2} y={8} fontSize={6.5} fontWeight={700} fill={MAHJONG_INK.soft} fontFamily="ui-sans-serif, system-ui, sans-serif">
      {text}
    </text>
  );
}

function Glyph({ text, y, size, colour }: { text: string; y: number; size: number; colour: string }) {
  return (
    <text x={15} y={y} fontSize={size} fontWeight={700} fill={colour} textAnchor="middle" fontFamily={FONT}>
      {text}
    </text>
  );
}

/** One face's drawing, in the tile's own 30 by 40. */
function faceDrawing(face: MahjongFace): ReactNode {
  switch (face.suit) {
    case "characters":
      return (
        <>
          <Index text={String(face.rank)} />
          <Glyph text={NUMERALS[face.rank - 1]!} y={19} size={15} colour={MAHJONG_INK.ink} />
          <Glyph text="萬" y={35} size={13} colour={MAHJONG_INK.red} />
        </>
      );
    case "circles": {
      const dots = DOTS[face.rank]!;
      return (
        <>
          {face.rank > 1 ? <Index text={String(face.rank)} /> : null}
          {dots.at.map(([x, y], index) => (
            <g key={index}>
              <circle cx={x} cy={y} r={dots.r} fill={dotColour(face.rank, index)} />
              <circle cx={x} cy={y} r={dots.r * 0.55} fill="none" stroke="#fff" strokeWidth={dots.r * 0.18} />
              <circle cx={x} cy={y} r={dots.r * 0.18} fill="#fff" />
            </g>
          ))}
        </>
      );
    }
    case "bamboo":
      if (face.rank === 1) {
        // The one of bamboo is a bird on a real set: here a sparrow, green with a red crest, so it is never read as a stick.
        return (
          <g>
            <Index text="1" />
            <ellipse cx={15} cy={23} rx={8} ry={7} fill={MAHJONG_INK.green} />
            <circle cx={20} cy={14} r={4.5} fill={MAHJONG_INK.green} />
            <path d="M 18 9.5 L 20 6 L 22 9.5 Z" fill={MAHJONG_INK.red} />
            <path d="M 24 13.5 L 28 14.5 L 24 15.5 Z" fill={MAHJONG_INK.ochre} />
            <path d="M 8 24 L 3 34 L 12 29 Z" fill={MAHJONG_INK.blue} />
            <circle cx={21} cy={13} r={1} fill="#fff" />
            <line x1={13} x2={12} y1={30} y2={36} stroke={MAHJONG_INK.red} strokeWidth={1.2} />
            <line x1={17} x2={18} y1={30} y2={36} stroke={MAHJONG_INK.red} strokeWidth={1.2} />
          </g>
        );
      }
      return (
        <>
          <Index text={String(face.rank)} />
          {STICKS[face.rank]!.map(([x, y, length, red], index) => (
            <Stick key={index} x={x} y={y} length={length} red={red} />
          ))}
        </>
      );
    case "winds":
      return (
        <>
          <Index text={WIND_LETTERS[face.rank - 1]!} />
          <Glyph text={WIND_KANJI[face.rank - 1]!} y={29} size={21} colour={MAHJONG_INK.ink} />
        </>
      );
    case "dragons":
      if (face.rank === 3) {
        return (
          <g fill="none" stroke={MAHJONG_INK.blue}>
            <rect x={5} y={6} width={20} height={28} rx={1.5} strokeWidth={2.2} />
            <rect x={9} y={10} width={12} height={20} rx={1} strokeWidth={1.2} />
          </g>
        );
      }
      return <Glyph text={face.rank === 1 ? "中" : "發"} y={29} size={22} colour={face.rank === 1 ? MAHJONG_INK.red : MAHJONG_INK.green} />;
    case "flowers":
    case "seasons": {
      const flower = face.suit === "flowers";
      const band = flower ? MAHJONG_INK.flower : MAHJONG_INK.season;
      return (
        <>
          <rect x={2} y={2} width={26} height={7} rx={1.5} fill={band} />
          <text x={15} y={7.6} fontSize={5.5} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {flower ? "FLOWER" : "SEASON"}
          </text>
          <Glyph text={(flower ? FLOWER_KANJI : SEASON_KANJI)[face.rank - 1]!} y={30} size={18} colour={band} />
          <text x={25} y={37} fontSize={6} fontWeight={700} fill={MAHJONG_INK.soft} textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {face.rank}
          </text>
        </>
      );
    }
  }
}

/** The id a face's symbol goes by on a page, under a prefix of the board that drew it. */
export function faceSymbolId(prefix: string, code: string): string {
  return `${prefix}-${code}`;
}

/** Every face as a `<symbol>`, for the `<use>`s of one board's tiles. */
export function MahjongFaceSymbols({ prefix }: { prefix: string }) {
  return (
    <defs>
      {MAHJONG_FACES.map((face) => (
        <symbol key={face.code} id={faceSymbolId(prefix, face.code)} viewBox={`0 0 ${MAHJONG_TILE.faceWidth} ${MAHJONG_TILE.faceHeight}`}>
          {faceDrawing(face)}
        </symbol>
      ))}
    </defs>
  );
}

/**
 * ONE TILE ON ITS OWN, for a line of text or a list of pairs taken: the face on
 * its ivory, drawn inline, at the height the caller's box gives it.
 */
export function MahjongTileFace({ code, className = "h-8" }: { code: string; className?: string }) {
  const face = MAHJONG_FACES.find((each) => each.code === code);
  if (face === undefined) return null;
  return (
    <svg viewBox="-1 -1 32 42" className={`${className} w-auto shrink-0`} role="img" aria-label={faceWords(face)} data-testid="mahjong-face" data-face={code}>
      <rect x={-0.5} y={-0.5} width={31} height={41} rx={3} fill={MAHJONG_TILE.side} />
      <rect x={0} y={0} width={30} height={40} rx={3} fill={MAHJONG_TILE.face} stroke={MAHJONG_TILE.rim} strokeWidth={0.8} />
      {faceDrawing(face)}
    </svg>
  );
}

/** What a face is called, for a screen reader: "3 of characters", "east wind", "red dragon", "plum (flower)". */
export function faceWords(face: MahjongFace): string {
  switch (face.suit) {
    case "characters":
    case "circles":
    case "bamboo":
      return `${face.rank} of ${face.suit}`;
    case "winds":
      return `${["east", "south", "west", "north"][face.rank - 1]} wind`;
    case "dragons":
      return `${["red", "green", "white"][face.rank - 1]} dragon`;
    case "flowers":
      return `${["plum", "orchid", "chrysanthemum", "bamboo"][face.rank - 1]} (flower)`;
    case "seasons":
      return `${["spring", "summer", "autumn", "winter"][face.rank - 1]} (season)`;
  }
}
