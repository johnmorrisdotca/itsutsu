"use client";

import { Button } from "@/components/ui/Controls";
import { TAP_HEIGHT } from "@/components/ui/ui.constants";
import { COLOUR_CHOICES, type ColourChoice } from "./colourChoice";
import { MATCH_SIZES, type MatchSize } from "@/lib/history/liveMatch";
import { START_COPY } from "@/components/mine/mine.constants";

import { PressLabel } from "@/components/ui/PressLabel";

import { DOORSTEP_COPY, SET_UP_COPY, SIGN_IN_TO_PLAY, START_PRESS } from "./live.constants";

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
  colour,
  games,
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
  /**
   * The seat the asker takes, where it is theirs to choose — null where it is
   * not (a rematch, a fork, a posted seat, an opening that decides colours),
   * and then nothing is drawn. See `colourChoice.ts`.
   */
  colour: { value: ColourChoice; onChange: (choice: ColourChoice) => void } | null;
  /** How many games at once, offered wherever the colour is: see `liveMatch.ts`. */
  games: { value: MatchSize; onChange: (count: MatchSize) => void } | null;
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
      {/*
        WHICH SEAT, where it is yours to say. Whoever asked was always black —
        the opener, who in most of these games has the better of it — so making
        the game meant taking the better seat every time. Three answers, as
        GoldToken's step 2 asks them; the sentence above says which it is, and
        the lot is drawn as Begin is pressed rather than before.
      */}
      {colour !== null ? (
        <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="set-up-colour" role="radiogroup" aria-label={SET_UP_COPY.colour.label}>
          <span className="text-muted">{SET_UP_COPY.colour.label}</span>
          {(Object.values(COLOUR_CHOICES) as ColourChoice[]).map((choice) => (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={colour.value === choice}
              onClick={() => colour.onChange(choice)}
              className={`rounded-full border px-2.5 py-1 ${TAP_HEIGHT} ${
                colour.value === choice ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink-soft"
              }`}
              data-testid={`set-up-colour-${choice}`}
            >
              {SET_UP_COPY.colour[choice]}
            </button>
          ))}
        </div>
      ) : null}
      {/*
        HOW MANY GAMES, where the colour is yours to say. More than one is a
        match with the colours alternating, so the better seat evens out over
        it rather than resting on one choice — GoldToken's No / Two-game /
        Four-game / Six-game.
      */}
      {games !== null ? (
        <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="set-up-games" role="radiogroup" aria-label={SET_UP_COPY.games.label}>
          <span className="text-muted">{SET_UP_COPY.games.label}</span>
          {MATCH_SIZES.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={games.value === count}
              onClick={() => games.onChange(count)}
              className={`rounded-full border px-2.5 py-1 ${TAP_HEIGHT} ${
                games.value === count ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink-soft"
              }`}
              data-testid={`set-up-games-${count}`}
            >
              {count === 1 ? SET_UP_COPY.games.one : SET_UP_COPY.games.many(count)}
            </button>
          ))}
        </div>
      ) : null}
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
        NOT WRAPPED IN A SHRINKING SPAN. The button fills the column on a phone,
        and an inline wrapper around it takes that width straight back off
        again; at a desk it is the width of the Play under a game's picture.
      */}
      <div className="flex sm:w-72">
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
          play
          data-testid="set-up-start"
          /*
           * WHAT THIS PRESS WILL DO, on the button itself. Nearly always it
           * writes the game and lands on a board; where somebody has already
           * posted exactly this game it sits down at their seat and lands on
           * the same board with them. Both end on a board now, but a spec that
           * seeds a stranger's seat still wants to know which it pressed, and
           * afterwards is too late — the board rewrites its own address as it
           * hydrates. Said here, it is decided before the press.
           */
          data-press={waiting !== undefined ? "seat" : "begin"}
        >
          {busy
            ? START_PRESS.starting
            : made !== null
              ? SET_UP_COPY.board
              : waiting !== undefined
                ? SET_UP_COPY.continueToSeat(waiting.who)
                : <PressLabel {...START_PRESS.start} />}
        </Button>
      </div>
      {/*
        What the press does, in one line — and it depends on which press it
        is. Sitting down at somebody's posted seat lands on the board with
        them; beginning your own game lands on the board alone. Neither has a
        screen after it any more: the seat's rules are the ones this screen
        just settled, so a page restating them was a repeat.
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
