"use client";

import { usePartyMarbles } from "./partyMarbles";
import { useState } from "react";

import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { BLOCKS_PARTY_PLAYERS } from "@/lib/gomoku/party/partyBlocks.constants";
import { startBlocksParty } from "@/lib/gomoku/party/partyBlocks";
import { PARTY_NAME_MOST } from "@/lib/gomoku/party/partyRace";

import { SeatColourButton } from "./SeatColourButton";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "./online/OnlineSetUpParts";
import type { SeatChoice } from "./online/online.types";
import { PartyBlocksBoard } from "./PartyBlocksBoard";
import { PARTY_MARBLES } from "./party.constants";
import type { PartyBlocksSetUpProps } from "./party.types";
import { blocksWords, onlineWords, seatColourName } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE TABLE, BEFORE A PIECE IS LAID: four names, if the table wants them.
 * Beside it the live board, as every set-up here draws it — never a picture
 * of one — with each player's corner in their colour, so the four can see
 * where they start before they choose who sits where.
 */
export function PartyBlocksSetUp({ appearance, onStart, ready, online }: PartyBlocksSetUpProps) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const PARTY_BLOCKS_COPY = blocksWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [names, setNames] = useState<string[]>(() => new Array(BLOCKS_PARTY_PLAYERS).fill(""));
  const preview = startBlocksParty(names);
  // Several devices: a seat chooser in each name's row, and Start sets the table on the server (`OnlineSetUpParts`).
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, PARTY_MARBLES.length));
  const table = useStartTable(online);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const severalOffer = several ? online : undefined;

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
          if (severalOffer !== undefined) void table.start(0, choices.slice(0, BLOCKS_PARTY_PLAYERS));
          else onStart(startBlocksParty(names));
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{severalOffer !== undefined ? ONLINE_COPY.seats : PARTY_BLOCKS_COPY.names}</legend>
          {preview.players.map((player, index) => (
            <label key={player.corner} className="flex items-center gap-2 text-sm">
              <SeatColourButton player={index} playing={preview.players.length} />
              <span className="sr-only">
                {seatColourName(say, index, marbles[index])}
              </span>
              {severalOffer !== undefined ? (
                <SeatChoiceSelect offer={severalOffer} seat={index} choices={choices} onChoose={onChoose} />
              ) : (
                <input
                  type="text"
                  value={names[index]}
                  maxLength={PARTY_NAME_MOST}
                  placeholder={`Player ${index + 1}`}
                  onChange={(event) => setNames((was) => was.map((name, at) => (at === index ? event.target.value : name)))}
                  className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                  data-testid="blocks-name"
                />
              )}
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          data-testid="blocks-start"
          disabled={table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, BLOCKS_PARTY_PLAYERS))}
        >
          {severalOffer === undefined ? PARTY_BLOCKS_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
        <p className="text-xs text-muted">{severalOffer === undefined ? PARTY_BLOCKS_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, BLOCKS_PARTY_PLAYERS))}</p>
      </form>
    </div>
  );
}
