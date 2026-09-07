"use client";

import { useEffect, useState } from "react";

import { INPUT_CLASS } from "@/components/ui/ui.constants";

import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { GameReaction } from "@/lib/history/gameHistory.types";
import {
  MESSAGE_MAX,
  REACTIONS,
  REACTION_SHOW_MS,
  type ReactionEmoji,
} from "@/lib/history/reactions.constants";

/**
 * The emoji a seat holder can send. Each button reacts to the last move
 * played, which is nearly always what a player means; the caption says so.
 */
export function ReactionBar({
  lastMove,
  disabled,
  onSend,
}: {
  lastMove: number | null;
  disabled: boolean;
  onSend: (emoji: ReactionEmoji, moveNumber: number | null, text: string | null) => void;
}) {
  const [text, setText] = useState("");

  const send = (emoji: ReactionEmoji) => {
    const message = text.trim();
    onSend(emoji, lastMove, message === "" ? null : message);
    setText("");
  };

  return (
    <div className="flex flex-col gap-2" data-testid="reaction-bar">
      <div className="flex flex-wrap items-center gap-1.5">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => send(reaction.emoji)}
            disabled={disabled}
            title={reaction.label}
            aria-label={`Send ${reaction.label}`}
            className="rounded-full border border-rule bg-white/70 px-2 py-1 text-lg leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-900/60"
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
      {/* A few words to go with the emoji. The emoji sends it; a message never goes alone. */}
      <input
        type="text"
        value={text}
        maxLength={MESSAGE_MAX}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && text.trim() !== "") send(REACTIONS[0].emoji);
        }}
        placeholder="Say something with it…"
        aria-label="Message to send with an emoji"
        className={`${INPUT_CLASS} text-xs`}
        data-testid="reaction-text"
      />
    </div>
  );
}

/** Reactions new enough to still be floating over the board. */
function fresh(reactions: GameReaction[], now: number): GameReaction[] {
  return reactions.filter(
    (reaction) => now - new Date(reaction.createdAt).getTime() < REACTION_SHOW_MS,
  );
}

/**
 * Incoming reactions, shown for a few seconds each and then let go. The list
 * arrives with the game on every poll, so nothing here asks the server for
 * anything: it only decides what is recent enough to still show.
 */
export function ReactionBubbles({
  reactions,
  yourStone,
}: {
  reactions: GameReaction[];
  yourStone: Stone | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  // Tick while anything is showing, so bubbles fade on time between polls.
  useEffect(() => {
    if (fresh(reactions, Date.now()).length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [reactions]);

  const showing = fresh(reactions, now);
  if (showing.length === 0) return null;

  return (
    <div
      className="pointer-events-none flex flex-wrap justify-end gap-2"
      aria-live="polite"
      data-testid="reaction-bubbles"
    >
      {showing.map((reaction) => {
        const mine = reaction.stone === yourStone;
        const label = REACTIONS.find((entry) => entry.emoji === reaction.emoji)?.label ?? "";
        return (
          <span
            key={reaction.id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm shadow-sm ${
              mine
                ? "border-zinc-300 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/70"
                : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60"
            }`}
            data-testid={mine ? "reaction-mine" : "reaction-theirs"}
          >
            <span className="text-xl leading-none">{reaction.emoji}</span>
            <span className="text-xs text-muted">
              {mine ? "You" : STONE_DISPLAY[reaction.stone as Stone]?.label ?? reaction.stone}
              {reaction.moveNumber !== null ? ` · move ${reaction.moveNumber}` : ""}
              {reaction.text ? "" : label ? ` · ${label}` : ""}
            </span>
            {reaction.text ? (
              <span className="max-w-[16rem] text-sm" data-testid="reaction-message">
                {reaction.text}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

/** The last few reactions, kept on the page after their bubbles have gone. */
export function ReactionLog({ reactions }: { reactions: GameReaction[] }) {
  const recent = reactions.slice(-8);
  if (recent.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-1 text-xs text-muted" data-testid="reaction-log">
      {recent.map((reaction) => (
        <span
          key={reaction.id}
          title={`${reaction.stone}${reaction.moveNumber !== null ? `, move ${reaction.moveNumber}` : ""}${reaction.text ? `: ${reaction.text}` : ""}`}
        >
          <span
            aria-hidden="true"
            className={`mr-0.5 inline-block size-2 rounded-full align-middle ${
              reaction.stone === "black"
                ? "bg-zinc-900 dark:bg-zinc-100"
                : "border border-zinc-400 bg-white"
            }`}
          />
          {reaction.emoji}
          {reaction.text ? <span className="ml-1 text-zinc-700 dark:text-zinc-200">{reaction.text}</span> : null}
        </span>
      ))}
    </p>
  );
}
