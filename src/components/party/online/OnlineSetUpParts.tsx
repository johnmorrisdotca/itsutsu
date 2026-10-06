"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SECTION_TITLE } from "@/components/ui/ui.constants";
import type { OnlineSeatAsk } from "@/lib/party/online/online.types";

import type { OnlineOffer, SeatChoice } from "./online.types";
import { onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * THE PARTS EVERY PARTY TABLE'S SET-UP GAINS FOR SEVERAL DEVICES: the
 * question where the table is played, a seat chooser in each name's row, and
 * the press that sets the table on the server. Drawn by Dots and Boxes', the
 * races' and Block Five's set-ups alike; nothing here knows which game.
 *
 * Every row keeps the height a name's box has, so choosing where never moves
 * the set-up under a finger.
 */

/** The seats a table opens with: the reader first, then a link each — or, for a member under 13, a buddy each while there are buddies. */
export function firstChoices(offer: OnlineOffer | undefined, most: number): SeatChoice[] {
  return Array.from({ length: most }, (_, seat): SeatChoice => {
    if (seat === 0) return "me";
    if (offer === undefined || offer.links) return "link";
    const buddy = offer.buddies[seat - 1];
    return buddy === undefined ? "link" : `buddy:${buddy.id}`;
  });
}

/** Where the table is played: this device, or several. Nothing at all where the game cannot be played on several. */
export function WhereChoice({ offer, several, onChange }: { offer: OnlineOffer | undefined; several: boolean; onChange: (several: boolean) => void }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  if (offer === undefined) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={SECTION_TITLE}>{ONLINE_COPY.where}</legend>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={ONLINE_COPY.where}>
        {[false, true].map((option) => (
          <button
            key={String(option)}
            type="button"
            role="radio"
            aria-checked={option === several}
            onClick={() => onChange(option)}
            data-testid={option ? "online-where-several" : "online-where-here"}
            className={`min-h-11 rounded-lg border px-2 text-sm font-semibold ${
              option === several ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory text-ink hover:bg-rule/60"
            }`}
          >
            {option ? ONLINE_COPY.several : ONLINE_COPY.here}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{several ? ONLINE_COPY.severalNote : ONLINE_COPY.hereNote}</p>
    </fieldset>
  );
}

/**
 * One seat's chooser, in the row where its name would be typed: "You" for
 * seat 1, and for every other a link, a buddy by name, or one of the game's
 * computer players by the name it plays under — each buddy offered only in
 * one seat at a time, and a link only to a member who may hand one out.
 */
export function SeatChoiceSelect({
  offer,
  seat,
  choices,
  onChoose,
  disabled = false,
}: {
  offer: OnlineOffer;
  seat: number;
  choices: readonly SeatChoice[];
  onChoose: (seat: number, choice: SeatChoice) => void;
  disabled?: boolean;
}) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  if (seat === 0) {
    return (
      <span className="flex min-h-11 w-full min-w-0 items-center rounded-lg border border-rule bg-ivory px-3 text-base font-semibold" data-testid="online-seat-choice" data-seat={0} data-choice="me">
        {ONLINE_COPY.you}
      </span>
    );
  }
  const chosen = choices[seat] ?? "link";
  const takenElsewhere = new Set(choices.filter((one, at) => at !== seat && one.startsWith("buddy:")));
  return (
    <select
      value={chosen}
      disabled={disabled}
      onChange={(event) => onChoose(seat, event.target.value as SeatChoice)}
      className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base"
      data-testid="online-seat-choice"
      data-seat={seat}
      data-choice={chosen}
      aria-label={say.say("party.online.seatN", { n: String(seat + 1) })}
    >
      {offer.links ? <option value="link">{ONLINE_COPY.link}</option> : null}
      {offer.buddies.map((buddy) => {
        const value: SeatChoice = `buddy:${buddy.id}`;
        return (
          <option key={buddy.id} value={value} disabled={takenElsewhere.has(value)}>
            {ONLINE_COPY.buddyLabel(buddy.name || say.say("party.online.aBuddy"))}
          </option>
        );
      })}
      {offer.computers.map((computer) => (
        <option key={computer.level} value={`computer:${computer.level}`}>
          {ONLINE_COPY.computerLabel(computer.name)}
        </option>
      ))}
    </select>
  );
}

/** A seat choice as the route asks for it. */
export function seatAskOf(choice: SeatChoice): OnlineSeatAsk {
  if (choice === "me" || choice === "link") return { kind: choice };
  if (choice.startsWith("computer:")) return { kind: "computer", level: choice.slice("computer:".length) };
  return { kind: "buddy", memberId: choice.slice("buddy:".length) };
}

/**
 * Setting the table on the server, and going to it: one call, and the answer
 * is the table's address. A refusal is said in the server's own words.
 */
export function useStartTable(offer: OnlineOffer | undefined) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const start = async (size: number, choices: readonly SeatChoice[], setup?: unknown) => {
    if (offer === undefined) return;
    setStarting(true);
    setProblem(null);
    try {
      const answer = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: offer.game, size, seats: choices.map(seatAskOf), setup }),
      });
      const body = (await answer.json().catch(() => null)) as { at?: string; error?: string } | null;
      if (answer.ok && body?.at) {
        router.push(body.at);
        return;
      }
      setProblem(body?.error ?? ONLINE_COPY.couldNotStart);
    } catch {
      setProblem(say.say("party.online.unreachable"));
    }
    setStarting(false);
  };
  return { start, starting, problem };
}

/** Whether every seat but the reader's can be filled: a member under 13 with no buddies has nobody to seat. */
export function seatsFillable(offer: OnlineOffer, count: number): boolean {
  return offer.links || offer.computers.length > 0 || offer.buddies.length >= count - 1;
}
