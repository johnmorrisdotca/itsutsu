"use client";

import { useEffect, useRef, useState } from "react";

import { PieceColourPicker } from "@/components/board/PieceColourPicker";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { tableColourRefusal, tableRefusalWords } from "@/lib/pieces/tableColours";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { MarbleChip } from "./MarbleChip";
import { PARTY_MARBLES, marbleFace } from "./party.constants";
import { marbleLabel } from "./partyWords";
import { usePartyMarbles, usePartyTable } from "./partyMarbles";

/**
 * A PLACE'S MARBLE ON A TABLE'S SET-UP, PRESSED TO CHOOSE ITS COLOUR. John,
 * 2026-09-29: "allow people to select their Marble colour… at Options setup".
 *
 * The marble beside each name is the button, so the set-up gains no row and
 * no height: pressed, the one picker every game uses opens over the page
 * beneath it, and closes on a choice, a press outside it, or Esc. Where the
 * table offers no colours (a picture, a card) it is the plain marble.
 */
export function SeatColourButton({ player, playing }: { player: number; playing: number }) {
  const say = useSpeaker();
  const { colours, choose } = usePartyTable();
  const marbles = usePartyMarbles();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (box.current !== null && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  const usual = PARTY_MARBLES[player];
  if (choose === null || usual === undefined) return <MarbleChip player={player} />;
  return (
    <span ref={box} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={say.say("party.playerColourAria", { player: playerNumberName(say, player + 1), colour: marbleLabel(marbles[player] ?? usual, say.locale) })}
        title={say.say("party.chooseSeatColour")}
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-moss"
        data-testid="set-up-seat-colour"
        data-seat={player}
        data-colour={colours[player] ?? "usual"}
      >
        <MarbleChip player={player} />
      </button>
      {open ? (
        <span className="absolute top-8 left-0 z-20 w-64 rounded-lg border border-rule bg-paper p-2 shadow-lg">
          <PieceColourPicker
            value={colours[player] ?? null}
            onChoose={(colour) => {
              choose(player, colour);
              setOpen(false);
            }}
            usual={{ face: marbleFace(usual), name: say.say("party.tableOwn", { colour: marbleLabel(usual, say.locale) }) }}
            label={say.say("party.ofColour", { name: playerNumberName(say, player + 1) })}
            unavailable={(colour) => {
              const refusal = tableColourRefusal(player, colour, marbles, playing);
              return refusal === null ? null : tableRefusalWords(refusal, say);
            }}
            testId="set-up-seat-colour-picker"
          />
        </span>
      ) : null}
    </span>
  );
}
