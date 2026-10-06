"use client";

import { useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { isComputer, partyTilesLeft } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { joinParty, joinRefused, leaveParty, leaveRefused, tilesHeldBy, type JoinRefusal, type LeaveRefusal } from "@/lib/puzzles/kumimoji/partySeats";
import { KUMIMOJI_PARTY } from "@/lib/puzzles/kumimoji/tiles.constants";

import { ComputerMark } from "./KumimojiDeskParts";
import { keepParty } from "./kumimojiPartyKept";
import { seatName } from "./kumimojiWords";

/** Why nobody can sit down now, for the line where Join would be. */
function joinWhy(game: PartyGame, refusal: JoinRefusal, say: Speaker): string {
  switch (refusal) {
    case "full":
      return say.say("pkumi.seats.full", { count: String(KUMIMOJI_PARTY.most) });
    case "lastRound":
      return say.say("pkumi.seats.lastRound");
    case "bag":
      return say.count("pkumi.seats.bag", partyTilesLeft(game), { size: String(game.settings.size) });
    case "over":
      return say.say("pkumi.seats.over");
  }
}

/** Why this player cannot leave, beside their name. */
const LEAVE_WHY: Record<LeaveRefusal, PhraseKey | null> = {
  out: "pkumi.seats.leaveOut",
  lastPerson: "pkumi.seats.leaveLast",
  over: null,
};

/**
 * JOIN OR LEAVE, under the pass screen: between turns, never on somebody's
 * desk. John, 2026-09-28: "People can jump in and out of a game at which
 * point all their tiles go back to the pot. Also you can add computer bots."
 *
 * Closed until asked for, so the pass screen stays about whose turn it is.
 * Open, every player with a Leave, which asks once more and says how many
 * tiles go back into the bag; and a new seat, a person with a name or a
 * computer, dealt a hand from the bag — or the reason nobody can sit down now
 * (`joinRefused`). The rules are `partySeats.ts`'s; every change is kept at
 * once (`keepParty`).
 */
export function KumimojiPartySeats({ game }: { game: PartyGame }) {
  const say = useSpeaker();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [name, setName] = useState("");
  const refusal = joinRefused(game);

  if (!open) {
    return (
      <button type="button" className="self-center text-sm text-muted underline underline-offset-2" onClick={() => setOpen(true)} data-testid="kumimoji-party-seats-open">
        {say.say("pkumi.seats.open")}
      </button>
    );
  }
  const join = (computer: boolean) => {
    keepParty(joinParty(game, { name, computer }));
    setName("");
  };
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-rule p-3" data-testid="kumimoji-party-seats">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">
          <Paired en={say.say("pkumi.seats.open")} kanji="席" kanjiClassName="font-normal opacity-70" inReadersLanguage />
        </h3>
        <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={() => setOpen(false)} data-testid="kumimoji-party-seats-close">
          {say.say("pkumi.seats.close")}
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {game.players.map((_, at) => {
          const why = leaveRefused(game, at);
          const held = tilesHeldBy(game, at);
          return (
            <li key={`${at}-${seatName(say, game, at)}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" data-testid="kumimoji-party-seat" data-player={at}>
              <span className="min-w-0 max-w-full truncate font-medium">{seatName(say, game, at)}</span>
              {isComputer(game, at) ? <ComputerMark /> : null}
              {leaving === at ? (
                <span className="flex w-full flex-wrap items-center gap-2">
                  <span>
                    {say.count("pkumi.seats.leaveAsk", held)}
                  </span>
                  <button
                    type="button"
                    className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
                    onClick={() => {
                      setLeaving(null);
                      keepParty(leaveParty(game, at));
                    }}
                    data-testid="kumimoji-party-leave-yes"
                  >
                    {say.say("pkumi.seats.leaveYes")}
                  </button>
                  <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setLeaving(null)}>
                    {say.say("pkumi.seats.stay")}
                  </button>
                </span>
              ) : why === null ? (
                <button type="button" className="ml-auto text-muted underline underline-offset-2" onClick={() => setLeaving(at)} data-testid="kumimoji-party-leave">
                  {say.say("pkumi.seats.leave")}
                </button>
              ) : (
                <span className="ml-auto text-xs text-muted" data-testid="kumimoji-party-leave-why">
                  {LEAVE_WHY[why] === null ? "" : say.say(LEAVE_WHY[why])}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {refusal === null ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            join(false);
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={say.say("pkumi.party.playerLabel", { n: String(game.players.length + 1) })}
            maxLength={KUMIMOJI_PARTY.nameMost}
            autoComplete="off"
            aria-label={say.say("pkumi.seats.nameAria")}
            className="min-w-0 flex-1 basis-32 rounded border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
            data-testid="kumimoji-party-join-name"
          />
          <button type="submit" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="kumimoji-party-join">
            {say.say("pkumi.seats.join")}
          </button>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} inline-flex items-center gap-1`} onClick={() => join(true)} data-testid="kumimoji-party-join-computer">
            {say.say("pkumi.seats.addComputer")}
          </button>
          <p className="w-full text-xs text-muted">
            {say.say("pkumi.seats.note", { name: seatName(say, game, game.players.length - 1), size: String(game.settings.size) })}
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted" data-testid="kumimoji-party-join-why" data-why={refusal}>
          {joinWhy(game, refusal, say)}
        </p>
      )}
    </div>
  );
}
