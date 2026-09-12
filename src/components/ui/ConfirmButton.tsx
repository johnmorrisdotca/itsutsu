"use client";

import { useState, type ReactNode } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { Button } from "./Controls";
import { ASKING } from "./ui.constants";
import type { Asking } from "./ui.types";

/**
 * A button for something that cannot be taken back.
 *
 * Pressing it does not do the thing; it asks first, in the site's own words
 * and in place, the way starting a new game over an unfinished board has
 * asked since 0.55.0. That pattern is copied here rather than made into a
 * second one, and the native browser dialog it replaces is gone from the
 * site altogether.
 *
 * The asking is deliberately not a modal that a stray tap dismisses. It
 * stays until it is answered, and the answer is a button that says what will
 * happen — "Resign", not "OK" — because the word under a thumb is the last
 * thing anybody reads before a game ends.
 */
export function ConfirmButton({
  label,
  question,
  confirm,
  cancel = "No, leave it",
  onConfirm,
  onAsking,
  disabled = false,
  strong = false,
  title,
  className,
  testId,
}: {
  /** What the button says before it is pressed. */
  label: ReactNode;
  /** What is being asked, in a sentence. */
  question: string;
  /** The word on the button that does it. Says the act, never "OK". */
  confirm: string;
  cancel?: string;
  onConfirm: () => void;
  /**
   * Told when the question goes up and how it comes down, for anything that has
   * to hold still while it is up. The board takes this: it carries a player on
   * to their next game a moment after a move, and used to take an open resign
   * question away with it. Three states rather than a boolean — see `ASKING`.
   */
  onAsking?: (asking: Asking) => void;
  disabled?: boolean;
  strong?: boolean;
  title?: string;
  /**
   * The trigger's own classes, for the places that already have a look — the
   * small quiet button in a list of games. Left out, it is an ordinary
   * button like the one it replaces.
   */
  className?: string;
  /** Names three things: the button, the panel, and the answer. */
  testId: string;
}) {
  const [asking, setAsking] = useState(false);
  /*
   * WHY THE TRIGGER CARRIES A READY MARK.
   *
   * It is server-rendered, so it is a real button before React attaches — and
   * a press in that window does nothing at all: the question never goes up,
   * and a spec then fails on the `-yes` button it cannot find, which reads as
   * the confirmation being broken rather than as the press being early. One
   * mark here covers every act that asks first: resigning and calling off a
   * game, throwing an unfinished board away, opening or shutting the door.
   *
   * `readyHere` in e2e/support.ts is how a spec waits for it, because these
   * appear once per row and a page-wide `getByTestId` would be ambiguous.
   */
  const hydrated = useHydrated();

  /**
   * The one place the question's state changes, so it cannot be moved without
   * whatever is holding still behind it being told. `answered` is reported
   * BEFORE `onConfirm`, because what that sets going decides where the reader
   * ends up and must not be raced by a hold letting go.
   */
  function say(state: Asking) {
    setAsking(state === ASKING.asked);
    onAsking?.(state);
  }

  if (!asking) {
    if (className !== undefined) {
      return (
        <button
          type="button"
          onClick={() => say(ASKING.asked)}
          disabled={disabled}
          title={title}
          className={className}
          data-testid={testId}
          {...readyMark(hydrated)}
        >
          {label}
        </button>
      );
    }
    return (
      <Button
        onClick={() => say(ASKING.asked)}
        disabled={disabled}
        strong={strong}
        title={title}
        data-testid={testId}
        {...readyMark(hydrated)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-moss/40 bg-moss-soft px-3 py-2.5 text-ink"
      role="alertdialog"
      data-testid={`${testId}-confirm`}
    >
      <p className="text-sm font-semibold">{question}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            say(ASKING.answered);
            onConfirm();
          }}
          strong
          data-testid={`${testId}-yes`}
        >
          {confirm}
        </Button>
        <Button onClick={() => say(ASKING.dismissed)} data-testid={`${testId}-no`}>
          {cancel}
        </Button>
      </div>
    </div>
  );
}
