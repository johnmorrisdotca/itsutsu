"use client";

import { Button } from "@/components/ui/Controls";
import { START_COPY } from "@/components/mine/mine.constants";

import { DOORSTEP_COPY, SET_UP_COPY, SIGN_IN_TO_PLAY } from "./live.constants";

/**
 * THE BOTTOM OF THE SET-UP SCREEN: who will be sitting where, and the one
 * press that writes the game.
 *
 * Lifted out of `SetUpGame.tsx` when that file passed the File Size Gate, and
 * a responsibility rather than an offcut: everything above it is CHOOSING and
 * everything here is the act. It is also the part John's 2026-09-21 note was
 * about — "in mobile, the buttons are small, targets are hard to hit.
 * probably full width buttons make more sense" — so the button is `lead`,
 * which is fingertip-sized and fills the column on a phone.
 */
export function BeginBar({
  sitting,
  made,
  trouble,
  press,
  forget,
  busy,
  signedIn,
  canAsk,
  named,
  waiting,
}: {
  /** Who sits where, in a sentence: the fact people most want before a board. */
  sitting: string;
  /** The game this address has already made, where it has — see `useSetUpPress`. */
  made: string | null;
  /** What the route said when it refused, where it did. */
  trouble: string | null;
  press: () => void;
  forget: () => void;
  busy: boolean;
  signedIn: boolean;
  canAsk: boolean;
  /** Whether a person or a program has been named, which is a challenge rather than a posted seat. */
  named: boolean;
  /** A seat somebody is already waiting at, where one matches what was asked for. */
  waiting: { who: string } | undefined;
}) {
  return (
  <div className="flex flex-col gap-2 border-t border-rule pt-3" data-testid="set-up-continue">
    {/*
      WHO SITS WHERE, immediately above the press that seats them. The one
      fact the doorstep had that this screen did not, and the reason the
      two screens could be made one: everything else it said, this screen
      was already saying.
    */}
    <p className="text-sm text-ink-soft" data-testid="set-up-seating">
      {sitting}
    </p>
    {made !== null ? (
      <p className="text-xs text-moss" data-testid="set-up-made">
        {DOORSTEP_COPY.made}
      </p>
    ) : null}
    {trouble !== null ? (
      <p className="text-xs text-shu" data-testid="set-up-trouble">
        {trouble}
      </p>
    ) : null}
    {/*
      NOT WRAPPED IN A SHRINKING SPAN. `lead` gives the button the column's
      full width on a phone, and an inline wrapper around it takes that
      width straight back off again.
    */}
    <div className="flex">
      {/*
        The button says what it does: it continues, to the page that states
        the game. John: "it's not Start the Game... button should be
        'Continue'". Where somebody is already waiting at exactly this game it
        says whose seat it continues to, because that is a different act.
      */}
      {/*
        A session continues with a seat for anyone; naming somebody is a
        challenge, which needs an account. An invite holder who arrives
        with a person or a program already chosen — a link typed or sent —
        is not carried on to a Begin the route would refuse.
      */}
      <Button
        onClick={press}
        disabled={busy || !signedIn || (!canAsk && named)}
        strong
        lead
        data-testid="set-up-start"
        /*
         * WHAT THIS PRESS WILL DO, on the button itself. Nearly always it
         * writes the game and lands on a board; where somebody has already
         * posted exactly this game it goes to the doorstep to read THEIR
         * rules first. A spec cannot tell those apart afterwards without
         * waiting to see which page arrives, and a wait is a race — the
         * board rewrites its own address to name the position as soon as it
         * hydrates, so a spec that spent two seconds deciding missed the
         * address it was waiting for. Said here, it is decided before the
         * press rather than guessed after it.
         */
        data-press={waiting !== undefined ? "seat" : "begin"}
      >
        {busy
          ? SET_UP_COPY.beginning
          : made !== null
            ? SET_UP_COPY.board
            : waiting !== undefined
              ? SET_UP_COPY.continueToSeat(waiting.who)
              : SET_UP_COPY.begin}
      </Button>
    </div>
    {/*
      What the press does, in one line — and it depends on which press it
      is. Continuing to somebody's posted seat still has a screen after it,
      where their rules are read before they are agreed to; beginning your
      own game has not had one since the two were made one.
    */}
    <p className="text-xs text-muted" data-testid="set-up-leads">
      {waiting !== undefined ? SET_UP_COPY.startLeads : SET_UP_COPY.beginHere}
    </p>
    {made !== null ? (
      <button
        type="button"
        onClick={forget}
        className="self-start text-xs text-muted underline underline-offset-4 hover:text-ink"
        data-testid="set-up-again"
      >
        {DOORSTEP_COPY.another}
      </button>
    ) : null}
    {waiting !== undefined ? (
      <p className="text-xs text-muted" data-testid="set-up-match">
        {START_COPY.matchHint(waiting.who)}
      </p>
    ) : null}
    {!signedIn ? <p className="text-xs text-muted">{SIGN_IN_TO_PLAY}</p> : null}
  </div>
  );
}
