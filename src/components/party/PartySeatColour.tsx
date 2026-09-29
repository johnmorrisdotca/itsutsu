"use client";

import { PieceColourPicker } from "@/components/board/PieceColourPicker";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { tableColourRefusal, tableRefusalWords } from "@/lib/pieces/tableColours";

import { PARTY_MARBLES, marbleFace } from "./party.constants";
import { usePartyMarbles, usePartyTable } from "./partyMarbles";

/**
 * THE COLOUR OF THE MARBLES OF WHOEVER IS TO PLAY. John, 2026-09-29: "allow
 * people to select their Marble colour when they lay their first move, or at
 * Options setup". At a table passed round one device, "whoever is holding it"
 * is whoever is to play, so the table offers each place its own colour on its
 * turn — before its first move, or any turn after — and never anybody else's.
 *
 * The one picker every game uses (`PieceColourPicker`), its first circle the
 * place's own table marble, refusing a colour another place has, one too like
 * another place's marbles, or one whose letter another marble already carries
 * (`tableColourRefusal`).
 */
export function PartySeatColour({
  seat,
  name,
  playing,
  yours = false,
}: {
  /** The reader's own place at a table played on several devices: "Your colour", not a name's. */
  yours?: boolean;
  /** The place to play, whose colour this is. */
  seat: number;
  name: string;
  /** How many places are at the table: the others are judged against. */
  playing: number;
}) {
  const marbles = usePartyMarbles();
  const { colours, choose } = usePartyTable();
  const usual = PARTY_MARBLES[seat];
  if (usual === undefined || choose === null) return null;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="party-seat-colour" data-seat={seat} data-colour={colours[seat] ?? "usual"}>
      <h2 className={SECTION_TITLE}>
        {yours ? "Your colour" : `${name}’s colour`} <span className="font-mincho normal-case tracking-normal">色</span>
      </h2>
      <PieceColourPicker
        value={colours[seat] ?? null}
        onChoose={(colour) => choose(seat, colour)}
        usual={{ face: marbleFace(usual), name: `${usual.label}, the table's own` }}
        label={yours ? "Your colour" : `${name}'s colour`}
        unavailable={(colour) => {
          const refusal = tableColourRefusal(seat, colour, marbles, playing);
          return refusal === null ? null : tableRefusalWords(refusal);
        }}
        testId="party-seat-colour-picker"
      />
      <p className="text-xs text-muted">
        {yours ? "Everybody at the table sees it; each player chooses their own." : "Each player chooses on their own turn, and may change it on any turn."}
      </p>
    </section>
  );
}
