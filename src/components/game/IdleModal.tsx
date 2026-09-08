"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";

/**
 * "Are you still there?" — shown when nothing has moved for a while, with the
 * page dimmed behind it. While it is up the game clock is paused, so a player
 * who wandered off is not flagged for it. One tap and the game carries on.
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
        <Button onClick={onConfirm} strong data-testid="idle-confirm">
          {GAME_COPY.idleConfirm}
        </Button>
      </div>
    </dialog>
  );
}
