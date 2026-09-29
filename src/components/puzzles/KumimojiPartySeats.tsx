"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { isComputer, nameOf, partyTilesLeft } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { joinParty, joinRefused, leaveParty, leaveRefused, tilesHeldBy, type JoinRefusal, type LeaveRefusal } from "@/lib/puzzles/kumimoji/partySeats";
import { KUMIMOJI_PARTY } from "@/lib/puzzles/kumimoji/tiles.constants";

import { ComputerMark } from "./KumimojiDeskParts";
import { keepParty } from "./kumimojiPartyKept";

/** Why nobody can sit down now, for the line where Join would be. */
function joinWhy(game: PartyGame, refusal: JoinRefusal): string {
  switch (refusal) {
    case "full":
      return `${KUMIMOJI_PARTY.most} are playing: nobody else can join.`;
    case "lastRound":
      return "The last round has begun: nobody can join now.";
    case "bag":
      return `The bag holds ${partyTilesLeft(game)} ${partyTilesLeft(game) === 1 ? "tile" : "tiles"}, fewer than a hand of ${game.settings.size}: nobody can join now.`;
    case "over":
      return "The game is over.";
  }
}

/** Why this player cannot leave, beside their name. */
const LEAVE_WHY: Record<LeaveRefusal, string> = {
  out: "went out: stays to the end",
  lastPerson: "the last person: end the game instead",
  over: "",
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
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [name, setName] = useState("");
  const refusal = joinRefused(game);

  if (!open) {
    return (
      <button type="button" className="self-center text-sm text-muted underline underline-offset-2" onClick={() => setOpen(true)} data-testid="kumimoji-party-seats-open">
        Join or leave
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
          Join or leave <span className="font-mincho font-normal opacity-70">席</span>
        </h3>
        <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={() => setOpen(false)} data-testid="kumimoji-party-seats-close">
          Close
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {game.players.map((_, at) => {
          const why = leaveRefused(game, at);
          const held = tilesHeldBy(game, at);
          return (
            <li key={`${at}-${nameOf(game, at)}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" data-testid="kumimoji-party-seat" data-player={at}>
              <span className="min-w-0 max-w-full truncate font-medium">{nameOf(game, at)}</span>
              {isComputer(game, at) ? <ComputerMark /> : null}
              {leaving === at ? (
                <span className="flex w-full flex-wrap items-center gap-2">
                  <span>
                    Leave, and put {held} {held === 1 ? "tile" : "tiles"} back in the bag?
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
                    Yes, leave
                  </button>
                  <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setLeaving(null)}>
                    Stay
                  </button>
                </span>
              ) : why === null ? (
                <button type="button" className="ml-auto text-muted underline underline-offset-2" onClick={() => setLeaving(at)} data-testid="kumimoji-party-leave">
                  Leave
                </button>
              ) : (
                <span className="ml-auto text-xs text-muted" data-testid="kumimoji-party-leave-why">
                  {LEAVE_WHY[why]}
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
            placeholder={`Player ${game.players.length + 1}`}
            maxLength={KUMIMOJI_PARTY.nameMost}
            autoComplete="off"
            aria-label="The new player's name"
            className="min-w-0 flex-1 basis-32 rounded border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
            data-testid="kumimoji-party-join-name"
          />
          <button type="submit" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="kumimoji-party-join">
            Join
          </button>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} inline-flex items-center gap-1`} onClick={() => join(true)} data-testid="kumimoji-party-join-computer">
            Add a computer
          </button>
          <p className="w-full text-xs text-muted">
            A new player sits down after {nameOf(game, game.players.length - 1)} with a hand of {game.settings.size} from the bag. Leaving puts a player&rsquo;s hand and table back in the bag.
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted" data-testid="kumimoji-party-join-why" data-why={refusal}>
          {joinWhy(game, refusal)}
        </p>
      )}
    </div>
  );
}
