"use client";

import { useState } from "react";

import { PressLabel } from "@/components/ui/PressLabel";
import { PLAY_BUTTON, SECTION_HEADING, SECTION_HEADING_KANJI } from "@/components/ui/ui.constants";
import type { PartySettings } from "@/lib/puzzles/kumimoji/party.types";
import type { OnlineOffer } from "@/lib/party/online/online.types";

import { SeatChoiceSelect, firstChoices, seatsFillable, useStartTable } from "./OnlineSetUpParts";
import type { SeatChoice } from "./online.types";
import { onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * KUMIMOJI'S SEATS ON SEVERAL DEVICES, where its names screen would be: the
 * reader in seat 1, and each other seat a buddy, a link or a computer. The
 * table is set on the server from the bag this browser dealt from the
 * address's seed — the server checks it is a bag of the game's, and takes this
 * browser's word for its letters, as it does for the words (John,
 * 2026-09-29).
 */
export function KumimojiOnlineSeats({ offer, count, setup }: { offer: OnlineOffer; count: number; setup: { settings: PartySettings; bag: string } }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const [choices, setChoices] = useState<SeatChoice[]>(() => firstChoices(offer, count));
  const table = useStartTable(offer);
  const fillable = seatsFillable(offer, count);
  return (
    <form
      className="flex flex-col gap-3"
      data-testid="kumimoji-online-seats"
      onSubmit={(event) => {
        event.preventDefault();
        void table.start(setup.settings.size, choices, setup);
      }}
    >
      <h2 className={SECTION_HEADING}>
        {ONLINE_COPY.seats} <span className={SECTION_HEADING_KANJI}>席</span>
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: count }, (_, seat) => (
          <label key={seat} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0 text-muted">Player {seat + 1}</span>
            <SeatChoiceSelect offer={offer} seat={seat} choices={choices} onChoose={(at, choice) => setChoices((was) => was.map((one, i) => (i === at ? choice : one)))} />
          </label>
        ))}
      </div>
      {table.problem !== null ? (
        <p className="text-sm text-shu" role="alert" data-testid="online-start-problem">
          {table.problem}
        </p>
      ) : null}
      <p className="text-xs text-muted">{ONLINE_COPY.keptNote(fillable)}</p>
      <button type="submit" className={PLAY_BUTTON} disabled={table.starting || !fillable} data-testid="kumimoji-online-start">
        <PressLabel words={table.starting ? ONLINE_COPY.starting : ONLINE_COPY.start} kanji="卓" />
      </button>
    </form>
  );
}
