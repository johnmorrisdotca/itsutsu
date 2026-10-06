"use client";

import { MarbleChip } from "../MarbleChip";
import { HitotsuCardView } from "./HitotsuCardView";
import { hitotsuScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * EVERYBODY ELSE AT THE TABLE, in a row over it: their marble and name, a
 * card back and how many they hold — never a face — their score, and
 * "Hitotsu!" beside anybody down to one card; the player to move ringed.
 */
export function HitotsuSeats({
  seats,
  names,
  computers,
  counts,
  scores,
  toPlay,
}: {
  seats: readonly number[];
  names: readonly string[];
  computers: readonly boolean[];
  counts: readonly number[];
  scores: readonly number[];
  toPlay: number | null;
}) {
  const say = useSpeaker();
  const HITOTSU_COPY = hitotsuScreenWords(say.locale);
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="hitotsu-seats">
      {seats.map((seat) => (
        <li
          key={seat}
          className={`flex min-h-12 w-full items-center gap-2 rounded-lg border border-rule bg-paper px-2 py-1 ${seat === toPlay ? "ring-2 ring-moss" : ""}`}
          data-testid="hitotsu-seat"
          data-seat={seat}
          data-count={counts[seat]}
          data-to-play={seat === toPlay ? "true" : undefined}
        >
          <span className="relative w-7 shrink-0">
            <HitotsuCardView faceUp={false} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
            <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
              <MarbleChip player={seat} />
              <span className="truncate">{names[seat]}</span>
            </span>
            <span className="text-xs text-muted">
              {HITOTSU_COPY.cards(counts[seat])} · {say.count("party.hitotsu.points", scores[seat])}
              {computers[seat] ? ` · ${say.say("party.computerTag")}` : ""}
              {counts[seat] === 1 ? <strong className="ml-1 text-shu"> {HITOTSU_COPY.one}</strong> : null}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
