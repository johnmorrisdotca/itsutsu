"use client";

import { useState } from "react";

import { MESSAGE_MAX, REACTIONS, type ReactionEmoji } from "@/lib/history/reactions.constants";

import { MOVE_NOTE_COPY } from "./live.constants";

/** A note to send with a move: an emoji, and a line of text if there is one. */
export type MoveNote = { emoji: ReactionEmoji; text: string | null };

/**
 * A NOTE WITH THE MOVE, offered at the moment of moving.
 *
 * John, 2026-09-16: ItsYourTurn puts a message box on the move screen, "right
 * where you are already deciding"; ours were further down the page, under the
 * board, where nobody looks while they are choosing a move. So the move bar
 * offers one, shut until asked for so the bar stays small on a phone, and it
 * goes to the other player with the move — the same emoji and message the
 * notes under the board send, pinned to the move just played.
 *
 * `onChange` hears null when there is nothing to send: no emoji picked and
 * nothing typed. Typing without picking sends 👋, the plain "hello" of the set.
 */
export function MoveNoteField({ onChange, disabled }: { onChange: (note: MoveNote | null) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState<ReactionEmoji | null>(null);
  const [text, setText] = useState("");

  function tell(nextEmoji: ReactionEmoji | null, nextText: string) {
    const words = nextText.trim();
    onChange(nextEmoji === null && words === "" ? null : { emoji: nextEmoji ?? "👋", text: words === "" ? null : words });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="self-start text-xs text-ink-soft underline underline-offset-4 disabled:opacity-50"
        data-testid="move-note-open"
      >
        {MOVE_NOTE_COPY.open}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5" data-testid="move-note">
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={MOVE_NOTE_COPY.label}>
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            role="radio"
            aria-checked={emoji === reaction.emoji}
            aria-label={reaction.label}
            title={reaction.label}
            disabled={disabled}
            onClick={() => {
              const next = emoji === reaction.emoji ? null : reaction.emoji;
              setEmoji(next);
              tell(next, text);
            }}
            className={`flex size-9 items-center justify-center rounded-lg border text-lg ${
              emoji === reaction.emoji ? "border-ink bg-ivory" : "border-rule"
            }`}
            data-testid="move-note-emoji"
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={text}
        maxLength={MESSAGE_MAX}
        placeholder={MOVE_NOTE_COPY.placeholder}
        disabled={disabled}
        onChange={(event) => {
          setText(event.target.value);
          tell(emoji, event.target.value);
        }}
        className="w-full rounded-lg border border-rule bg-paper px-2 py-1.5 text-sm"
        data-testid="move-note-text"
      />
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setEmoji(null);
          setText("");
          onChange(null);
        }}
        className="self-start text-xs text-muted underline underline-offset-4"
        data-testid="move-note-close"
      >
        {MOVE_NOTE_COPY.close}
      </button>
    </div>
  );
}
