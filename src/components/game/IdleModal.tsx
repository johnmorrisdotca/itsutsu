"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { GAME_COPY } from "./game.constants";

/**
 * "Are you still there?" — shown when nothing has moved for a while, with the
 * page dimmed behind it. While it is up the game clock is paused, so a player
 * who wandered off is not flagged for it. One tap and the game carries on.
 *
 * It offers two answers, and it has to. This appears exactly when somebody has
 * stopped paying attention, so "I am done with this one" is at least as likely
 * a truth as "still here" — and for a while the only way to say it was to
 * dismiss the question and then navigate away by hand. A dialogue that is
 * easier to agree with than to leave gets agreed with by people who did not
 * mean it, which makes the answer worth less than no answer at all.
 */
export function IdleModal({ open, onConfirm }: { open: boolean; onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialog}
      onClose={onConfirm}
      onCancel={(event) => {
        event.preventDefault();
        onConfirm();
      }}
      aria-labelledby="idle-title"
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-rule bg-paper p-6 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      data-testid="idle-modal"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <p aria-hidden="true" className="font-mincho text-4xl leading-none">
          {GAME_COPY.idle.kanji}
        </p>
        <h2 id="idle-title" className="text-lg font-semibold">
          {GAME_COPY.idle.label}
        </h2>
        <p className="text-sm text-muted">{GAME_COPY.idleDetail}</p>
        <div className="flex w-full flex-col items-stretch gap-2">
          <Button onClick={onConfirm} strong data-testid="idle-confirm">
            {GAME_COPY.idleConfirm}
          </Button>
          {/*
            A link rather than a button: leaving is going somewhere, so it
            should behave like every other way of going somewhere — openable
            in a new tab, and readable as a destination before it is pressed.
          */}
          <Link
            href="/games"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} justify-center`}
            data-testid="idle-leave"
          >
            {GAME_COPY.idleLeave}
          </Link>
        </div>
        <p className="text-xs text-muted">{GAME_COPY.idleKept}</p>
      </div>
    </dialog>
  );
}
