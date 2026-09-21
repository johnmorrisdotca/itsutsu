"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, SectionTitle } from "@/components/ui/Controls";
import { BUTTON_LEAD, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import type { RatingRefusal } from "@/lib/rating/rateable.constants";
import { beginGame, type BeginAction } from "./beginGame";
import { DoorstepPictures } from "./DoorstepPictures";
import { RulesStatement } from "./RulesStatement";
import { DOORSTEP_COPY, SIGN_IN_TO_PLAY } from "./live.constants";
import { useGameBegunHere } from "./doorstepMemory";
import type { RulesDraft } from "./rulesDraft";

/**
 * THE DOORSTEP. The page between the set-up screen's Continue and the board.
 *
 * John, having asked for it more times than anybody should have to: "I still DO
 * NOT, after asking many times, see a secondary page, after pressing Start the
 * game… we go straight to the game rather than the Doorstep screen which
 * confirms settings. We do not want to see that Game board with all the settings
 * on the side… show the settings before the board, as the board means we're
 * playing!!!!"
 *
 * WHY THE EARLIER ANSWERS MISSED, since it is worth not repeating. "Settle the
 * rules before the game exists" was read as ONE screen, and the setup screen at
 * /games/<game>/new was built properly: pickers, every rule, nothing written
 * until the button. It is two screens. One where you CHOOSE and one where you
 * READ BACK. A rematch arrives at setup with every field filled in and therefore
 * already reads like a confirmation — which is precisely why the work looked
 * finished while the thing he kept hitting, a fresh game, was untouched.
 *
 * SO THIS STATES AND DOES NOT ASK. No select, no toggle, no picker: prose, a
 * short table of the same facts, and two controls — go on, or go back. Anything
 * editable here would make it the second form it exists not to be, and would
 * reopen the window the setup screen closed, since a rule changed on the way to
 * a board is a rule nobody agreed to.
 *
 * AND IT IS THE ONLY PLACE A GAME IS CREATED FROM A SETUP. The POST that used to
 * sit behind Start lives here now, unchanged. That is what makes "nothing is
 * written until you say so" true of the whole flow rather than of one screen:
 * reaching this page costs nothing, reloading it costs nothing, and going back
 * from it costs nothing.
 */
export function Doorstep({
  variant,
  address,
  rules,
  refused,
  prose,
  seating,
  change,
  begin,
  signedIn,
  problem,
  lineage,
}: {
  variant: string;
  /**
   * This doorstep's own address, in its canonical form — what `beginLink` writes
   * for this draft.
   *
   * Used as the key the browser remembers a begun game under. Canonical rather
   * than whatever is in the bar, so that two orderings of the same parameters are
   * one doorstep rather than two, and passed in rather than read off
   * `window.location` so the value is the same on the server and here.
   */
  address: string;
  /** The rules this game will be played under, for the table under the prose. */
  rules: RulesDraft;
  /**
   * Why the game this page is about could never count, where that is settled
   * before it exists — `hotSeat` for a fork with nobody, from the same
   * `seatsFor` answer the prose and the seating sentence were built from, and
   * null for everything else.
   *
   * The table under the prose has a Ratings row, and the draft alone cannot
   * fill it in honestly: a fork of a rated game carries `rated: true` into a
   * board at one screen, which will move no rating whatever the row says.
   */
  refused: RatingRefusal | null;
  /** The game and everything it is played under, in sentences. */
  prose: string;
  /** Who plays which colour — or why that is not decided yet. */
  seating: string;
  /** Back to the setup screen, carrying every choice. A link, not a browser back. */
  change: string;
  /** What pressing Begin does: write a new game, or take a seat somebody posted. */
  begin: BeginAction;
  signedIn: boolean;
  /** Why the address could not be honoured in full, when it could not. */
  problem: string | null;
  /**
   * Whether this is playing an earlier game again, where it came from a rematch —
   * still one, changed, or a new game against somebody else. Null otherwise.
   */
  lineage: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /*
   * The game this doorstep has already made, if it has — see `doorstepMemory`
   * for why the browser holds that and the server is not asked.
   */
  const [made, setMade] = useGameBegunHere(`doorstep:${address}`);
  /*
   * The seat this was going to take has been taken by somebody else.
   *
   * Two people asking for the same game is a race, and sometimes the other one
   * wins it between this page being drawn and Begin being pressed. The screen
   * before this one used to fall through and post a game of its own without
   * mentioning it — which is the right destination reached in the wrong way: a
   * press that said one person's name should never quietly do something else.
   *
   * So the refusal is said, and the same button then offers the game of your own
   * that you were going to get anyway. Nothing is a dead end and nothing is
   * silent.
   */
  const [seatGone, setSeatGone] = useState(false);
  const ready = useHydrated();
  const taking = begin.kind === "sit" && !seatGone;

  async function go() {
    /*
     * Nothing at all if this doorstep has already been said yes to. The button is
     * labelled for it and the notice above says so, and this is the guard behind
     * both: a second press is somebody asking for the game they already have.
     */
    if (made !== null) {
      router.push(made);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      /*
       * Take the seat, or make the game — and after a lost race, make the game
       * the seat was standing in for. All three shapes are in `beginGame`, which
       * the set-up screen presses too, so one request cannot drift from the other.
       */
      const landed = await beginGame({ begin, variant, taking });
      if (typeof landed !== "string") {
        setError(landed.error);
        // A seat that could not be taken is a seat somebody else has. Say so, and
        // let the next press make the game this was going to be instead.
        if (taking) setSeatGone(true);
        return;
      }
      setMade(landed);
      router.push(landed);
    } finally {
      setBusy(false);
    }
  }

  /** Forget the game this address made, so it can honestly make another. */
  function another() {
    setMade(null);
    setError(null);
  }

  return (
    <section
      className={`${PANEL_CLASS} flex flex-col gap-3`}
      data-testid="doorstep"
      {...readyMark(ready)}
    >
      <SectionTitle kanji={DOORSTEP_COPY.kanji}>{DOORSTEP_COPY.title}</SectionTitle>

      {problem !== null ? (
        <p
          className="rounded-lg border border-ochre/60 bg-ochre-soft px-3 py-2 text-xs text-ink"
          data-testid="doorstep-problem"
        >
          {problem}
        </p>
      ) : null}

      {/*
        THE BOARD THAT WAS CHOSEN, AS THE PICTURE THAT CHOSE IT — the big
        numbered mark from the set-up block, larger, and its name. John: "since
        this is the last page before the game... perhaps we use new larger
        icons?" A picture, not a control: nothing on it can be pressed.
      */}
      <DoorstepPictures rules={rules} />

      {/*
        THE WHOLE GAME IN A PARAGRAPH, which is the form a confirmation takes. A
        list of labelled rows is a form with its controls taken out; a sentence is
        something a person reads once and either accepts or goes back from.
      */}
      <p className="text-sm leading-relaxed font-semibold text-ink" data-testid="doorstep-statement">
        {prose}
      </p>
      {/*
        And the fact people most want, on its own line rather than buried in the
        paragraph: a rematch swaps the colours, and finding that out from the board
        three moves in is how it used to go.
      */}
      {/*
        Whether this is playing an earlier game again, where it came from a
        rematch. Said on its own line because the set-up screen lets a rematch's
        player be changed, and a new game against somebody else must not read as
        the rematch it started from.
      */}
      {lineage !== null ? (
        <p className="text-sm leading-relaxed text-ink-soft" data-testid="doorstep-lineage">
          {lineage}
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-ink-soft" data-testid="doorstep-colours">
        {seating}
      </p>

      {/*
        The same facts as rows, in the same words the board will use once this is a
        game — so what somebody agreed to and what they are playing read the same.
        Read-only, and it is the same component the board shows, which is what
        keeps the two from drifting.
      */}
      <div data-testid="doorstep-facts">
        <RulesStatement rules={rules} refusal={refused} note={DOORSTEP_COPY.note} />
      </div>

      {made !== null ? (
        <p className="text-xs text-moss" data-testid="doorstep-made">
          {DOORSTEP_COPY.made}
        </p>
      ) : null}
      {error !== null ? (
        <p className="text-xs text-shu" data-testid="doorstep-error">
          {error}
        </p>
      ) : null}

      {/*
        THE PRESS, THEN THE WAY BACK, STACKED ON A PHONE. Begin filled a third
        of the row and "Change something" sat beside it as a text link, which
        on glass is a small target next to a smaller one. Begin takes the
        column here and the way back sits under it, both a fingertip tall.
      */}
      <div className="mt-1 flex flex-col items-stretch gap-3 border-t border-rule pt-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button onClick={go} disabled={busy || !signedIn} strong lead data-testid="doorstep-begin">
          {busy
            ? DOORSTEP_COPY.beginning
            : made !== null
              ? DOORSTEP_COPY.board
              : taking && begin.kind === "sit"
                ? DOORSTEP_COPY.sit(begin.who)
                : DOORSTEP_COPY.begin}
        </Button>
        {/*
          A LINK, and that matters: a browser back would be the same address
          rendered from a cache, and the way back has to work from an address
          somebody reloaded, bookmarked or was sent. It carries every answer, so
          nothing is asked twice.
        */}
        <Link
          href={change}
          className={`${BUTTON_LEAD} ${BUTTON_QUIET} sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:font-medium sm:underline sm:underline-offset-4 sm:hover:bg-transparent sm:hover:text-ink`}
          data-testid="doorstep-change"
        >
          {DOORSTEP_COPY.change}
        </Link>
        {/*
          Nothing is a dead end, including this. Somebody who really wants a second
          game of exactly this can have one — it just cannot happen by pressing the
          same button twice without noticing.
        */}
        {made !== null ? (
          <button
            type="button"
            onClick={another}
            className="text-xs text-muted underline underline-offset-4 hover:text-ink"
            data-testid="doorstep-again"
          >
            {DOORSTEP_COPY.another}
          </button>
        ) : null}
      </div>

      {!signedIn ? (
        <p className="text-xs text-muted">{SIGN_IN_TO_PLAY}</p>
      ) : null}
    </section>
  );
}

export type { BeginAction };
