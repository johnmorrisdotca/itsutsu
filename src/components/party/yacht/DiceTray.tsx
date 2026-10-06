"use client";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import type { Appearance } from "@/components/board/board.types";

import { PartyDie } from "../PartyDie";
import { DICE_TUMBLE_MS } from "./yacht.constants";
import { yachtWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * ONE DIE: Korokoro's (`PartyDie`), which tumbles after a roll that threw it
 * and lands on the face the rules threw. Only the picture tumbles: the face it
 * lands on was decided before it started, and is the one its `data-value` says
 * throughout. A held die is ringed in vermilion and marked, and does not move.
 * A die not thrown yet is a pale empty square.
 */
function Die({ value, at, held, rollKey, tumbles, onPress }: { value: number; at: number; held: boolean; rollKey: number; tumbles: boolean; onPress?: () => void }) {
  const say = useSpeaker();
  const YACHT_COPY = yachtWords(say.locale);
  const picture = (
    <span className={`relative block aspect-square w-full rounded-[18%] ${held ? "ring-[3px] ring-shu" : ""}`}>
      {/* Mounted before the first throw too, so the first roll tumbles; hidden under the empty square until then. */}
      <span className={`block ${value === 0 ? "invisible" : ""}`}>
        <PartyDie face={value} rollKey={rollKey} tumble={tumbles} tumbleMs={DICE_TUMBLE_MS} />
      </span>
      {value === 0 ? <span className="absolute inset-[4%] rounded-[18%] border-[2.5px] border-black/55 bg-[rgba(255,253,246,0.55)]" aria-hidden="true" /> : null}
    </span>
  );
  const label = value === 0 ? "Not thrown yet" : `${value}${held ? `, ${YACHT_COPY.held.toLowerCase()}` : ""}`;
  const mark = <span className={`text-[0.65rem] font-semibold tracking-[0.12em] uppercase ${held ? "text-shu" : "invisible"}`}>{YACHT_COPY.held}</span>;
  // ONE ELEMENT WHETHER OR NOT IT CAN BE PRESSED: a die that changed from a span to a button would be mounted afresh, and a die mounted afresh has no earlier roll to tumble from.
  const pressable = onPress !== undefined;
  return (
    <span
      className={`relative z-10 flex w-[17%] max-w-24 flex-col items-center gap-1 ${pressable ? "cursor-pointer touch-manipulation" : ""}`}
      data-testid="dice-die"
      data-at={at}
      data-value={value}
      data-held={held ? "true" : "false"}
      role={pressable ? "button" : "img"}
      tabIndex={pressable ? 0 : undefined}
      aria-pressed={pressable ? held : undefined}
      aria-label={pressable ? `Die ${at + 1}: ${label}. Tap to ${held ? "let it go" : "hold it"}.` : label}
      onClick={onPress}
      onKeyDown={
        pressable
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onPress();
            }
          : undefined
      }
    >
      {picture}
      {mark}
    </span>
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
  const say = useSpeaker();
  const YACHT_COPY = yachtWords(say.locale);
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
