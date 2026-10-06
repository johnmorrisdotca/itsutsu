"use client";

import { useEffect, useRef, useState } from "react";

import { PieceColourPicker } from "@/components/board/PieceColourPicker";
import { FOCUS_RING } from "@/components/ui/ui.constants";
import { tableColourRefusal, tableRefusalWords } from "@/lib/pieces/tableColours";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { MarbleChip } from "./MarbleChip";
import { PARTY_MARBLES, marbleFace } from "./party.constants";
import { usePartyMarbles, usePartyTable } from "./partyMarbles";

/**
 * THE COLOUR OF THE MARBLES OF WHOEVER IS TO PLAY. John, 2026-09-29: "allow
 * people to select their Marble colour when they lay their first move, or at
 * Options setup". At a table passed round one device, "whoever is holding it"
 * is whoever is to play, so the table offers each place its own colour on its
 * turn — before its first move, or any turn after — and never anybody else's.
 *
 * ONE SMALL CONTROL, NOT A PANEL. John, the same day, at Tenka on a desk: "I
 * don't think we need some stuff like the Colour picker once the game has
 * started." The colour is a set-up choice (`SeatColourButton`) that is
 * sometimes changed mid-game, so during play it is the place's own marble and
 * "Change colour" — pressed, the one picker every game uses opens over the
 * page beneath it, and closes on a choice, a press outside it, or Esc (which
 * then leaves just the board open, if it is). Its first circle is the place's
 * own table marble; it refuses a colour another place has, one too like
 * another place's marbles, or one whose letter another marble already carries
 * (`tableColourRefusal`).
 */
export function PartySeatColour({
  seat,
  name,
  playing,
  yours = false,
  align = "start",
}: {
  /** The reader's own place at a table played on several devices: "Your colour", not a name's. */
  yours?: boolean;
  /** The place to play, whose colour this is. */
  seat: number;
  name: string;
  /** How many places are at the table: the others are judged against. */
  playing: number;
  /** Which edge of the control the picker opens from: its start, or its end where the control sits at the right of a line. */
  align?: "start" | "end";
}) {
  const say = useSpeaker();
  const marbles = usePartyMarbles();
  const { colours, choose } = usePartyTable();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (box.current !== null && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Claimed, so one Esc closes the picker and the next leaves just the board (`BareBoard`).
      event.preventDefault();
      setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  const usual = PARTY_MARBLES[seat];
  if (usual === undefined || choose === null) return null;
  const whose = yours ? "Your colour" : `${name}'s colour`;
  return (
    <div
      ref={box}
      className="relative inline-flex max-w-full"
      data-testid="party-seat-colour"
      data-seat={seat}
      data-colour={colours[seat] ?? "usual"}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${whose}: ${marbles[seat]?.label ?? usual.label}. Change colour`}
        title={yours ? "Choose your colour" : `Choose ${name}'s colour`}
        className={`${FOCUS_RING} inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-rule px-2 pr-3 text-sm text-ink-soft hover:border-rule-strong sm:min-h-9`}
        data-testid="party-seat-colour-toggle"
      >
        <MarbleChip player={seat} />
        <span>
          Change colour <span className="font-mincho text-muted">色</span>
        </span>
      </button>
      {open ? (
        <div
          className={`absolute top-full z-30 mt-2 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-rule bg-paper p-3 shadow-lg ${align === "end" ? "right-0" : "left-0"}`}
          role="group"
          aria-label={whose}
          data-testid="party-seat-colour-panel"
        >
          <PieceColourPicker
            value={colours[seat] ?? null}
            onChoose={(colour) => {
              choose(seat, colour);
              setOpen(false);
            }}
            usual={{ face: marbleFace(usual), name: `${usual.label}, the table's own` }}
            label={whose}
            unavailable={(colour) => {
              const refusal = tableColourRefusal(seat, colour, marbles, playing);
              return refusal === null ? null : tableRefusalWords(refusal, say);
            }}
            testId="party-seat-colour-picker"
          />
          <p className="text-xs text-muted">
            {yours ? "Everybody at the table sees it; each player chooses their own." : "Each player chooses on their own turn, and may change it on any turn."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
