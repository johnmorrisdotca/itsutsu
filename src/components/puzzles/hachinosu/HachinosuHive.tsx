"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { centredBaseline } from "@/lib/ui/svgText";

import { PuzzleBoard } from "../PuzzleBoard";

/** The rim of the wood round a hive: the same as a middling grid's, since a hive has no squares to count. */
const FRAME_SIDE = 9;
const RADIUS = 46;
const STEP_X = RADIUS * 1.5 + 6;
const STEP_Y = RADIUS * Math.sqrt(3) + 6;
const MIDDLE = 150;
const TEXT = 42;
const INK = "#1c1917";
const PAPER = "#ffffff";
const CELL = "#f3ead7";
const CENTRE = "#e5ad30";

/** Where each of the six goes round the middle, clockwise from the top. */
const ROUND: readonly (readonly [number, number])[] = [
  [0, -STEP_Y],
  [STEP_X, -STEP_Y / 2],
  [STEP_X, STEP_Y / 2],
  [0, STEP_Y],
  [-STEP_X, STEP_Y / 2],
  [-STEP_X, -STEP_Y / 2],
];

const corners = (x: number, y: number) =>
  Array.from({ length: 6 }, (_, at) => {
    const angle = (Math.PI / 3) * at;
    return `${(x + RADIUS * Math.cos(angle)).toFixed(1)},${(y + RADIUS * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");

/**
 * THE HIVE: seven cells on white paper in the wood every board has (`PuzzleBoard`), the centre letter gold.
 * A press on a cell types its letter; what a typed word does is `HachinosuSolve`'s. Drawn from letters alone, so the preview,
 * the solve and a finished page are one drawing and the list of words is not needed to draw any of them.
 */
export function HachinosuHive({ centre, letters, onLetter, disabled = false }: { centre: string; letters: string; onLetter?: (letter: string) => void; disabled?: boolean }) {
  const say = useSpeaker();
  const cell = (letter: string, x: number, y: number, middle: boolean) => (
    <g
      key={letter}
      data-testid="hachinosu-letter"
      data-letter={letter}
      data-centre={middle ? "true" : "false"}
      {...(onLetter === undefined ? {} : { role: "button", tabIndex: disabled ? -1 : 0, "aria-label": say.say(middle ? "pword.hachinosu.pressCentre" : "pword.hachinosu.press", { letter: letter.toUpperCase() }) })}
      onClick={onLetter === undefined || disabled ? undefined : () => onLetter(letter)}
      className={onLetter === undefined ? undefined : "cursor-pointer outline-none"}
    >
      <polygon points={corners(x, y)} fill={middle ? CENTRE : CELL} stroke={INK} strokeWidth={2} />
      <text x={x} y={centredBaseline(y, TEXT)} fontSize={TEXT} fontWeight={700} textAnchor="middle" fill={INK}>
        {letter.toUpperCase()}
      </text>
    </g>
  );
  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="hachinosu">
      <PuzzleBoard size={FRAME_SIDE} coordinates={false}>
        <div className="flex h-full w-full items-center justify-center" style={{ background: PAPER, touchAction: "manipulation" }}>
          <svg viewBox="0 0 300 300" className="block h-full w-full" data-testid="hachinosu-hive">
            {cell(centre, MIDDLE, MIDDLE, true)}
            {[...letters].map((letter, at) => cell(letter, MIDDLE + ROUND[at]![0], MIDDLE + ROUND[at]![1], false))}
          </svg>
        </div>
      </PuzzleBoard>
    </div>
  );
}
