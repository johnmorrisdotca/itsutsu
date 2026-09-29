"use client";

import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { BLOCKS_PARTY_PLAYERS } from "@/lib/gomoku/party/partyBlocks.constants";
import { startBlocksParty } from "@/lib/gomoku/party/partyBlocks";
import { PARTY_NAME_MOST } from "@/lib/gomoku/party/partyRace";

import { MarbleChip } from "./MarbleChip";
import { PartyBlocksBoard } from "./PartyBlocksBoard";
import { PARTY_MARBLES } from "./party.constants";
import type { PartyBlocksSetUpProps } from "./party.types";
import { PARTY_BLOCKS_COPY } from "./partyBlocks.constants";

/**
 * THE TABLE, BEFORE A PIECE IS LAID: four names, if the table wants them.
 * Beside it the live board, as every set-up here draws it — never a picture
 * of one — with each player's corner in their colour, so the four can see
 * where they start before they choose who sits where.
 */
export function PartyBlocksSetUp({ appearance, onStart, ready }: PartyBlocksSetUpProps) {
  const [names, setNames] = useState<string[]>(() => new Array(BLOCKS_PARTY_PLAYERS).fill(""));
  const preview = startBlocksParty(names);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-2" data-testid="blocks-preview">
        <PartyBlocksBoard game={preview} appearance={appearance} preview={null} starts={[]} onSquare={() => {}} readOnly />
        <p className="text-xs text-muted">{PARTY_BLOCKS_COPY.preview}</p>
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="blocks-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          onStart(startBlocksParty(names));
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{PARTY_BLOCKS_COPY.names}</legend>
          {preview.players.map((player, index) => (
            <label key={player.corner} className="flex items-center gap-2 text-sm">
              <MarbleChip player={index} />
              <span className="sr-only">
                Player {index + 1}, {PARTY_MARBLES[index].label}
              </span>
              <input
                type="text"
                value={names[index]}
                maxLength={PARTY_NAME_MOST}
                placeholder={`Player ${index + 1}`}
                onChange={(event) => setNames((was) => was.map((name, at) => (at === index ? event.target.value : name)))}
                className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                data-testid="blocks-name"
              />
            </label>
          ))}
        </fieldset>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="blocks-start">
          {PARTY_BLOCKS_COPY.start} →
        </button>
        <p className="text-xs text-muted">{PARTY_BLOCKS_COPY.kept}</p>
      </form>
    </div>
  );
}
