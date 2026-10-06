"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import { usePartyMarbles } from "./partyMarbles";
import { PlayerCountChoice } from "./PlayerCountChoice";
import { SeatColourButton } from "./SeatColourButton";
import { useState } from "react";

import { BoardSizeMark } from "@/components/board/BoardSizeMark";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { PARTY_SPECS } from "@/lib/party/party.constants";
import { DOTS_NAME_MOST, dotsLineCount, startDots } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";

import { DotsBoard } from "./DotsBoard";
import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "./online/OnlineSetUpParts";
import type { SeatChoice } from "./online/online.types";
import type { DotsSetUpProps } from "./party.types";
import { dotsWords, marbleLabel, onlineWords, partyScreenWords } from "./partyWords";

const SPEC = PARTY_SPECS.dotsAndBoxes;
const COUNTS = Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, index) => SPEC.fewestPlayers + index);

/**
 * THE TABLE, BEFORE ANYBODY DRAWS: how many are playing, on which board, and
 * what they are called if they want names. Beside it the live board at the
 * chosen size — every set-up preview on this site is the board itself, never
 * a picture of one — drawn `readOnly`, with nothing to tap.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the board
 * is a square as wide as its column whatever its size, the four boards are
 * four tiles of one size, and there is a row for every name the table could
 * need, the ones past the count chosen kept in their place and hidden.
 */
export function DotsSetUp({ appearance, onStart, ready, online }: DotsSetUpProps) {
  const say = useSpeaker();
  const DOTS_COPY = dotsWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const [count, setCount] = useState(SPEC.defaultPlayers);
  const [size, setSize] = useState(SPEC.defaultSize);
  const [names, setNames] = useState<string[]>(() => new Array<string>(SPEC.mostPlayers).fill(""));
  // Several devices: a seat chooser in each name's row, and Start sets the table on the server (`OnlineSetUpParts`).
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, SPEC.mostPlayers));
  const table = useStartTable(online);
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const severalOffer = several ? online : undefined;
  const seated = names.slice(0, count);
  // A table the set-up offers is always one the rules start.
  const preview = startDots(size, seated)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0" data-testid="dots-preview">
        <DotsBoard game={preview} appearance={appearance} readOnly />
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="dots-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) void table.start(size, choices.slice(0, count));
          else onStart(startDots(size, seated)!);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        {/* How many are playing: the one row every table uses (`PlayerCountChoice`). */}
        <PlayerCountChoice counts={COUNTS} value={count} onChange={setCount} testId="dots-count" />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{DOTS_COPY.board}</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={DOTS_COPY.board}>
            {SPEC.sizes.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                onClick={() => setSize(option)}
                aria-checked={option === size}
                data-testid="dots-size"
                data-size={option}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg border p-0.5 pb-1 text-xs ${
                  option === size ? "border-ink bg-rule/70 font-semibold" : "border-rule-strong bg-ivory hover:bg-rule/60"
                }`}
              >
                <BoardSizeMark side={option} size="regular" words="none" />
                <span className="text-muted">{DOTS_COPY.lines(dotsLineCount(option))}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{severalOffer !== undefined ? ONLINE_COPY.seats : PARTY_COPY.names}</legend>
          {names.map((name, index) => {
            const sitting = index < count;
            return (
              <label key={index} className={`flex items-center gap-2 text-sm ${sitting ? "" : "invisible"}`} aria-hidden={sitting ? undefined : true}>
                <SeatColourButton player={index} playing={count} />
                <span className="sr-only">{say.say("party.seatColour", { player: playerNumberName(say, index + 1), colour: marbleLabel(marbles[index], say.locale) })}</span>
                {severalOffer !== undefined ? (
                  <SeatChoiceSelect offer={severalOffer} seat={index} choices={choices} onChoose={onChoose} disabled={!sitting} />
                ) : (
                  <input
                    type="text"
                    value={name}
                    maxLength={DOTS_NAME_MOST}
                    placeholder={playerNumberName(say, index + 1)}
                    disabled={!sitting}
                    onChange={(event) => setNames((was) => was.map((one, at) => (at === index ? event.target.value : one)))}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                    data-testid="dots-name"
                  />
                )}
              </label>
            );
          })}
        </fieldset>
        <button
          type="submit"
          className={`${BUTTON_LEAD} ${BUTTON_STRONG}`}
          data-testid="dots-start"
          disabled={table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, count))}
        >
          {severalOffer === undefined ? PARTY_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
        <p className="text-xs text-muted">{severalOffer === undefined ? PARTY_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, count))}</p>
      </form>
    </div>
  );
}
