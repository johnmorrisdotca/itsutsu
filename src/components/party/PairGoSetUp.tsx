"use client";

import { useState } from "react";

import { BoardPicker } from "@/components/live/BoardPicker";
import { BoardPreview } from "@/components/live/BoardPreview";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { OBSTACLE_LAYOUTS, STONES, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import {
  PAIR_GO_DEFAULT_SIZE,
  PAIR_GO_SIZES,
  PAIR_GO_VARIANT,
  PAIR_NAME_MOST,
  PAIR_SEATS,
  pairPlayer,
  startPairGo,
} from "@/lib/gomoku/party/pairGo";
import type { PairTeams } from "@/lib/gomoku/party/pairGo.types";

import { PairStone } from "./PairStone";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "./online/OnlineSetUpParts";
import { ONLINE_COPY } from "./online/online.constants";
import type { SeatChoice } from "./online/online.types";
import { PAIR_GO_COPY } from "./pairGo.constants";
import type { PairGoSetUpProps } from "./party.types";

const NO_NAMES: PairTeams = { black: ["", ""], white: ["", ""] };

/** Four at the board, always. */
const PAIR_PLAYERS = 4;

/**
 * THE TWO TEAMS, BEFORE A STONE IS PLAYED: four names, if the table wants
 * them, and the board. Beside it the live board at the chosen size, as every
 * set-up on this site draws it (`BoardPreview`), with its sizes chosen from the
 * set-up screen's own tiles (`BoardPicker`).
 *
 * Each team is two boxes under its colour, each saying where that player's
 * first turn comes, since the order round the table — Black, White, Black,
 * White — is the one thing about Pair Go a table has to agree before it starts.
 */
export function PairGoSetUp({ appearance, onStart, ready, online }: PairGoSetUpProps) {
  const [size, setSize] = useState(PAIR_GO_DEFAULT_SIZE);
  const [teams, setTeams] = useState<PairTeams>(NO_NAMES);
  /*
   * Several devices: a seat chooser in each name's box, a seat being its place
   * in the order round the table (Black first is seat 1, and the maker's), and
   * Start sets the table on the server (`OnlineSetUpParts`).
   */
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, PAIR_PLAYERS));
  const table = useStartTable(online);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const severalOffer = several ? online : undefined;

  const rename = (stone: Stone, place: 0 | 1, name: string) =>
    setTeams((was) => ({ ...was, [stone]: place === 0 ? [name, was[stone][1]] : [was[stone][0], name] }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="pairgo-preview">
        <BoardPreview rules={{ variant: PAIR_GO_VARIANT, size, obstacles: OBSTACLE_LAYOUTS.none }} appearance={appearance} />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="pairgo-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) void table.start(size, choices);
          else onStart(startPairGo(size, teams));
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className={SECTION_TITLE}>{PAIR_GO_COPY.teams}</legend>
          {[STONES.black, STONES.white].map((stone) => (
            <div key={stone} className="flex min-w-0 flex-col gap-1.5" data-testid="pairgo-team" data-stone={stone}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <PairStone stone={stone} appearance={appearance} />
                {STONE_DISPLAY[stone].label} <span className="font-mincho font-normal">{STONE_DISPLAY[stone].kanji}</span>
              </p>
              {PAIR_SEATS.filter((seat) => seat.stone === stone).map(({ place }) => {
                const seat = pairPlayer(NO_NAMES, stone, place);
                return (
                  <label key={place} className="flex min-w-0 flex-col gap-0.5 text-xs text-muted">
                    {PAIR_GO_COPY.seatLabel(STONE_DISPLAY[stone].label, seat.turnOrder)}
                    {severalOffer !== undefined ? (
                      <SeatChoiceSelect offer={severalOffer} seat={seat.turnOrder} choices={choices} onChoose={onChoose} />
                    ) : (
                      <input
                        type="text"
                        value={teams[stone][place]}
                        maxLength={PAIR_NAME_MOST}
                        placeholder={seat.name}
                        onChange={(event) => rename(stone, place, event.target.value)}
                        className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base text-ink"
                        data-testid="pairgo-name"
                        data-stone={stone}
                        data-place={place}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </fieldset>
        <BoardPicker value={size} sizes={PAIR_GO_SIZES} onChange={setSize} />
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          data-testid="pairgo-start"
          disabled={table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, PAIR_PLAYERS))}
        >
          {severalOffer === undefined ? PAIR_GO_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
        <p className="text-xs text-muted">{severalOffer === undefined ? PAIR_GO_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, PAIR_PLAYERS))}</p>
      </form>
    </div>
  );
}
