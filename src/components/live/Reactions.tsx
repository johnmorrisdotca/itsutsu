"use client";

import { useEffect, useState } from "react";

import { INPUT_CLASS } from "@/components/ui/ui.constants";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { stoneName } from "@/lib/gomoku/seatWords";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { GameReaction } from "@/lib/history/gameHistory.types";
import {
  MESSAGE_MAX,
  QUICK_PHRASES,
  messageIn,
  REACTIONS,
  type ReactionEmoji,
} from "@/lib/history/reactions.constants";
import { reactionsShowing } from "@/lib/history/reactionsShowing";
import { useHydrated } from "@/lib/ui/hydrated";

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
  const say = useSpeaker();
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
            title={say.say(reaction.label)}
            aria-label={say.say("live.reactSend", { label: say.say(reaction.label) })}
            className="rounded-full border border-rule bg-ivory/70 px-2 py-1 text-lg leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
      {/*
        Above the box rather than beside the emoji, because they belong to the
        typing rather than to the reacting: they are the sentences somebody
        would otherwise be writing out. One tap sends the phrase with its own
        emoji, and anything already half-typed in the box is left alone — a
        quick phrase must never cost somebody the message they were composing.
      */}
      <div className="flex flex-wrap gap-1.5" data-testid="quick-phrases">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase.phrase}
            type="button"
            onClick={() => onSend(phrase.emoji, lastMove, phrase.text)}
            disabled={disabled}
            className="rounded-full border border-rule bg-ivory/70 px-2.5 py-1 text-xs text-ink-soft transition-colors hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="quick-phrase"
          >
            <span aria-hidden="true">{phrase.emoji}</span> {say.say(phrase.phrase)}
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
        placeholder={say.say("live.reactPlaceholder")}
        aria-label={say.say("live.reactMessage")}
        className={`${INPUT_CLASS} text-xs`}
        data-testid="reaction-text"
      />
    </div>
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
  const say = useSpeaker();
  const [tick, setTick] = useState(() => Date.now());

  // Tick while anything is showing, so bubbles fade on time between polls.
  useEffect(() => {
    if (reactionsShowing(reactions, Date.now()).length === 0) return;
    const timer = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(timer);
  }, [reactions]);

  /*
   * NO "NOW" UNTIL THE BROWSER HAS THE PAGE — the rule `useMatchClock` keeps.
   *
   * The server draws this too, with its own `Date.now()`, and a reaction that
   * expires in the instant the page loads was fresh in one drawing and gone in
   * the other, so React threw the server's markup away. Until hydration there
   * is no answer, and no answer shows no bubbles: the first render never reads
   * the clock, and the browser's next one says what is fresh.
   */
  const hydrated = useHydrated();
  const showing = reactionsShowing(reactions, hydrated ? tick : null);
  if (showing.length === 0) return null;

  return (
    <div
      className="pointer-events-none flex flex-wrap justify-end gap-2"
      aria-live="polite"
      data-testid="reaction-bubbles"
    >
      {showing.map((reaction) => {
        const mine = reaction.stone === yourStone;
        const found = REACTIONS.find((entry) => entry.emoji === reaction.emoji)?.label;
        const label = found === undefined ? "" : say.say(found);
        return (
          <span
            key={reaction.id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm shadow-sm ${
              mine
                ? "border-rule-strong bg-ivory/80"
                : "border-moss/50 bg-moss-soft"
            }`}
            data-testid={mine ? "reaction-mine" : "reaction-theirs"}
          >
            <span className="text-xl leading-none">{reaction.emoji}</span>
            <span className="text-xs text-muted">
              {mine ? say.say("live.reactYou") : (reaction.stone === "black" || reaction.stone === "white" ? stoneName(say, reaction.stone) : reaction.stone)}
              {reaction.moveNumber !== null ? ` · ${say.say("live.reactMove", { move: String(reaction.moveNumber) })}` : ""}
              {reaction.text ? "" : label ? ` · ${label}` : ""}
            </span>
            {reaction.text ? (
              <span className="max-w-[16rem] text-sm" data-testid="reaction-message">
                {messageIn(say, reaction.text)}
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
  const say = useSpeaker();
  const recent = reactions.slice(-8);
  if (recent.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-1 text-xs text-muted" data-testid="reaction-log">
      {recent.map((reaction) => (
        <span
          key={reaction.id}
          title={`${reaction.moveNumber !== null ? say.say("live.reactLog", { colour: reaction.stone === "black" || reaction.stone === "white" ? stoneName(say, reaction.stone) : reaction.stone, move: String(reaction.moveNumber) }) : reaction.stone}${reaction.text ? `: ${messageIn(say, reaction.text)}` : ""}`}
        >
          <span
            aria-hidden="true"
            className={`mr-0.5 inline-block size-2 rounded-full align-middle ${
              reaction.stone === "black"
                ? "bg-ink"
                : "border border-rule-strong bg-ivory"
            }`}
          />
          {reaction.emoji}
          {reaction.text ? <span className="ml-1 text-ink-soft">{messageIn(say, reaction.text)}</span> : null}
        </span>
      ))}
    </p>
  );
}
