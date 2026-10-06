"use client";

import { useMemo, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { startGunjin } from "@/lib/party/gunjin/gunjin";
import { GUNJIN_DEFAULT_SIZE, GUNJIN_SIZES } from "@/lib/party/gunjin/gunjin.constants";
import type { GunjinGame } from "@/lib/party/gunjin/gunjin.types";
import { gunjinSeatView } from "@/lib/party/gunjin/gunjinView";
import { PARTY_NAME_MOST } from "@/lib/party/partyNames";
import { playerNumberName } from "@/lib/gomoku/seatWords";

import { SeatChoiceSelect, WhereChoice, firstChoices, seatsFillable, useStartTable } from "../online/OnlineSetUpParts";
import type { OnlineOffer, SeatChoice } from "../online/online.types";
import { GunjinBoard } from "./GunjinBoard";
import { GunjinSide } from "./GunjinSide";
import { gunjinBoardWords, gunjinWords, onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE TABLE, BEFORE ANY PIECE IS PLACED: which of the four games, and what the
 * two sides are called, beside the live board of the game chosen, set out as
 * it begins — empty, as every board is until its sides have arranged their
 * pieces: every set-up preview on this site is the board itself.
 *
 * NOTHING HERE CHANGES HEIGHT when something is chosen (AGENTS.md): the four
 * games are four tiles of one size in two rows, each with room for its longest
 * line, and the board is the box its game's shape fixes.
 */
export function GunjinSetUp({ appearance, onStart, ready, online }: { appearance: Appearance; onStart: (game: GunjinGame) => void; ready: { "data-ready": string }; online?: OnlineOffer }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const [size, setSize] = useState<number>(GUNJIN_DEFAULT_SIZE);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [several, setSeveral] = useState(false);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(online, 2));
  const table = useStartTable(online);
  const severalOffer = several ? online : undefined;
  const onChoose = (seat: number, choice: SeatChoice) => setChoices((was) => was.map((one, at) => (at === seat ? choice : one)));
  const preview = useMemo(() => gunjinSeatView(startGunjin(size, ["", ""])!, 0).view, [size]);
  const spec = gunjinBoardWords(say.locale)[size]!;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start">
      {/*
        One square box whatever board is chosen (the four are 7×8, 9×8, 9×9 and 10×10), so choosing another never moves the page:
        the board is drawn at the width that keeps its height inside the box, centred in it.
      */}
      <div className="aspect-square min-w-0" data-testid="gunjin-preview">
        <div className="mx-auto" style={{ width: `${Math.min(1, spec.width / spec.height) * 100}%` }}>
          <GunjinBoard view={preview} appearance={appearance} label={GUNJIN_COPY.boardLabel(spec.name)} testId="gunjin-preview-board" />
        </div>
      </div>
      <form
        className={`${PANEL_CLASS} flex min-w-0 flex-col gap-4`}
        data-testid="gunjin-set-up"
        {...ready}
        onSubmit={(event) => {
          event.preventDefault();
          if (severalOffer !== undefined) {
            void table.start(size, choices.slice(0, 2));
            return;
          }
          const fresh = startGunjin(size, names);
          if (fresh !== null) onStart(fresh);
        }}
      >
        <WhereChoice offer={online} several={several} onChange={setSeveral} />
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{GUNJIN_COPY.which}</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={GUNJIN_COPY.which}>
            {GUNJIN_SIZES.map((option) => {
              const board = gunjinBoardWords(say.locale)[option]!;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  onClick={() => setSize(option)}
                  aria-checked={option === size}
                  data-testid="gunjin-board-choice"
                  data-size={option}
                  data-mode={board.mode}
                  className={`flex h-28 min-w-0 flex-col items-start gap-1 rounded-lg border p-2 text-left ${option === size ? "border-ink bg-rule/70" : "border-rule-strong bg-ivory hover:bg-rule/60"}`}
                >
                  <span className="text-base font-semibold">{board.name}</span>
                  <span className="-mt-1 text-xs text-muted">{board.kanji}</span>
                  <span className="text-xs leading-snug text-muted">
                    {board.width}×{board.height}: {board.note}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={SECTION_TITLE}>{GUNJIN_COPY.seats}</legend>
          {[0, 1].map((seat) => (
            <label key={seat} className="flex items-center gap-2 text-sm">
              <GunjinSide seat={seat} />
              <span className="sr-only">{seat === 0 ? GUNJIN_COPY.red : GUNJIN_COPY.blue}</span>
              {severalOffer !== undefined ? (
                <SeatChoiceSelect offer={severalOffer} seat={seat} choices={choices} onChoose={onChoose} />
              ) : (
                <input
                  type="text"
                  value={names[seat]}
                  maxLength={PARTY_NAME_MOST}
                  placeholder={say.say(seat === 0 ? "party.gunjin.nameRed" : "party.gunjin.nameBlue", { name: playerNumberName(say, seat + 1) })}
                  onChange={(event) => setNames((was) => (seat === 0 ? [event.target.value, was[1]] : [was[0], event.target.value]))}
                  className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
                  data-testid="gunjin-name"
                  data-seat={seat}
                />
              )}
            </label>
          ))}
        </fieldset>
        <button type="submit" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="gunjin-start" disabled={table.starting || (severalOffer !== undefined && !seatsFillable(severalOffer, 2))}>
          {severalOffer === undefined ? GUNJIN_COPY.start : table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} →
        </button>
        {table.problem !== null && severalOffer !== undefined ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
            {table.problem}
          </p>
        ) : null}
        <p className="text-xs text-muted">{severalOffer === undefined ? GUNJIN_COPY.kept : ONLINE_COPY.keptNote(seatsFillable(severalOffer, 2))}</p>
      </form>
    </div>
  );
}
