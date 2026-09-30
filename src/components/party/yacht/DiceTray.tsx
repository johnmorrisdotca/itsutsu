"use client";

import { useEffect, useRef, useState } from "react";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import type { Appearance } from "@/components/board/board.types";

import { DICE_FLICKER_MS, DICE_TUMBLE_MS, YACHT_COPY } from "./yacht.constants";

/** Where each pip of a face sits on a three-by-three grid, 0 to 8 from the top left. */
const PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** A die's slight turn where it lands, the same for the same face in the same place, so a reload lands it as it lay. */
function landing(value: number, at: number): number {
  return ((value * 37 + at * 53) % 17) - 8;
}

/** Whether this reader asked for less movement: then a die lands without tumbling. */
function still(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * ONE DIE: its face in pips, turned a little where it landed. After a roll
 * that threw it, it tumbles — spins, hops and shows face after face — for
 * about two thirds of a second, then lands on the face the rules threw. Only
 * the picture tumbles: the face it lands on was decided before it started,
 * and is the one its `data-value` says throughout. A held die is ringed in
 * vermilion and marked, and does not move.
 */
function Die({ value, at, held, rollKey, tumbles, onPress }: { value: number; at: number; held: boolean; rollKey: number; tumbles: boolean; onPress?: () => void }) {
  const box = useRef<HTMLSpanElement>(null);
  const seen = useRef(rollKey);
  const [flicker, setFlicker] = useState<number | null>(null);
  useEffect(() => {
    if (seen.current === rollKey) return;
    seen.current = rollKey;
    if (!tumbles || still()) return;
    const spin = (at % 2 === 0 ? 1 : -1) * (300 + at * 40);
    box.current?.animate(
      [
        { transform: `translate(0, -40%) rotate(${spin}deg) scale(0.85)` },
        {
          transform: `translate(0, 8%) rotate(${spin / 3}deg) scale(1.05)`,
          offset: 0.6,
        },
        {
          transform: `translate(0, 0) rotate(${landing(value, at)}deg) scale(1)`,
        },
      ],
      { duration: DICE_TUMBLE_MS, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
    );
    const flickering = window.setInterval(() => setFlicker(1 + Math.floor(Math.random() * 6)), DICE_FLICKER_MS);
    const done = window.setTimeout(() => {
      window.clearInterval(flickering);
      setFlicker(null);
    }, DICE_TUMBLE_MS - DICE_FLICKER_MS);
    return () => {
      window.clearInterval(flickering);
      window.clearTimeout(done);
      setFlicker(null);
    };
  }, [rollKey, tumbles, value, at]);

  const face = flicker ?? value;
  const picture = (
    <span
      ref={box}
      className="block aspect-square w-full"
      style={{
        transform: `rotate(${value === 0 ? 0 : landing(value, at)}deg)`,
      }}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)]" aria-hidden="true">
        <rect x={4} y={4} width={92} height={92} rx={18} fill={value === 0 ? "rgba(255,253,246,0.55)" : "#fffdf6"} stroke={held ? "var(--shu)" : "rgba(0,0,0,0.55)"} strokeWidth={held ? 7 : 2.5} />
        {value === 0
          ? null
          : (PIPS[face] ?? []).map((pip) => <circle key={pip} cx={26 + (pip % 3) * 24} cy={26 + Math.floor(pip / 3) * 24} r={face === 1 ? 11 : 9} fill={face === 1 ? "#b2302f" : "#22231f"} />)}
      </svg>
    </span>
  );
  const label = value === 0 ? "Not thrown yet" : `${value}${held ? `, ${YACHT_COPY.held.toLowerCase()}` : ""}`;
  const common = {
    className: "relative z-10 flex w-[17%] max-w-24 flex-col items-center gap-1",
    "data-testid": "dice-die",
    "data-at": at,
    "data-value": value,
    "data-held": held ? "true" : "false",
    "data-rolling": flicker === null ? undefined : "true",
  };
  const mark = <span className={`text-[0.65rem] font-semibold tracking-[0.12em] uppercase ${held ? "text-shu" : "invisible"}`}>{YACHT_COPY.held}</span>;
  return onPress === undefined ? (
    <span {...common} role="img" aria-label={label}>
      {picture}
      {mark}
    </span>
  ) : (
    <button type="button" {...common} onClick={onPress} aria-pressed={held} aria-label={`Die ${at + 1}: ${label}. Tap to ${held ? "let it go" : "hold it"}.`}>
      {picture}
      {mark}
    </button>
  );
}

/**
 * THE TRAY THE DICE ARE THROWN INTO: the reader's own wood, in the frame every
 * board on the site has (`BoardFrame`), wider than it is tall, and the dice in
 * a row across it. A die is pressed to hold it or let it go (`onDie`); the
 * tray itself, anywhere but a die, throws (`onTray`) — the "tap to roll" a
 * phone wants. Both are left out where nothing may be pressed: a preview, a
 * computer's turn, a finished game.
 */
export function DiceTray({
  dice,
  held,
  rolled,
  rollKey,
  appearance,
  onDie,
  onTray,
  label,
}: {
  dice: readonly number[];
  held: readonly boolean[];
  /** Which dice the last roll threw: they tumble, the rest lie still. */
  rolled: readonly boolean[];
  /** A new number for every roll, so the dice know to tumble. */
  rollKey: number;
  appearance: Appearance;
  onDie?: (at: number) => void;
  onTray?: () => void;
  label: string;
}) {
  const theme = BOARD_THEMES[appearance.boardTheme];
  return (
    <BoardFrame size={8} theme={theme} flipped={false} inset={0.03} lattice={false} shape="rhombus" coordinates={false} aspect="map">
      <div className="absolute inset-0 flex items-center justify-center gap-[3%] px-[3%] select-none" data-testid="dice-tray" data-roll={rollKey} aria-label={label} role="group">
        {onTray === undefined ? null : (
          <button type="button" className="absolute inset-0 z-0 cursor-pointer touch-manipulation" onClick={onTray} aria-label={YACHT_COPY.roll} data-testid="dice-tray-roll" />
        )}
        {dice.map((value, at) => (
          <Die key={at} value={value} at={at} held={held[at] ?? false} rollKey={rollKey} tumbles={rolled[at] ?? false} onPress={onDie === undefined || value === 0 ? undefined : () => onDie(at)} />
        ))}
      </div>
    </BoardFrame>
  );
}
